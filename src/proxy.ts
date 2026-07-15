import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  const isCandidateDashboard = pathname.startsWith("/dashboard/candidate")
  const isRecruiterDashboard = pathname.startsWith("/dashboard/recruiter")

  if (isCandidateDashboard || isRecruiterDashboard) {
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isCandidateDashboard && token.role !== "CANDIDATE") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (isRecruiterDashboard && token.role !== "RECRUITER") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
