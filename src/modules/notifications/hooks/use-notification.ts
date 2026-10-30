import { toast } from "sonner"

import { DEFAULT_PAGE_SIZE } from "@/constants/app"
import { api } from "@/lib/api/client"

const NOTIFICATION_LIST_INPUT = { limit: DEFAULT_PAGE_SIZE } as const
export const NOTIFICATION_LIST_UNREAD_INPUT = {
  ...NOTIFICATION_LIST_INPUT,
  unreadOnly: true,
} as const
export const NOTIFICATION_LIST_READ_INPUT = {
  ...NOTIFICATION_LIST_INPUT,
  readOnly: true,
} as const

function useNotificationCache() {
  const utils = api.useUtils()

  async function cancelAll() {
    await Promise.all([
      utils.notification.list.cancel(),
      utils.notification.banner.cancel(),
      utils.notification.unreadCount.cancel(),
    ])
  }

  function snapshot() {
    return {
      banner: utils.notification.banner.getData(),
      count: utils.notification.unreadCount.getData(),
      list: {
        all: utils.notification.list.getInfiniteData(NOTIFICATION_LIST_INPUT),
        read: utils.notification.list.getInfiniteData(
          NOTIFICATION_LIST_READ_INPUT,
        ),
        unread: utils.notification.list.getInfiniteData(
          NOTIFICATION_LIST_UNREAD_INPUT,
        ),
      },
    }
  }

  function restore(prev: ReturnType<typeof snapshot> | undefined) {
    if (!prev) return
    utils.notification.banner.setData(undefined, prev.banner)
    utils.notification.unreadCount.setData(undefined, prev.count)
    utils.notification.list.setInfiniteData(
      NOTIFICATION_LIST_INPUT,
      prev.list.all,
    )
    utils.notification.list.setInfiniteData(
      NOTIFICATION_LIST_READ_INPUT,
      prev.list.read,
    )
    utils.notification.list.setInfiniteData(
      NOTIFICATION_LIST_UNREAD_INPUT,
      prev.list.unread,
    )
  }

  function invalidateAll() {
    void utils.notification.list.invalidate()
    void utils.notification.banner.invalidate()
    void utils.notification.unreadCount.invalidate()
  }

  return {
    cancelAll,
    invalidateAll,
    restore,
    snapshot,
    utils,
  }
}

export function useMarkNotificationRead() {
  const { cancelAll, invalidateAll, restore, snapshot, utils } =
    useNotificationCache()

  // biome-ignore assist/source/useSortedKeys: onMutate must appear before onError for TContext inference
  return api.notification.markRead.useMutation({
    async onMutate({ id }) {
      await cancelAll()
      const prev = snapshot()
      const readAt = new Date()

      utils.notification.unreadCount.setData(undefined, (old) =>
        old ? { count: Math.max(0, old.count - 1) } : old,
      )
      utils.notification.list.setInfiniteData(
        NOTIFICATION_LIST_UNREAD_INPUT,
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== id),
            })),
          },
      )
      utils.notification.list.setInfiniteData(
        NOTIFICATION_LIST_READ_INPUT,
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === id
                  ? { ...item, readAt: item.readAt ?? readAt }
                  : item,
              ),
            })),
          },
      )
      utils.notification.banner.setData(undefined, (old) =>
        old?.id === id ? null : old,
      )

      return prev
    },
    onError(error, _input, ctx) {
      restore(ctx)
      console.error("Failed to mark notification as read", error)
      toast.error("Something went wrong:", {
        description: error.message,
      })
    },
    onSettled() {
      invalidateAll()
    },
  })
}

export function useMarkAllNotificationsRead() {
  const { cancelAll, invalidateAll, restore, snapshot, utils } =
    useNotificationCache()

  // biome-ignore assist/source/useSortedKeys: onMutate must appear before onError for TContext inference
  return api.notification.markAllRead.useMutation({
    async onMutate() {
      await cancelAll()
      const prev = snapshot()
      const readAt = new Date()

      utils.notification.unreadCount.setData(undefined, { count: 0 })
      utils.notification.list.setInfiniteData(
        NOTIFICATION_LIST_UNREAD_INPUT,
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: [],
            })),
          },
      )
      utils.notification.list.setInfiniteData(
        NOTIFICATION_LIST_READ_INPUT,
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => ({
                ...item,
                readAt: item.readAt ?? readAt,
              })),
            })),
          },
      )
      utils.notification.banner.setData(undefined, null)

      return prev
    },
    onError(error, _input, ctx) {
      restore(ctx)
      console.error("Failed to mark notifications as read:", error)
      toast.error("Something went wrong!", {
        description: error.message,
      })
    },
    onSettled() {
      invalidateAll()
    },
  })
}
