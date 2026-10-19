import type { Metadata } from "next"

import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api, HydrateClient } from "@/lib/api/server"
import { InstanceList } from "@/modules/dashboard/ui/instance-list/list"
import { requireSession } from "@/server/auth/utils"

export const metadata: Metadata = {
  description: "Manage your instances",
  title: `Instances`,
}

export default async function Page({
  params,
}: PageProps<"/orgs/[slug]/instances">) {
  await requireSession()
  const { slug } = await params

  await api.instance.list.prefetchInfinite({ limit: DEFAULT_PAGE_SIZE })

  return (
    <HydrateClient>
      <InstanceList slug={slug} />
    </HydrateClient>
  )
}
