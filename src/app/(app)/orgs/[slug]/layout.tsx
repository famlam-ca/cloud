import { getOrganizationForUser } from "@/server/queries/organization"

export default async function Layout({
  children,
  params,
}: LayoutProps<"/orgs/[slug]">) {
  const { slug } = await params
  await getOrganizationForUser(slug)

  return children
}
