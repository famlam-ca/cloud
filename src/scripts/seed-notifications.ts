import { randomUUID } from "node:crypto"
import { asc, eq } from "drizzle-orm"

import type { NotificationType } from "@/schemas/notification"
import { db } from "@/server/db"
import {
  notificationReadTable,
  notificationSeverityEnum,
  notificationTable,
  user,
} from "@/server/db/schema"

const severities = notificationSeverityEnum.enumValues
const types = [
  "announcement",
  "maintenance",
  "release",
  "security",
] as const satisfies readonly NotificationType[]

async function main() {
  const email = process.argv[2]
  const selectedUser = email
    ? await db.query.user.findFirst({
        where: eq(user.email, email),
      })
    : await db.query.user.findFirst({
        orderBy: asc(user.createdAt),
      })

  if (!selectedUser) {
    throw new Error(
      email
        ? `Could not find a user with email "${email}".`
        : "Could not find a user. Sign in at least once before running this script.",
    )
  }

  const notifications = severities.flatMap((severity, severityIndex) =>
    types.map((type, typeIndex) => {
      const id = randomUUID()

      return {
        body: `Sample ${severity} ${type} notification for layout testing.`,
        id,
        metadata: {
          title: `Sample ${type}`,
        },
        publishedAt: new Date(
          Date.now() - (severityIndex * types.length + typeIndex) * 60_000,
        ),
        severity,
        title: `${severity[0].toUpperCase()}${severity.slice(1)} ${type}`,
        type,
        userId: selectedUser.id,
      }
    }),
  )

  await db.insert(notificationTable).values(notifications)

  const readNotifications = notifications.filter((_, index) => index % 2 === 0)
  await db.insert(notificationReadTable).values(
    readNotifications.map(({ id }) => ({
      notificationId: id,
      userId: selectedUser.id,
    })),
  )

  console.info(
    `Inserted ${notifications.length} notifications for ${selectedUser.email}: ` +
      `${readNotifications.length} read and ` +
      `${notifications.length - readNotifications.length} unread.`,
  )
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("Failed to seed notifications:", error)
    process.exit(1)
  })
