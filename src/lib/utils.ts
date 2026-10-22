import {
  IconQuestionMark,
  IconStack,
  IconStack2,
  IconStack2Filled,
  IconStack3,
  IconStack3Filled,
  IconStackFilled,
} from "@tabler/icons-react"

import { Icons } from "@/components/icons"
import { env } from "@/env"
import type { InstanceStatusEnum } from "@/schemas/instance"
import type {
  OperatingSystem,
  OperatingSystemCategoryEnum,
  OperatingSystemFamilyEnum,
} from "@/schemas/operatingSystem"
import type { ResourcePlan } from "@/schemas/resource-plan"

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return env.NEXT_PUBLIC_URL
}

export function getApiVersion() {
  return env.NEXT_PUBLIC_API_VERSION.at(0)
}

export function getResourcePlanIcon(
  planSlug: ResourcePlan["slug"] | undefined,
) {
  switch (planSlug) {
    case "micro":
      return IconStack
    case "small":
      return IconStackFilled
    case "medium":
      return IconStack2
    case "large":
      return IconStack2Filled
    case "xlarge":
      return IconStack3
    case "2x-large":
      return IconStack3Filled
    default:
      return IconQuestionMark
  }
}

export function getOperatingSystemCategoryIcon(
  category: OperatingSystemCategoryEnum | undefined,
) {
  switch (category) {
    case "linux":
      return Icons.linux
    case "windows":
      return Icons.windows
    default:
      return IconQuestionMark
  }
}

export function getOperatingSystemFamilyIcon(
  os: OperatingSystemFamilyEnum | undefined,
) {
  switch (os) {
    case "ubuntu":
      return Icons.ubuntu
    case "debian":
      return Icons.debian
    case "centos":
      return Icons.centOS
    case "fedora":
      return Icons.fedoraLinux
    case "windows":
      return Icons.windows
    case "windows server":
      return Icons.windows
    default:
      return IconQuestionMark
  }
}

export function getOperatingSystemStatusColor(
  status: OperatingSystem["status"],
) {
  switch (status) {
    case "active":
      return "border-l-green-500/50 text-green-500"
    case "inactive":
      return "border-l-yellow-500/50 text-yellow-500"
    case "deprecated":
      return "border-l-destructive/50 text-destructive"
    default:
      return "border-gray-500 text-gray-500"
  }
}

export function getResourcePlanStatusColor(status: ResourcePlan["status"]) {
  switch (status) {
    case "active":
      return "border-l-green-500/50 text-green-500"
    case "inactive":
      return "border-l-yellow-500/50 text-yellow-500"
    case "deprecated":
      return "border-l-destructive/50 text-destructive"
    default:
      return "border-gray-500 text-gray-500"
  }
}

export function getInstanceStatusColor(status: InstanceStatusEnum) {
  switch (status) {
    case "deleted":
    case "deleting":
    case "failed":
      return "bg-destructive"
    case "stopped":
      return "bg-gray-500"
    case "stopping":
    case "pending_deletion":
    case "restarting":
      return "bg-amber-500"
    case "queued":
    case "provisioning":
      return "bg-primary"
    case "starting":
    case "running":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}

export function getInstanceStatusAnimation(status: InstanceStatusEnum) {
  switch (status) {
    case "queued":
    case "provisioning":
    case "restarting":
    case "starting":
    case "stopping":
    case "pending_deletion":
    case "deleting":
      return "animate-pulse"
    default:
      return ""
  }
}

export function getDashboardWelcomeMessage() {
  const hour = new Date().getHours()
  if (hour < 12) {
    return "Good morning"
  } else if (hour < 18) {
    return "Good afternoon"
  } else {
    return "Good evening"
  }
}
