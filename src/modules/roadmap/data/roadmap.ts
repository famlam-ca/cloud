import * as z from "zod"

export const roadmapItemSchema = z.object({
  note: z.string().optional(),
  status: z.enum(["completed", "in-progress", "todo"]),
  title: z.string(),
})

export const roadmapCategorySchema = z.object({
  category: z.string(),
  items: z.array(roadmapItemSchema),
})

export type RoadmapCategory = z.infer<typeof roadmapCategorySchema>

export const roadmap = [
  {
    category: "Shipped & shipping",
    items: [
      {
        status: "in-progress",
        title: "Snapshots/backups per instance",
      },
      {
        note: "Additional pages are planned",
        status: "in-progress",
        title: "Instance details",
      },
      {
        status: "completed",
        title: "Activity log noise",
      },
      {
        status: "completed",
        title: "Firewall rule editing",
      },
      {
        status: "completed",
        title: "SSH key management",
      },
      {
        status: "completed",
        title: "`ciuser` standardized to `cloud-user`",
      },
      {
        note: "Flat 90-day purge, built as a queue/worker",
        status: "completed",
        title: "Activity log retention",
      },
    ],
  },
  {
    category: "Stuff coming up",
    items: [
      {
        note: "DB-backed permission matrix with editable roles and per-member overrides",
        status: "todo",
        title: "Per-org permissions / access control",
      },
      {
        note: "Bell in the header for system announcements, ahead of backups",
        status: "todo",
        title: "Notification system",
      },
      {
        status: "todo",
        title: "`qemu-guest-agent` missing from VM template",
      },
      {
        status: "todo",
        title: "Resource quotas/limits per user or org",
      },
      {
        status: "todo",
        title: "Usage tracking",
      },
      {
        status: "todo",
        title: "Additional instance templates/images",
      },
      {
        status: "todo",
        title: "SSE upgrade (tRPC v11 + Redis pub/sub)",
      },
      {
        note: "Ties into the audit log read permission",
        status: "todo",
        title: "Audit/admin dashboard",
      },
    ],
  },
  {
    category: "Someday, maybe",
    items: [
      {
        status: "todo",
        title: "Multi-node Proxmox support",
      },
      {
        status: "todo",
        title: "Polish/document `apiKey` plugin for API access",
      },
      {
        status: "todo",
        title: "Console access (noVNC)",
      },
    ],
  },
  {
    category: "Long-term wishlist",
    items: [
      {
        status: "todo",
        title: "VM migration between nodes (cold + live)",
      },
    ],
  },
] satisfies RoadmapCategory[]
