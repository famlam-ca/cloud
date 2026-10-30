import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { TRPCError } from "@trpc/server"
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  isNull,
  lt,
  or,
} from "drizzle-orm"
import * as z from "zod"

import { selectNotificationSchema } from "@/schemas/notification"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"
import { notificationReadTable, notificationTable } from "@/server/db/schema"
import {
  readByUser,
  visibleNotificationsFor,
} from "@/server/queries/notification"

export const notificationRouter = createTRPCRouter({
  banner: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/notification/banner",
          summary: "Get the newest unread critical notification",
          tags: ["Notification"],
        }),
      ),
    )
    .output(selectNotificationSchema.nullable())
    .query(async ({ ctx }) => {
      const user = ctx.session.user

      const [notification] = await ctx.db
        .select({
          ...getTableColumns(notificationTable),
          readAt: notificationReadTable.readAt,
        })
        .from(notificationTable)
        .leftJoin(notificationReadTable, readByUser(user.id))
        .where(
          and(
            visibleNotificationsFor(user),
            eq(notificationTable.severity, "critical"),
            isNull(notificationReadTable.readAt),
          ),
        )
        .orderBy(
          desc(notificationTable.publishedAt),
          desc(notificationTable.id),
        )
        .limit(1)

      return notification ?? null
    }),

  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/notification/list",
          summary: "List notifications visible to the current user",
          tags: ["Notification"],
        }),
      ),
    )
    .input(
      z.object({
        cursor: z
          .object({
            id: z.uuid(),
            publishedAt: z.date(),
          })
          .nullish(),
        limit: z.int().positive().max(100),
        readOnly: z.boolean().optional(),
        unreadOnly: z.boolean().optional(),
      }),
    )
    .output(
      z.object({
        items: z.array(selectNotificationSchema),
        nextCursor: z
          .object({
            id: z.uuid(),
            publishedAt: z.date(),
          })
          .nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user

      const conditions = [visibleNotificationsFor(user)]

      if (input.cursor) {
        conditions.push(
          or(
            lt(notificationTable.publishedAt, input.cursor.publishedAt),
            and(
              eq(notificationTable.publishedAt, input.cursor.publishedAt),
              lt(notificationTable.id, input.cursor.id),
            ),
          ),
        )
      }
      if (input.unreadOnly) {
        conditions.push(isNull(notificationReadTable.readAt))
      }
      if (input.readOnly) {
        conditions.push(isNotNull(notificationReadTable.readAt))
      }

      const notifications = await ctx.db
        .select({
          ...getTableColumns(notificationTable),
          readAt: notificationReadTable.readAt,
        })
        .from(notificationTable)
        .leftJoin(notificationReadTable, readByUser(user.id))
        .where(and(...conditions))
        .orderBy(
          desc(notificationTable.publishedAt),
          desc(notificationTable.id),
        )
        .limit(input.limit + 1)

      const hasMore = notifications.length > input.limit
      const items = hasMore ? notifications.slice(0, -1) : notifications
      const lastItem = items[items.length - 1]
      const nextCursor =
        hasMore && lastItem
          ? { id: lastItem.id, publishedAt: lastItem.publishedAt }
          : null

      return {
        items,
        nextCursor,
      }
    }),

  markAllRead: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/notification/read-all",
          summary: "Mark every visible notification as read",
          tags: ["Notifications"],
        }),
      ),
    )
    .output(z.object({ marked: z.number() }))
    .mutation(async ({ ctx }) => {
      const user = ctx.session.user

      const unread = await ctx.db
        .select({ notificationId: notificationTable.id })
        .from(notificationTable)
        .leftJoin(notificationReadTable, readByUser(user.id))
        .where(
          and(
            visibleNotificationsFor(user),
            isNull(notificationReadTable.readAt),
          ),
        )

      if (unread.length === 0) return { marked: 0 }

      await ctx.db
        .insert(notificationReadTable)
        .values(unread.map((row) => ({ ...row, userId: user.id })))
        .onConflictDoNothing()

      return { marked: unread.length }
    }),

  markRead: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "POST",
          path: "/notification/{id}/read",
          summary: "Mark a notification as read",
          tags: ["Notifications"],
        }),
      ),
    )
    .input(z.object({ id: z.uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user

      const [visible] = await ctx.db
        .select({ id: notificationTable.id })
        .from(notificationTable)
        .where(
          and(
            eq(notificationTable.id, input.id),
            visibleNotificationsFor(user),
          ),
        )

      if (!visible) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        })
      }

      await ctx.db
        .insert(notificationReadTable)
        .values({ notificationId: input.id, userId: user.id })
        .onConflictDoNothing()

      return { success: true }
    }),

  unreadCount: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/notification/unread-count",
          summary: "Count unread notifications for the current user",
          tags: ["Notifications"],
        }),
      ),
    )
    .output(z.object({ count: z.number() }))
    .query(async ({ ctx }) => {
      const user = ctx.session.user

      const [row] = await ctx.db
        .select({ count: count() })
        .from(notificationTable)
        .leftJoin(notificationReadTable, readByUser(user.id))
        .where(
          and(
            visibleNotificationsFor(user),
            isNull(notificationReadTable.readAt),
          ),
        )

      return { count: row?.count ?? 0 }
    }),
})
