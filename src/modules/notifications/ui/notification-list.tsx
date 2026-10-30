import { IconBellCheck, IconSettings } from "@tabler/icons-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ItemGroup } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Notification } from "@/schemas/notification"

import { NotificationItem } from "./notification-item"

interface NotificationListViewProps {
  unreadItems: Notification[]
  readItems: Notification[]
  unreadCount: number
  isLoadingUnread: boolean
  isLoadingRead: boolean
  hasNextUnreadPage: boolean
  hasNextReadPage: boolean
  isFetchingNextUnreadPage: boolean
  isFetchingNextReadPage: boolean
  onLoadMoreUnread: () => void
  onLoadMoreRead: () => void
  onMarkAllRead: () => void
  onSelect: (item: Notification) => void
}

function EmptyNotifications() {
  return (
    <Empty className="p-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBellCheck />
        </EmptyMedia>
        <EmptyTitle className="text-base">You&apos;re all caught up</EmptyTitle>
        <EmptyDescription>
          System announcements and updates will show up here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function NotificationListView({
  unreadItems,
  readItems,
  unreadCount,
  isLoadingUnread,
  isLoadingRead,
  hasNextUnreadPage,
  hasNextReadPage,
  isFetchingNextUnreadPage,
  isFetchingNextReadPage,
  onLoadMoreUnread,
  onLoadMoreRead,
  onMarkAllRead,
  onSelect,
}: NotificationListViewProps) {
  return (
    <Tabs
      className="flex flex-col gap-0"
      defaultValue="unread"
      orientation="horizontal"
    >
      <div className="flex flex-col border-b-2 px-0 pb-0">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <h2 className="text-muted-foreground text-sm font-normal tracking-wider uppercase">
            Notifications
          </h2>
          <Badge
            className="bg-primary/10 text-primary font-normal"
            variant="secondary"
          >
            {unreadCount} New
          </Badge>
        </div>
        <div className="-mb-0.5 flex items-center justify-between gap-4">
          <TabsList variant="line">
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
          <Button
            className="text-foreground"
            nativeButton={false}
            render={<Link href="/" />}
            size="icon"
            variant="ghost"
          >
            <span className="sr-only">Notification settings</span>
            <IconSettings className="size-5" />
          </Button>
        </div>
      </div>
      <TabsContent value="unread">
        {isLoadingUnread ? (
          <div className="flex items-center justify-center p-8">
            <Spinner className="stroke-primary size-6" />
          </div>
        ) : unreadItems.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <ItemGroup className="gap-y-0!">
              {unreadItems.map((item) => (
                <li key={item.id}>
                  <NotificationItem item={item} onSelect={onSelect} />
                </li>
              ))}
            </ItemGroup>
            {hasNextUnreadPage && (
              <div className="flex justify-center p-3">
                <Button
                  disabled={isFetchingNextUnreadPage}
                  onClick={onLoadMoreUnread}
                  size="sm"
                  variant="secondary"
                >
                  {isFetchingNextUnreadPage ? (
                    <>
                      <Spinner />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="bg-popover w-full border-t">
          <Button
            className="text-muted-foreground w-full justify-start px-2"
            disabled={unreadCount === 0}
            onClick={onMarkAllRead}
            variant="ghost"
          >
            <IconBellCheck />
            Mark all as read
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="read">
        {isLoadingRead ? (
          <div className="flex items-center justify-center p-8">
            <Spinner className="stroke-primary size-6" />
          </div>
        ) : readItems.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <ItemGroup className="gap-y-0!">
              {readItems.map((item) => (
                <li key={item.id}>
                  <NotificationItem item={item} onSelect={onSelect} />
                </li>
              ))}
            </ItemGroup>
            {hasNextReadPage && (
              <div className="flex justify-center p-3">
                <Button
                  disabled={isFetchingNextReadPage}
                  onClick={onLoadMoreRead}
                  size="sm"
                  variant="secondary"
                >
                  {isFetchingNextReadPage ? (
                    <>
                      <Spinner />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
