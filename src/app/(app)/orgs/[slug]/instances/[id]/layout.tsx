import { notFound } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { api, HydrateClient } from "@/lib/api/server"
import { InstanceDetailsInfo } from "@/modules/dashboard/ui/instance-details/info"
import { InstanceDetailsTabs } from "@/modules/dashboard/ui/instance-details/tabs"

export default async function Layout({
  children,
  params,
}: LayoutProps<"/orgs/[slug]/instances/[id]">) {
  const { id: instanceId } = await params

  if (!instanceId) return notFound()

  await api.instance.get.prefetch({ id: instanceId })

  return (
    <HydrateClient>
      <Card className="pb-0">
        <CardContent>
          <InstanceDetailsInfo instanceId={instanceId} />
          <InstanceDetailsTabs instanceId={instanceId} />
        </CardContent>
      </Card>
      <div className="mt-4">{children}</div>
    </HydrateClient>
  )
}
