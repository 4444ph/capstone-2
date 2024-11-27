import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/uploadthing(.*)',
  '/api/check-role(.*)'
]);

export default clerkMiddleware((auth, request) => {
  console.log(`Request received for: ${request.url}`);
  
  if (isPublicRoute(request)) {
    console.log('Public route access granted');
    return;
  }

  try {
    auth().protect();
    console.log('Protected route access granted');
  } catch (error) {
    console.error('Authentication failed', error);

    // Return a specific response for unauthorized access
    return new Response('Unauthorized', { status: 401 });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
