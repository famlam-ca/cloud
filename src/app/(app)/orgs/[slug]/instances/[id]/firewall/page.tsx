import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { api, HydrateClient } from "@/lib/api/server"
import { InstanceFirewallConfigurator } from "@/modules/dashboard/ui/instance-firewall/configurator"
import { requireSession } from "@/server/auth/utils"

export async function generateMetadata({
  params,
}: PageProps<"/orgs/[slug]/instances/[id]/firewall">): Promise<Metadata> {
  await requireSession()
  const { id: instanceId } = await params
  const instance = await api.instance.get({ id: instanceId })
  if (!instance) return redirect("/404")
  return {
    title: `${instance.hostname} Firewall`,
  }
}

export default async function Page({
  params,
}: PageProps<"/orgs/[slug]/instances/[id]/firewall">) {
  const { id: instanceId } = await params

  if (!instanceId) return redirect("/404")

  await Promise.all([
    api.firewallRule.list.prefetch({ instanceId }),
    api.instance.firewallStatus.prefetch({ instanceId }),
  ])

  return (
    <HydrateClient>
      <Card>
        <CardContent>
          <InstanceFirewallConfigurator instanceId={instanceId} />
        </CardContent>
      </Card>
    </HydrateClient>
  )
}
