import type { Job } from "bullmq"
import { Queue, createNodeRedisClient } from "bullmq"

import { env } from "@/env"
import { getRedisClient } from "@/lib/redis"

export const DELETE_INSTANCE_QUEUE_KEY = "cloud-delete-instance-queue"
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

let deleteInstanceQueue: Queue | null = null

function getDeleteInstanceQueue(): Queue {
  if (!deleteInstanceQueue) {
    const redis = getRedisClient()
    const connection = createNodeRedisClient(redis)

    deleteInstanceQueue = new Queue(DELETE_INSTANCE_QUEUE_KEY, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 2000, type: "exponential" },
        delay: env.NODE_ENV === "production" ? SEVEN_DAYS_MS : 0,
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 24 * 3600 },
      },
    })
  }
  return deleteInstanceQueue
}

export async function addDeleteInstanceJob(data: {
  instanceId: string
}): Promise<{ jobId: Job["id"] }> {
  const jobId = `delete-${data.instanceId}-job`

  const deleteInstanceJob = await getDeleteInstanceQueue().add(
    DELETE_INSTANCE_QUEUE_KEY,
    data,
    { deduplication: { id: jobId }, jobId },
  )

  return { jobId: deleteInstanceJob.id }
}
