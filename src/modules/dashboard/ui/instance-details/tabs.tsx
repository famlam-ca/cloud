"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { organizationSlugFromPath } from "@/lib/organization-path"

export const INSTANCE_DETAILS_TABS = [
  { label: "Overview", value: "overview" },
  { label: "Access", value: "access" },
  // { label: "Graphs", value: "graphs" },
  // { label: "Backups", value: "backups" },
  // { label: "Snapshots", value: "snapshots" },
  // { label: "Networking", value: "networking" },
  { label: "Firewall", value: "firewall" },
  // { label: "Volumes", value: "volumes" },
  // { label: "Power", value: "power" },
  // { label: "Rescue", value: "rescue" },
  // { label: "ISO Images", value: "images" },
  // { label: "Rescale", value: "rescale" },
  // { label: "Rebuild", value: "rebuild" },
  // { label: "Delete", value: "delete" },
]

export function InstanceDetailsTabs({ instanceId }: { instanceId: string }) {
  const pathname = usePathname()
  const slug = pathname ? organizationSlugFromPath(pathname) : undefined
  const instancePath = slug ? `/orgs/${slug}/instances/${instanceId}` : ""

  const activeTab =
    INSTANCE_DETAILS_TABS.find((tab) =>
      pathname?.startsWith(`${instancePath}/${tab.value}`),
    )?.value || "overview"

  return (
    <Tabs
      className="relative w-full"
      suppressHydrationWarning
      value={activeTab}
    >
      <ScrollArea>
        <TabsList className="mb-[0.05rem] gap-4 px-0" variant="line">
          {INSTANCE_DETAILS_TABS.map((tab) => (
            <TabsTrigger
              className="cursor-pointer text-base data-active:text-primary data-active:after:bg-primary! dark:data-active:text-primary"
              key={tab.value}
              nativeButton={false}
              render={
                <Link
                  href={
                    `${instancePath}/${tab.value === "overview" ? "" : tab.value}` as Route
                  }
                />
              }
              value={tab.value}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollArea>
      <div className="absolute right-0 bottom-px left-0 border-b-2" />
    </Tabs>
  )
}
