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
