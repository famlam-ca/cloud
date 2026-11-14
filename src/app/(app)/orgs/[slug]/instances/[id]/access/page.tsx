import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { HydrateClient, api } from "@/lib/api/server"
import { InstanceAccessConnection } from "@/modules/dashboard/ui/instance-access/connection"
import { InstanceAccessDetails } from "@/modules/dashboard/ui/instance-access/details"
import { requireSession } from "@/server/auth/utils"

export async function generateMetadata({
  params,
}: PageProps<"/orgs/[slug]/instances/[id]/access">): Promise<Metadata> {
  await requireSession()
  const { id: instanceId } = await params
  const instance = await api.instance.get({ id: instanceId })
  if (!instance) return redirect("/404")
  return {
    title: `${instance.hostname} Access`,
  }
}

export default async function Page({
  params,
}: PageProps<"/orgs/[slug]/instances/[id]/access">) {
  const { id: instanceId } = await params

  if (!instanceId) return redirect("/404")

  await api.instance.getSSHKeys.prefetch({ id: instanceId })

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <InstanceAccessDetails instanceId={instanceId} />
        <InstanceAccessConnection instanceId={instanceId} />
      </div>
    </HydrateClient>
  )
}
