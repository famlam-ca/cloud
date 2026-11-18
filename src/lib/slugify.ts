export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getInitialOrganizationSlug(user: {
  id: string
  name?: string | null
}) {
  const nameSlug = user.name ? slugify(user.name) : ""
  const suffix = user.id.slice(0, 8).toLowerCase()
  return nameSlug ? `${nameSlug}-${suffix}` : `org-${suffix}`
}
