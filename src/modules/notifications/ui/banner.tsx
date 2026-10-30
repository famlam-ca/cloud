"use client"

import {
  IconAlertTriangleFilled,
  IconExternalLink,
  IconX,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import type { Notification } from "@/schemas/notification"

import { useMarkNotificationRead } from "../hooks/use-notification"
import { notificationLink } from "./notification-item"

interface NotificationBannerViewProps {
  notification: Pick<Notification, "title" | "body" | "href">
  onDismiss: () => void
}

function NotificationViewBanner({
  notification,
  onDismiss,
}: NotificationBannerViewProps) {
  const { body, href, title } = notification

  return (
    <div
      className="border-l-destructive bg-card text-card-foreground mt-1 mb-2 flex items-start gap-3 border-l-4 px-4 py-2.5 shadow-md"
      role="alert"
    >
      <IconAlertTriangleFilled className="text-destructive mt-0.5 size-6 shrink-0" />
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold">{title}</p>
        {body && (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed whitespace-pre-line">
            {body}
          </p>
        )}
      </div>
      {href && (
        <Button
          className="shrink-0 self-center"
          nativeButton={false}
          render={notificationLink(href)}
          size="xs"
          variant="outline"
        >
          Details <IconExternalLink />
        </Button>
      )}
      <Button
        aria-label="Dismiss"
        className="-mr-2 shrink-0 self-center"
        onClick={onDismiss}
        size="icon"
        variant="ghost"
      >
        <IconX />
      </Button>
    </div>
  )
}

export function NotificationBanner() {
  const { data } = api.notification.banner.useQuery(undefined, {
    refetchInterval: 60_000,
  })
  const markRead = useMarkNotificationRead()

  if (!data) return null

  return (
    <NotificationViewBanner
      notification={data}
      onDismiss={() => markRead.mutate({ id: data.id })}
    />
  )
}
