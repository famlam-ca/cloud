"use client"

import { IconBell } from "@tabler/icons-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { api } from "@/lib/api/client"
import type { Notification } from "@/schemas/notification"

import {
  NOTIFICATION_LIST_READ_INPUT,
  NOTIFICATION_LIST_UNREAD_INPUT,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../hooks/use-notification"
import { NotificationListView } from "./notification-list"

const POLL_INTERVAL_MS = 60_000

function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { data: unread } = api.notification.unreadCount.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
  })

  const listUnread = api.notification.list.useInfiniteQuery(
    NOTIFICATION_LIST_UNREAD_INPUT,
    {
      enabled: open,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: open ? POLL_INTERVAL_MS : false,
    },
  )
  const listRead = api.notification.list.useInfiniteQuery(
    NOTIFICATION_LIST_READ_INPUT,
    {
      enabled: open,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: open ? POLL_INTERVAL_MS : false,
    },
  )

  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const unreadItems = listUnread.data?.pages.flatMap((page) => page.items) ?? []
  const readItems = listRead.data?.pages.flatMap((page) => page.items) ?? []

  function handleSelect(item: Notification) {
    if (!item.readAt) markRead.mutate({ id: item.id })
    if (item.href) onClose()
  }

  return (
    <NotificationListView
      hasNextReadPage={listRead.hasNextPage}
      hasNextUnreadPage={listUnread.hasNextPage}
      isFetchingNextReadPage={listRead.isFetchingNextPage}
      isFetchingNextUnreadPage={listUnread.isFetchingNextPage}
      isLoadingRead={listRead.isLoading}
      isLoadingUnread={listUnread.isLoading}
      onLoadMoreRead={() => void listRead.fetchNextPage()}
      onLoadMoreUnread={() => void listUnread.fetchNextPage()}
      onMarkAllRead={() => markAllRead.mutate()}
      onSelect={handleSelect}
      readItems={readItems}
      unreadCount={unread?.count ?? 0}
      unreadItems={unreadItems}
    />
  )
}

export function NotificationBell() {
  const isMobile = useIsMobile()

  const [open, setOpen] = React.useState(false)

  const { data } = api.notification.unreadCount.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
  })
  const count = data?.count ?? 0

  const trigger = (
    <Button
      aria-label={
        count > 0 ? `Notifications, ${count} unread` : "Notifications"
      }
      className="relative"
      size="icon"
      variant="ghost"
    >
      <IconBell className="size-5" />
      {count > 0 && (
        <span
          aria-hidden
          className="bg-destructive absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold tracking-normal text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  )

  const panel = <NotificationPanel onClose={() => setOpen(false)} open={open} />

  if (isMobile) {
    return (
      <Drawer onOpenChange={setOpen} open={open}>
        <DrawerTrigger render={trigger} />
        <DrawerContent>
          <DrawerTitle className="sr-only">Notifications</DrawerTitle>
          {panel}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        align="end"
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
      >
        {panel}
      </PopoverContent>
    </Popover>
  )
}
