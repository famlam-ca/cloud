"use client"

import {
  IconApiApp,
  IconCamera,
  IconKey,
  IconMap,
  IconMapPin,
  IconNetwork,
  IconServer2,
  IconUsers,
  IconWall,
} from "@tabler/icons-react"
import { cn } from "cn"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api/client"
import {
  organizationPath,
  organizationSlugFromPath,
} from "@/lib/organization-path"

export function OrgResources() {
  const pathname = usePathname()
  const slug = pathname ? organizationSlugFromPath(pathname) : undefined
  const [resourceSummary] = api.organization.resourceSummary.useSuspenseQuery()

  const ORG_RESOURCES = [
    {
      icon: IconServer2,
      link: slug ? organizationPath(slug, "instances") : undefined,
      name: "Instances",
      value: resourceSummary.instanceCount,
    },
    {
      icon: IconKey,
      link: slug ? organizationPath(slug, "ssh-keys") : undefined,
      name: "SSH Keys",
      value: resourceSummary.sshKeyCount,
    },
    {
      icon: IconMapPin,
      name: "Primary IPs",
      value: resourceSummary.primaryIpCount,
    },
    // TODO: per organization networks
    {
      icon: IconNetwork,
      name: "Networks",
      value: resourceSummary.networkCount,
    },
    {
      icon: IconWall,
      name: "Firewall",
      value: resourceSummary.firewallRuleCount,
    },
    {
      icon: IconCamera,
      name: "Snapshots",
      value: resourceSummary.snapshotCount,
    },
    {
      icon: IconApiApp,
      name: "API Keys",
      value: resourceSummary.apiKeyCount,
    },
    {
      icon: IconUsers,
      name: "Members",
      value: resourceSummary.memberCount,
    },
  ]

  return (
    <div className="flex w-full flex-col bg-card lg:max-w-sm dark:bg-card">
      <div className="flex items-center justify-between border-b bg-muted px-4 py-2">
        <p className="text-muted-foreground uppercase">Org Resources</p>
        <IconMap className="size-4" />
      </div>
      <ScrollArea className="h-[calc(var(--dashboard-card-height)-var(--dashboard-0rg-resources-header-height))]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {ORG_RESOURCES.map((resource) => {
            const Icon = resource.icon

            return (
              <button
                className={cn(
                  "flex items-center gap-3 border px-6 py-4 text-left hover:bg-[color-mix(in_oklch,var(--color-gray-50),var(--foreground)_5%)] dark:hover:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)]",
                  resource.link ? "cursor-pointer" : "",
                )}
                key={resource.name}
                onClick={() =>
                  resource.link && window.location.assign(resource.link)
                }
                type="button"
              >
                <Icon className="size-7 stroke-[1.5] stroke-primary" />
                <div className="flex flex-col">
                  <p className="font-medium text-xl">{resource.value}</p>
                  <p className="text-wrap text-[15px] text-muted-foreground">
                    {resource.name}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
