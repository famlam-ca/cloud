import type { Metadata } from "next"

import { api, HydrateClient } from "@/lib/api/server"
import { SshKeysList } from "@/modules/ssh-keys/ui/ssh-key-list/list"

export const metadata: Metadata = {
  description: "Manage your SSH keys",
  title: "SSH Keys",
}

export default async function Page({
  searchParams,
}: PageProps<"/orgs/[slug]/ssh-keys">) {
  const { new: newParamValue } = await searchParams
  const newParam = typeof newParamValue === "string" ? newParamValue : undefined

  await api.sshKey.list.prefetch()

  return (
    <HydrateClient>
      <SshKeysList new={newParam} />
    </HydrateClient>
  )
}
