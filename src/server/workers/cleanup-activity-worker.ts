import { createNodeRedisClient, Worker } from "bullmq"
import { inArray, lt } from "drizzle-orm"

import { env } from "@/env"
import { getRedisClient } from "@/lib/redis"
import { db } from "@/server/db"
import { activityTable } from "@/server/db/schema"
import {
  CLEANUP_ACTIVITY_QUEUE_KEY,
  getCleanupActivityQueue,
} from "@/server/queues/cleanup-activity-queue"
import { logActivity } from "@/server/services/activity"

const RETENTION_DAYS = env.DEV_ACTIVITY_RETENTION_DAYS ?? 90
const BATCH_SIZE = 5000

const redis = getRedisClient()
const connection = createNodeRedisClient(redis)

const cleanupActivityWorker = new Worker(
  CLEANUP_ACTIVITY_QUEUE_KEY,
  async (): Promise<{ deleted: number; status: string }> => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 3600 * 1000)
    let deleted = 0

    while (true) {
      const rows = await db
        .delete(activityTable)
        .where(
          inArray(
            activityTable.id,
            db
              .select({ id: activityTable.id })
              .from(activityTable)
              .where(lt(activityTable.timestamp, cutoff))
              .limit(BATCH_SIZE),
          ),
        )
        .returning({ id: activityTable.id })

      deleted += rows.length
      if (rows.length < BATCH_SIZE) break
    }

    return {
      deleted,
      status: "completed",
    }
  },
  {
    autorun: false,
    concurrency: 1,
    connection,
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  },
)

cleanupActivityWorker.on("completed", async (job, result) => {
  if (!job?.id) return

  await logActivity(db, "activity_cleanup_completed", {
    actorType: "system",
    channel: "worker",
    metadata: { deleted: result.deleted },
    referenceId: job.id,
    referenceType: "activity",
  })
})

cleanupActivityWorker.on("failed", async (job, err) => {
  if (!job?.id) return

  const maxAttempts = job.opts.attempts ?? 1
  const isFinalAttempt = job.attemptsMade >= maxAttempts

  if (!isFinalAttempt) return

  await logActivity(db, "activity_cleanup_failed", {
    actorType: "system",
    channel: "worker",
    metadata: { error: err.message },
    referenceId: job.id,
    referenceType: "activity",
  })
})

cleanupActivityWorker.run()
getCleanupActivityQueue()
