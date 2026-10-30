import { cn } from "cn"
import { formatDistanceToNowStrict } from "date-fns"
import type { Route } from "next"
import Link from "next/link"

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import type { Notification, NotificationSeverity } from "@/schemas/notification"
import { notificationRegistry } from "@/schemas/notification"

const severityStyles: Record<
  NotificationSeverity,
  { icon: string; row: string }
> = {
  critical: {
    icon: "stroke-destructive",
    row: "border-l-2 border-l-destructive",
  },
  info: {
    icon: "stroke-sky-500",
    row: "",
  },
  warning: {
    icon: "stroke-yellow-500",
    row: "border-l-2 border-l-yellow-500",
  },
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href)
}

export function notificationLink(href: string) {
  return (
    <Link
      href={href as Route}
      {...(isExternalHref(href) && {
        rel: "noopener noreferrer",
        target: "_blank",
      })}
    />
  )
}

interface NotificationItemProps {
  item: Notification
  onSelect: (item: Notification) => void
}

export function NotificationItem({ item, onSelect }: NotificationItemProps) {
  const Icon = notificationRegistry[item.type].icon
  const unread = !item.readAt
  const styles = severityStyles[item.severity]

  const render = item.href ? (
    notificationLink(item.href)
  ) : (
    <button type="button" />
  )

  return (
    <Item
      className={cn(
        "cursor-pointer items-start text-left",
        styles.row,
        unread && "bg-primary/5",
      )}
      onClick={() => onSelect(item)}
      render={render}
      size="sm"
    >
      <ItemMedia variant="icon">
        <Icon className={cn("mt-0.5", styles.icon)} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle
          className={cn(
            "line-clamp-2 text-sm font-semibold whitespace-normal normal-case",
            !unread && "text-muted-foreground font-medium",
          )}
        >
          {item.title}
        </ItemTitle>
        {item.body && (
          <ItemDescription className="whitespace-pre-line">
            {item.body}
          </ItemDescription>
        )}
        <time
          className="text-muted-foreground text-xs"
          dateTime={item.publishedAt.toISOString()}
        >
          {formatDistanceToNowStrict(item.publishedAt, { addSuffix: true })}
        </time>
      </ItemContent>
      {unread && (
        <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full">
          <span className="sr-only">Unread</span>
        </span>
      )}
    </Item>
  )
}
