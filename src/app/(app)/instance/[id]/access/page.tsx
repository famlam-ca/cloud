import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { api, HydrateClient } from "@/lib/api/server"
import { InstanceAccessConnection } from "@/modules/dashboard/ui/instance-access/connection"
import { InstanceAccessDetails } from "@/modules/dashboard/ui/instance-access/details"
import { requireSession } from "@/server/auth/utils"

export async function generateMetadata({
  params,
}: PageProps<"/instance/[id]/access">): Promise<Metadata> {
  await requireSession()
  const { id: instanceId } = await params
  const instance = await api.instance.get({ id: instanceId })
  if (!instance) return notFound()
  return {
    title: `${instance.hostname} Access`,
  }
}

export default async function Page({
  params,
}: PageProps<"/instance/[id]/access">) {
  const { id: instanceId } = await params

  if (!instanceId) return notFound()

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
