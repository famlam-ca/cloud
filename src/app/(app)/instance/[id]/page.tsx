import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api, HydrateClient } from "@/lib/api/server"
import { ActivityCard } from "@/modules/dashboard/ui/activity"
import { InstanceLocation } from "@/modules/dashboard/ui/instance-details/location"
import { InstanceOptions } from "@/modules/dashboard/ui/instance-details/options"
import { InstanceResources } from "@/modules/dashboard/ui/instance-details/resources"

export async function generateMetadata({
  params,
}: PageProps<"/instance/[id]">): Promise<Metadata> {
  const { id: instanceId } = await params
  const instance = await api.instance.get({ id: instanceId })
  return {
    title: `${instance.hostname} Overview`,
  }
}

export default async function Page({ params }: PageProps<"/instance/[id]">) {
  const { id: instanceId } = await params

  if (!instanceId) return notFound()

  await Promise.all([
    api.instance.get.prefetch({ id: instanceId }),
    api.activity.list.prefetchInfinite({
      instanceId,
      limit: DEFAULT_PAGE_SIZE,
      scope: "instance",
    }),
  ])

  return (
    <HydrateClient>
      <div className="flex flex-col gap-4">
        <InstanceResources instanceId={instanceId} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_3fr]">
          <ActivityCard
            className="md:contain-[size]"
            instanceId={instanceId}
            scope="instance"
          />
          <div className="flex flex-col gap-4">
            <InstanceOptions instanceId={instanceId} />
            <InstanceLocation instanceId={instanceId} />
          </div>
        </div>
      </div>
    </HydrateClient>
  )
}
