import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Server utility to get the currently authenticated user's ID.
 * Can be used in server components, server actions, and API route handlers.
 */
export async function getCurrentUser(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * Reusable helper to verify if the currently authenticated user is the owner of a resource.
 * If authorized, it returns the user's ID.
 * Otherwise, it returns an object containing a pre-formatted NextResponse that can be 
 * returned from API route handlers immediately.
 */
export async function verifyResourceOwner(resourceUserId: string): Promise<
  | { userId: string; response?: undefined }
  | { userId?: undefined; response: NextResponse }
> {
  const authenticatedUserId = await getCurrentUser();

  if (!authenticatedUserId) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized: You must be logged in to perform this action." },
        { status: 401 }
      ),
    };
  }

  if (authenticatedUserId !== resourceUserId) {
    return {
      response: NextResponse.json(
        { error: "Forbidden: You do not have permission to access this resource." },
        { status: 403 }
      ),
    };
  }

  return { userId: authenticatedUserId };
}
