import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that should be accessible to both signed-in and signed-out users.
const isPublicRoute = createRouteMatcher(["/"]);

export default clerkMiddleware((auth, req) => {
  // Restrict routes to signed-in users unless they are public.
  if (!isPublicRoute(req)) {
    auth.protect();
  }
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
