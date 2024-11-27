import { NextResponse } from "next/server";
import { checkRole } from "@/utils/roles";

export async function OPTIONS() {
  // Handle preflight requests
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow all origins for testing; restrict in production
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin") || "*";

  // Normal request logic
  const isTeacher = await checkRole("teacher");

  return new Response(JSON.stringify({ isTeacher }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin, // Match the request origin
    },
  });
}
