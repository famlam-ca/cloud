import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import * as z from "zod"

import { selectNetworkSchema } from "@/schemas/network"
import { createTRPCRouter, protectedProcedure } from "@/server/api/init"

export const networkRouter = createTRPCRouter({
  list: protectedProcedure
    .meta(
      toTRPCMeta(
        openapi({
          method: "GET",
          path: "/network/list",
          summary: "List all networks",
          tags: ["Networks"],
        }),
      ),
    )
    .output(z.array(selectNetworkSchema))
    .query(async ({ ctx }) => {
      return await ctx.db.query.networkTable.findMany()
    }),
})
