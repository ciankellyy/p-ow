
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes EXCEPT /api/vision/* (uses its own auth)
        "/(api(?!/vision|/admin/metrics)|trpc)(.*)",
        // Exclude status page from auth (handled by IP check in page/layout or ignored)
        // Note: The page component itself will need to handle auth if not protected here, 
        // but for the status page specifically we want IP bypass.
        "/((?!dashboard/status).*)",
    ],
};
