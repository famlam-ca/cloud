import { redirect } from "next/navigation"

import { api } from "@/lib/api/server"
import { requireSession } from "@/server/auth/utils"

export default async function Page() {
  await requireSession()
  const organization = await api.organization.get()
  return redirect(`/orgs/${organization.slug}`)
}
