import type { Icon as TablerIcon } from "@tabler/icons-react"
import type { LucideIcon } from "lucide-react"

export type NavItem = {
  extra?: {
    render: React.ReactNode
  }
  href: string
  icon: TablerIcon | LucideIcon
  isActive: boolean
  label: string
}
