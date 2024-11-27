import { NextResponse } from "next/server";
import { checkRole } from "@/utils/roles";

export async function GET(req: Request) {
  // Add CORS headers
  const origin = req.headers.get("origin") || "*";

  // Allow preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Normal request logic
  const isTeacher = await checkRole("teacher");

  return new Response(JSON.stringify({ isTeacher }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    },
  });
}
