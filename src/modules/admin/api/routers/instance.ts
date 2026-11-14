import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { count } from "drizzle-orm"
import * as z from "zod"

import { adminProcedure, createTRPCRouter } from "@/server/api/init"
import { instanceTable } from "@/server/db/schema"

export const adminInstanceRouter = createTRPCRouter({
  count: adminProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/admin/instance/count",
          summary: "Get the total number of instances in the system",
          tags: ["Admin"],
        }),
      ),
    )
    .output(z.number())
    .query(async ({ ctx }) => {
      const [instanceCount] = await ctx.db
        .select({ count: count() })
        .from(instanceTable)

      return instanceCount.count
    }),
})
