"use client";

/**
 * Returns a human-readable relative timestamp string.
 * e.g. "just now", "5m ago", "2h ago", "3d ago", "2mo ago"
 */
export function timeAgo(dateStr: string | Date): string {
  const now = Date.now();
  const then = typeof dateStr === "string" ? new Date(dateStr).getTime() : dateStr.getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/**
 * Formats a date string to a full locale date with tooltip-friendly format.
 */
export function formatFullDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * RelativeTime component renders "2h ago" with a full datetime tooltip.
 */
export function RelativeTime({ date, className }: { date: string | Date; className?: string }) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return (
    <span
      className={className}
      title={formatFullDate(dateObj)}
    >
      {timeAgo(dateObj)}
    </span>
  );
}