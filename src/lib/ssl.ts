import * as tls from "tls";

export interface SslCheckResult {
  valid: boolean;
  daysUntilExpiry: number | null;
  issuer: string | null;
  isExpiringSoon: boolean;
  error: string | null;
}

export function checkSSLCertificate(host: string): Promise<SslCheckResult> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: false,
        timeout: 10000,
      },
      () => {
        const cert = socket.getPeerCertificate();

        if (!cert || Object.keys(cert).length === 0) {
          socket.end();
          resolve({
            valid: false,
            daysUntilExpiry: null,
            issuer: null,
            isExpiringSoon: false,
            error: "No certificate received",
          });
          return;
        }

        const validTo = cert.valid_to;
        const now = new Date();
        const expiryDate = new Date(validTo);
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const issuerCN =
          cert.issuer && typeof cert.issuer === "object"
            ? extractCN(cert.issuer, "CN", "commonName")
            : "";

        socket.end();
        resolve({
          valid: daysUntilExpiry > 0,
          daysUntilExpiry,
          issuer: issuerCN || null,
          isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 30,
          error: null,
        });
      }
    );

    socket.on("error", (err: Error) => {
      socket.destroy();
      resolve({
        valid: false,
        daysUntilExpiry: null,
        issuer: null,
        isExpiringSoon: false,
        error: `TLS connection failed: ${err.message}`,
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        valid: false,
        daysUntilExpiry: null,
        issuer: null,
        isExpiringSoon: false,
        error: "Connection timed out",
      });
    });
  });
}

function extractCN(
  obj: Record<string, string | string[] | undefined> | undefined,
  ...keys: string[]
): string {
  if (!obj) return "";
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string") return val;
    if (Array.isArray(val) && val.length > 0) return val[0];
  }
  return "";
}