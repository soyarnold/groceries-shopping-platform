import type { AuthConfig } from "convex/server";

const clerkFrontendApiUrl = process.env.CLERK_FRONTEND_API_URL;
if (!clerkFrontendApiUrl) {
  throw new Error("Missing CLERK_FRONTEND_API_URL for Convex auth config");
}

export default {
  providers: [
    {
      // Clerk Frontend API URL — also set as CLERK_FRONTEND_API_URL on the Convex deployment
      domain: clerkFrontendApiUrl,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
