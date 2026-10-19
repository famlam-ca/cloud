import { db } from "@/server/db"

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
