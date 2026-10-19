"use client"

import { IconBell, IconChevronRight } from "@tabler/icons-react"
import { formatDate, formatDistanceToNowStrict } from "date-fns"
import { CircleQuestionMarkIcon } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Hint } from "@/components/hint"
import { InfiniteScroll } from "@/components/infinite-scroll"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import type { RouterInputs } from "@/lib/api/client"
import { api } from "@/lib/api/client"
import {
  organizationPath,
  organizationSlugFromPath,
} from "@/lib/organization-path"
import { cn } from "@/lib/utils"
import { activityRegistry, renderActivity } from "@/schemas/activity"

interface ActivityCardProps {
  scope: RouterInputs["activity"]["list"]["scope"]
  instanceId?: string
  className?: string
}

export function ActivityCard({
  scope,
  instanceId,
  className,
}: ActivityCardProps) {
  const pathname = usePathname()
  const slug = pathname ? organizationSlugFromPath(pathname) : undefined
  const activityPath = slug ? organizationPath(slug, "activity") : "/"

  const [activity, query] = api.activity.list.useSuspenseInfiniteQuery(
    {
      ...(scope === "instance" ? { instanceId } : {}),
      limit: DEFAULT_PAGE_SIZE,
      scope,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: 60000,
    },
  )

  return (
    <Card className={cn("@container pb-2", className)}>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="mb-4 flex items-center justify-between gap-2 px-0">
          <CardTitle className="flex items-center gap-2">
            <IconBell className="size-5 stroke-primary" />
            <p className="text-lg uppercase">Activity</p>
          </CardTitle>
          <Button
            className="px-0"
            nativeButton={false}
            render={<Link href={activityPath} />}
            size="sm"
            variant="link"
          >
            View All <IconChevronRight />
          </Button>
        </CardHeader>
        <ScrollArea className="-mx-4 min-h-0 flex-1">
          <ItemGroup className="gap-y-0!">
            {activity.pages.flatMap((page) => page.items).length ? (
              activity.pages
                .flatMap((page) => page.items)
                .map((item) => {
                  const Icon =
                    activityRegistry[item.type as keyof typeof activityRegistry]
                      ?.icon

                  return (
                    <Item
                      className="group/activity flex-row items-start @lg:px-4 px-1"
                      key={item.id}
                      render={
                        <Link
                          href={
                            (slug
                              ? organizationPath(slug, `activity/${item.id}`)
                              : "/") as Route
                          }
                        />
                      }
                    >
                      <ItemMedia>
                        <Avatar>
                          <AvatarFallback>
                            <Icon className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                      </ItemMedia>
                      <ItemContent>
                        <Hint
                          align="start"
                          label={item.type}
                          side="top"
                          sideOffset={8}
                        >
                          <ItemTitle className="line-clamp-1 text-left font-normal text-base">
                            {renderActivity(item)}
                          </ItemTitle>
                        </Hint>
                        <ItemDescription className="line-clamp-2 text-xs capitalize">
                          {item.referenceType}
                        </ItemDescription>
                      </ItemContent>
                      <ItemContent className="flex-none shrink-0">
                        <Hint
                          label={formatDate(new Date(item.timestamp), "PPpp")}
                          side="top"
                          sideOffset={8}
                        >
                          <ItemDescription
                            className="truncate text-right"
                            suppressHydrationWarning
                          >
                            {formatDistanceToNowStrict(
                              new Date(item.timestamp),
                              { addSuffix: true },
                            )}
                          </ItemDescription>
                        </Hint>
                        <ItemDescription className="text-right text-foreground/70">
                          {item.actorType === "user" ? (
                            <HoverCard>
                              <HoverCardTrigger
                                className="-my-2.5"
                                closeDelay={100}
                                delay={10}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                render={
                                  <Button className="px-0" variant="link" />
                                }
                              >
                                {item.actorType}
                              </HoverCardTrigger>
                              {item.actorSnapshot && (
                                <HoverCardContent
                                  className="flex flex-row items-center gap-3"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                >
                                  <Avatar>
                                    <AvatarImage
                                      alt={item.actorSnapshot.name}
                                      src={item.actorSnapshot.image ?? ""}
                                    />
                                    <AvatarFallback>
                                      {item.actorSnapshot.name}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex w-full flex-col">
                                    <span className="text-sm">
                                      {item.actorSnapshot.name}
                                    </span>
                                    <span className="text-muted-foreground text-sm">
                                      {item.actorSnapshot.email}
                                    </span>
                                  </div>
                                </HoverCardContent>
                              )}
                            </HoverCard>
                          ) : (
                            item.actorType
                          )}
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                  )
                })
            ) : (
              <Item className="@lg:px-4 px-0">
                <ItemMedia variant="icon">
                  <CircleQuestionMarkIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>No activity found.</ItemTitle>
                  <ItemDescription>
                    There is no activity to display for this instance.
                  </ItemDescription>
                </ItemContent>
              </Item>
            )}
          </ItemGroup>
          <InfiniteScroll
            className={cn(query.hasNextPage ? "flex" : "hidden")}
            fetchNextPage={query.fetchNextPage}
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
