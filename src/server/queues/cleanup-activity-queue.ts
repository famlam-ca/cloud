import type { Job } from "bullmq"
import { createNodeRedisClient, Queue } from "bullmq"

import { getRedisClient } from "@/lib/redis"

export const CLEANUP_ACTIVITY_QUEUE_KEY = "cleanup-activity-queue"
const PATTERN = "0 4 * * *" // Daily at 4 am

let cleanupActivityQueue: Queue | null = null

export function getCleanupActivityQueue(): Queue {
  if (!cleanupActivityQueue) {
    const redis = getRedisClient()
    const connection = createNodeRedisClient(redis)

    cleanupActivityQueue = new Queue(CLEANUP_ACTIVITY_QUEUE_KEY, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 2000, type: "exponential" },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 24 * 3600 },
      },
    })

    cleanupActivityQueue
      .upsertJobScheduler(CLEANUP_ACTIVITY_QUEUE_KEY, {
        pattern: PATTERN,
        tz: "America/Vancouver",
      })
      .catch((err) =>
        console.error("Failed to register cleanup scheduler", err),
      )
  }
  return cleanupActivityQueue
}

export async function addCleanupActivityJob(): Promise<{ jobId: Job["id"] }> {
  const cleanupActivityJob = await getCleanupActivityQueue().add(
    CLEANUP_ACTIVITY_QUEUE_KEY,
    {},
  )

  return { jobId: cleanupActivityJob.id }
}
