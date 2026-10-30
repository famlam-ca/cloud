import { and, eq, gt, gte, isNull, lte, or } from "drizzle-orm"

import type { User } from "@/server/auth/utils"
import { notificationReadTable, notificationTable } from "@/server/db/schema"

export function visibleNotificationsFor(user: Pick<User, "id" | "createdAt">) {
  const now = new Date()

  return and(
    lte(notificationTable.publishedAt, now),
    or(
      isNull(notificationTable.expiresAt),
      gt(notificationTable.expiresAt, now),
    ),
    or(isNull(notificationTable.userId), eq(notificationTable.userId, user.id)),
    gte(notificationTable.publishedAt, user.createdAt),
  )
}

export function readByUser(userId: string) {
  return and(
    eq(notificationReadTable.notificationId, notificationTable.id),
    eq(notificationReadTable.userId, userId),
  )
}
