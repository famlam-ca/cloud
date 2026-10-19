import { and, eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { requireSession } from "@/server/auth/utils"
import { db } from "@/server/db"
import {
  member as memberTable,
  organization as organizationTable,
} from "@/server/db/schema"

export async function getInitialOrganizationId(
  userId: string,
): Promise<string | null> {
  return db.query.user
    .findFirst({
      columns: { defaultOrganizationId: true },
      where: (user, { eq }) => eq(user.id, userId),
    })
    .then((user) => user?.defaultOrganizationId || null)
}

export function getInitialOrganizationSlug(user: {
  id: string
  name?: string | null
}) {
  const nameSlug = user.name
    ?.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const suffix = user.id.slice(0, 8).toLowerCase()
  return nameSlug ? `${nameSlug}-${suffix}` : `org-${suffix}`
}

export async function getOrganizationForUser(slug: string) {
  const session = await requireSession()

  const [organization] = await db
    .select({
      id: organizationTable.id,
      name: organizationTable.name,
      slug: organizationTable.slug,
    })
    .from(organizationTable)
    .innerJoin(
      memberTable,
      and(
        eq(organizationTable.id, memberTable.organizationId),
        eq(memberTable.userId, session.user.id),
      ),
    )
    .where(eq(organizationTable.slug, slug))

  if (!organization) notFound()

  return organization
}
