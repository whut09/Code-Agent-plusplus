import { createSession } from "@/auth/session";

export async function POST(): Promise<Response> {
  return new Response(createSession());
}
