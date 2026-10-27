import { and, eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { requireSession } from "@/server/auth/utils"
import { db } from "@/server/db"
import {
  member as memberTable,
  organization as organizationTable,
} from "@/server/db/schema"

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
