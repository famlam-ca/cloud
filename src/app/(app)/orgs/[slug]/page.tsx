import type { Icon as IconType } from "@tabler/icons-react"
import { IconKey, IconUser } from "@tabler/icons-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api, HydrateClient } from "@/lib/api/server"
import { organizationPath } from "@/lib/organization-path"
import { cn, getApiVersion, getBaseUrl } from "@/lib/utils"
import { ActivityCard } from "@/modules/dashboard/ui/activity"
import { CloudMap } from "@/modules/dashboard/ui/cloud-map"
import { OrgResources } from "@/modules/dashboard/ui/org-resources"
import { requireSession } from "@/server/auth/utils"

interface ActionButtonProps {
  href: React.ComponentProps<typeof Link>["href"]
  label: string
  icon: IconType
}

function ActionButton({ href, label, icon: Icon }: ActionButtonProps) {
  return (
    <Button
      className="h-14 w-full justify-start gap-4 rounded-2xl bg-gray-50 pl-6 hover:bg-[color-mix(in_oklch,var(--color-gray-50),var(--foreground)_5%)] lg:h-16 dark:bg-card dark:hover:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)]"
      nativeButton={false}
      render={<Link href={href} />}
      variant="secondary"
    >
      <Icon className="size-6 stroke-primary" />
      <span className="text-lg">{label}</span>
    </Button>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const org = await api.organization.get()
  return { title: `Dashboard - ${org.name}` }
}

export const INFO_CARDS = [
  {
    description:
      "Find all our services and features in one place. Enjoy services from media streaming to cloud computing, and everything in between, all in one convenient location.",
    link: "https://hub.famlam.ca",
    title: "HHN Hub",
  },
  {
    description:
      "Discover our extensive library of tutorials and guides. Learn how to create and manage virtual machines, configure networking, and optimize your cloud infrastructure.",
    link: "https://wiki.famlam.ca",
    title: "Wiki",
  },
  {
    description:
      "Explore our comprehensive REST API documentation. Access detailed documentation, review API versioning, and discover all the features available to virtualize your infrastructure.",
    link: `${getBaseUrl()}/api/v${getApiVersion()}`,
    title: "API Docs",
  },
]

export default async function Page({ params }: PageProps<"/orgs/[slug]">) {
  await requireSession()
  const { slug } = await params

  await Promise.all([
    api.organization.resourceSummary.prefetch(),
    api.activity.list.prefetchInfinite({
      limit: DEFAULT_PAGE_SIZE,
      scope: "organization",
    }),
  ])

  return (
    <HydrateClient>
      <div
        className={cn(
          "flex flex-col gap-4 lg:flex-row",
          "[--activities-header-height:--spacing(16)] [--dashboard-0rg-resources-header-height:--spacing(8)] [--dashboard-card-height:calc(100dvh-40dvh)] md:[--dashboard-card-height:calc(100dvh-55dvh)]",
        )}
      >
        <div className="inline-flex h-(--dashboard-card-height) flex-1 flex-col overflow-y-hidden rounded-t-2xl lg:flex-row lg:rounded-r-none lg:rounded-l-2xl">
          <div className="w-full overflow-auto rounded-t-2xl lg:flex-1 lg:rounded-r-none lg:rounded-l-2xl">
            <CloudMap />
          </div>
          <OrgResources />
        </div>
        <ActivityCard
          className="h-(--dashboard-card-height) w-full lg:max-w-sm"
          scope="organization"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <ActionButton
          href={organizationPath(slug)}
          icon={IconUser}
          label="Invite Member"
        />
        <ActionButton
          href={organizationPath(slug, "ssh-keys")}
          icon={IconKey}
          label="Add SSH Key"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {INFO_CARDS.map((card) => (
          <a
            className="flex h-full flex-col items-start rounded-2xl bg-gray-50 p-6 hover:bg-[color-mix(in_oklch,var(--color-gray-50),var(--foreground)_5%)] dark:bg-card dark:hover:bg-[color-mix(in_oklch,var(--card),var(--foreground)_5%)]"
            href={card.link}
            key={card.title}
            rel="noopener noreferrer"
            target="_blank"
          >
            <div className="flex items-center gap-2">
              <p className="font-medium text-lg uppercase">{card.title}</p>
            </div>
            <p className="mt-4 text-foreground/95 text-sm">
              {card.description}
            </p>
          </a>
        ))}
      </div>
    </HydrateClient>
  )
}
