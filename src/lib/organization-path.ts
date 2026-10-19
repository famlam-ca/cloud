import type { Route } from "next"

export function organizationPath(slug: string, path = ""): Route {
  return `/orgs/${slug}${path ? `/${path.replace(/^\/+/, "")}` : ""}` as Route
}

export function organizationSlugFromPath(pathname: string) {
  return pathname.match(/^\/orgs\/([^/]+)/)?.[1]
}
