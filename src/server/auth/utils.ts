import { headers } from "next/headers"
import { redirect } from "next/navigation"
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

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
