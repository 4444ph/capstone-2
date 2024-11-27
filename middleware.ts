import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/uploadthing(.*)',
  '/api/check-role(.*)',
]);

export default clerkMiddleware((auth, req) => {
  const res = NextResponse.next();

  // Add CORS headers for API routes
  if (req.url.startsWith('/api/')) {
    res.headers.set('Access-Control-Allow-Origin', '*'); // Adjust origin in production
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res; // Respond early with CORS headers
  }

  // Protect non-public routes
  if (!isPublicRoute(req)) {
    auth().protect(); // Clerk's built-in protection
  }

  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
