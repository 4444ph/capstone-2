import { NextResponse } from "next/server";
import { checkRole } from "@/utils/roles";

export async function OPTIONS() {
  // Handle preflight requests (CORS setup)
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow all origins for testing; restrict in production
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Clerk-Auth",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin") || "*";

  try {
    // Verify user role (mocked `checkRole` function call)
    const isTeacher = await checkRole("teacher");

    // Respond with the role verification result
    return new Response(
      JSON.stringify({ isTeacher }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin, // Dynamically allow origin
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch (error) {
    console.error("Error in /api/check-role:", error);

    // Handle errors gracefully
    return new Response(
      JSON.stringify({
        message: "An error occurred while verifying the user role.",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
}
