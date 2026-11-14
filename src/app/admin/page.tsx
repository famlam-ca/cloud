import { requireAdminSession } from "@/server/auth/utils"

export default async function Page() {
  await requireAdminSession()

  return (
    <main>
      <h1>Page</h1>
    </main>
  )
}
