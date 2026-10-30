import type { Icon as TablerIcon } from "@tabler/icons-react"
import {
  IconCubeSend,
  IconShieldLock,
  IconSpeakerphone,
  IconTool,
} from "@tabler/icons-react"
import { createSelectSchema } from "drizzle-zod"
import type { LucideIcon } from "lucide-react"
import * as z from "zod"

import { notificationTable } from "@/server/db/schema"

type NotificationTypeConfig<T extends z.ZodType> = {
  icon: TablerIcon | LucideIcon
  metadataSchema: T
}

export const notificationRegistry = {
  announcement: {
    icon: IconSpeakerphone,
    metadataSchema: z.object({}),
  },
  maintenance: {
    icon: IconTool,
    metadataSchema: z.object({
      endsAt: z.coerce.date().optional(),
      startsAt: z.coerce.date().optional(),
    }),
  },
  release: {
    icon: IconCubeSend,
    metadataSchema: z.object({
      title: z.string(),
    }),
  },
  security: {
    icon: IconShieldLock,
    metadataSchema: z.object({
      title: z.string(),
    }),
  },
} satisfies Record<string, NotificationTypeConfig<z.ZodType>>

export type NotificationType = keyof typeof notificationRegistry

const notificationTypeKeys = Object.keys(notificationRegistry) as [
  NotificationType,
  ...NotificationType[],
]
const notificationTypeSchema = z.enum(notificationTypeKeys)

const notificationSeveritySchema = z.enum(["info", "warning", "critical"])
export type NotificationSeverity = z.infer<typeof notificationSeveritySchema>

const selectNotificationRowSchema = createSelectSchema(notificationTable, {
  severity: notificationSeveritySchema,
  type: notificationTypeSchema,
})

export const selectNotificationSchema = selectNotificationRowSchema.extend({
  readAt: z.date().nullable(),
})

export type Notification = z.infer<typeof selectNotificationSchema>
