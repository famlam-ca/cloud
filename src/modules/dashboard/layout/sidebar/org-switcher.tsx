"use client"

import { IconPlus } from "@tabler/icons-react"
import type { Organization } from "better-auth/plugins"
import { ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import { authClient } from "@/lib/auth/client"

type OrganizationSummary = Pick<Organization, "id" | "name" | "slug" | "logo">

interface OrgSwitcherProps {
  activeOrg?: OrganizationSummary
  org: OrganizationSummary
}

function OrgInfo({ activeOrg, org }: OrgSwitcherProps) {
  return (
    <>
      <Avatar className="[--radius:0.625rem]">
        <AvatarImage alt={org.name} src={org.logo || undefined} />
        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
          {org.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="font-medium line-clamp-1">
          {org.name}{" "}
          {activeOrg?.id === org.id && (
            <span className="text-muted-foreground text-xs">(Active)</span>
          )}
        </span>
        <span className="text-muted-foreground line-clamp-1">{org.slug}</span>
      </div>
    </>
  )
}

export function OrgSwitcher({ org: activeOrgFromProps }: OrgSwitcherProps) {
  const router = useRouter()
  const utils = api.useUtils()
  const loaded = React.useRef(false)

  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [orgs, setOrgs] = React.useState<OrganizationSummary[]>([])
  const [activeOrg, setActiveOrg] =
    React.useState<OrganizationSummary>(activeOrgFromProps)

  async function lazyLoadOrganizations() {
    if (loaded.current || isLoading) return

    setIsLoading(true)
    setError(null)

    const { data, error } = await authClient.organization.list()

    if (error) {
      setError(error.message || "Failed to load organizations")
    } else {
      setOrgs(data)
      loaded.current = true
    }

    setIsLoading(false)
  }

  async function switchOrganization(orgId: string, orgSlug: string) {
    if (orgId === activeOrg?.id) return

    setIsLoading(true)
    setError(null)

    const { error } = await authClient.organization.setActive({
      fetchOptions: { cache: "no-store" },
      organizationId: orgId,
      organizationSlug: orgSlug,
    })

    if (error) {
      setError(error.message || "Failed to switch organization")
    } else {
      const nextOrg = orgs.find((org) => org.id === orgId)
      if (nextOrg) setActiveOrg(nextOrg)
      // TODO: Scope this correctly if it causes load time issues.
      await utils.invalidate()
      router.push(`/orgs/${orgSlug}`)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu
              onOpenChange={(next) => {
                setOpen(next)
                if (next) void lazyLoadOrganizations()
              }}
              open={open}
            >
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    size="lg"
                  />
                }
              >
                <OrgInfo org={activeOrg} />
                <ChevronsUpDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-(--anchor-width) md:w-[min(20rem,calc(100vw-2rem))]"
                side="right"
              >
                {error && (
                  <DropdownMenuItem className="text-destructive cursor-not-allowed">
                    {error}
                  </DropdownMenuItem>
                )}
                {orgs.length === 0 && isLoading && (
                  <DropdownMenuItem className="cursor-not-allowed justify-center">
                    <Spinner className="size-8" />
                  </DropdownMenuItem>
                )}
                {orgs.length > 0 &&
                  orgs.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => void switchOrganization(org.id, org.slug)}
                    >
                      <OrgInfo activeOrg={activeOrg} org={org} />
                    </DropdownMenuItem>
                  ))}

                <DropdownMenuItem className="border-t border-t-border mt-2">
                  <button
                    className="flex items-center gap-2"
                    onClick={() => alert("Coming soon!")}
                  >
                    <span className="flex items-center justify-center size-5 rounded bg-sidebar-primary text-sidebar-primary-foreground">
                      <IconPlus />
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Create Organization
                    </p>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
