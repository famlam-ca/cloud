"use client"

import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import type { Organization } from "better-auth/plugins"
import { cn } from "cn"
import { ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { CreateOrgModal } from "@/modules/dashboard/ui/org/create-modal"
import { DeleteOrgModal } from "@/modules/dashboard/ui/org/delete-modal"
import { UpdateOrgModal } from "@/modules/dashboard/ui/org/update-modal"

type OrganizationSummary = Pick<Organization, "id" | "name" | "slug" | "logo">

interface OrgSwitcherProps {
  org: OrganizationSummary
  showControls?: boolean
}

function OrgInfo({ org, showControls = false }: OrgSwitcherProps) {
  const isMobile = useIsMobile()
  const [openUpdateOrg, setOpenUpdateOrg] = React.useState(false)
  const [openDeleteOrg, setOpenDeleteOrg] = React.useState(false)

  return (
    <div className="flex items-center gap-2 w-full">
      <Avatar className="[--radius:0.625rem]">
        <AvatarImage alt={org.name} src={org.logo || undefined} />
        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
          {org.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5 leading-none">
        <span className="font-medium line-clamp-1">{org.name}</span>
        <span className="text-muted-foreground line-clamp-1">{org.slug}</span>
      </div>
      {showControls && (
        <span
          className={cn(
            "group-hover:opacity-100 ml-auto shrink-0 opacity-0",
            isMobile && "opacity-100",
          )}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <UpdateOrgModal
            onOpenChange={setOpenUpdateOrg}
            open={openUpdateOrg}
            org={{
              id: org.id,
              logo: org.logo,
              name: org.name,
            }}
            render={
              <Button size="icon-sm" variant="ghost">
                <IconEdit />
                <span className="sr-only">Update Organization</span>
              </Button>
            }
          />
          <DeleteOrgModal
            onOpenChange={setOpenDeleteOrg}
            open={openDeleteOrg}
            org={{ id: org.id }}
            render={
              <Button
                className="text-destructive! dark:text-destructive! hover:text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10 dark:hover:bg-destructive/20 dark:focus:text-destructive dark:focus:bg-destructive/20"
                size="icon-sm"
                variant="ghost"
              >
                <IconTrash />
                <span className="sr-only">Delete Organization</span>
              </Button>
            }
          />
        </span>
      )}
    </div>
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
                <div className="max-h-72 scroll-fade scrollbar-none overflow-y-auto">
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
                        className={cn(
                          "normal-case group",
                          org.slug === activeOrg?.slug &&
                            "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                        key={org.slug}
                        onClick={() => void switchOrganization(org.slug)}
                      >
                        <OrgInfo org={org} showControls={true} />
                      </DropdownMenuItem>
                    ))}
                </div>

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
