import { headers } from "next/headers"
import { forbidden, redirect } from "next/navigation"
import { cache } from "react"

import { auth } from "@/server/auth"

const getSession = cache(
  async () =>
    await auth.api.getSession({
      headers: await headers(),
    }),
)

export async function requireSession() {
  const session = await getSession()
  if (!session) return redirect("/auth/sign-in")
  return session
}

export async function requireAdminSession() {
  const session = await requireSession()
  if (session.user.role !== "admin") return forbidden()
  return session
}

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
