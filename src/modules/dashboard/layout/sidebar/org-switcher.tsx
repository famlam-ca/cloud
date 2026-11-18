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
import { useIsMobile } from "@/hooks/use-mobile"
import { api } from "@/lib/api/client"
import { authClient } from "@/lib/auth/client"
import { CreateOrgModal } from "@/modules/dashboard/ui/create-org-modal"

type OrganizationSummary = Pick<Organization, "name" | "slug" | "logo">

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
          {activeOrg?.slug === org.slug && (
            <span className="text-muted-foreground text-xs uppercase">
              (Active)
            </span>
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
  const isMobile = useIsMobile()

  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [openCreateOrg, setOpenCreateOrg] = React.useState(false)
  const [activeOrg, setActiveOrg] =
    React.useState<OrganizationSummary>(activeOrgFromProps)

  const {
    data: organizations,
    error: queryError,
    isPending,
  } = api.organization.list.useQuery(undefined, {
    enabled: open,
  })

  const orgs = organizations || []

  async function switchOrganization(orgSlug: string) {
    if (orgSlug === activeOrg?.slug) return

    setIsLoading(true)
    setError(null)

    const { error } = await authClient.organization.setActive({
      fetchOptions: { cache: "no-store" },
      organizationSlug: orgSlug,
    })

    if (error) {
      setError(error.message || "Failed to switch organization")
    } else {
      const nextOrg = orgs.find((org) => org.slug === orgSlug)
      if (nextOrg) setActiveOrg(nextOrg)
      // TODO: Scope this correctly if it causes load time issues.
      await utils.invalidate()
      router.push(`/orgs/${orgSlug}`)
    }
  }

  React.useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    if (activeOrgFromProps) setActiveOrg(activeOrgFromProps)
  }, [activeOrgFromProps])

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu
              onOpenChange={(next) => {
                setOpen(next)
                if (!next) setError(null)
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
                side={isMobile ? "bottom" : "right"}
              >
                {(error || queryError) && (
                  <DropdownMenuItem className="text-destructive cursor-not-allowed">
                    {error ||
                      queryError?.message ||
                      "Failed to load organizations"}
                  </DropdownMenuItem>
                )}
                {orgs.length === 0 && (isLoading || isPending) && (
                  <DropdownMenuItem className="cursor-not-allowed justify-center">
                    <Spinner className="size-8" />
                  </DropdownMenuItem>
                )}
                {orgs.length > 0 &&
                  orgs.map((org) => (
                    <DropdownMenuItem
                      className="normal-case"
                      key={org.slug}
                      onClick={() => void switchOrganization(org.slug)}
                    >
                      <OrgInfo activeOrg={activeOrg} org={org} />
                    </DropdownMenuItem>
                  ))}

                <DropdownMenuItem
                  className="border-t border-t-border mt-2"
                  closeOnClick={false}
                  onClick={() => setOpenCreateOrg(true)}
                >
                  <span className="flex items-center justify-center size-5 rounded bg-sidebar-primary text-sidebar-primary-foreground">
                    <IconPlus />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Create Organization
                  </p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <CreateOrgModal
              onOpenChange={(next) => setOpenCreateOrg(next)}
              open={openCreateOrg}
              showTrigger={false}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
