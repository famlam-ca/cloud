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
      <Card className="min-h-[calc(100dvh-var(--header-height)-2.3rem)]">
        <CardContent>
          <InstanceDetailsInfo instanceId={instanceId} />
          <InstanceDetailsTabs instanceId={instanceId} />
          <div className="mt-4">{children}</div>
        </CardContent>
      </Card>
    </HydrateClient>
  )
}
