"use server";

import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AuthResult =
  | { authorized: false }
  | { authorized: true; userId: string | null }; // userId null = cron, skip rate limit

export async function authenticate(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  ) {
    return { authorized: true, userId: null };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return { authorized: true, userId: user.id };
  return { authorized: false };
}
