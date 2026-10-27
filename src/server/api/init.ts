import { openapi } from "@orpc/openapi"
import { toTRPCMeta } from "@orpc/trpc"
import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import * as z from "zod"
import { ZodError } from "zod"

import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { getApiKeyFromHeaders } from "@/server/queries/api-key"

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await auth.api.getSession({
    headers: opts.headers,
  })

  return {
    db,
    session,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? z.treeifyError(error.cause) : null,
      },
    }
  },
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (t._config.isDev) {
    const waitMS = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, waitMS))
  }

  const result = await next()

  const end = Date.now()
  console.info(`[tRPC] ${path} took ${end - start}ms to execute`)

  return result
})

const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" })

  const { apiKey } = await getApiKeyFromHeaders(ctx.headers, false)

  const organizationId =
    apiKey?.referenceId ??
    ctx.session.session.activeOrganizationId ??
    ctx.session.user.defaultOrganizationId

  return next({
    ctx: {
      organizationId,
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

export const publicProcedure = t.procedure.use(timingMiddleware)

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware)
  .meta(
    toTRPCMeta(
      openapi({
        spec: (current) => ({ ...current, security: [{ apiKey: [] }] }),
      }),
    ),
  )

function isPlatformAdmin(role: string | null | undefined): boolean {
  return !!role?.split(",").some((r) => r.trim() === "admin")
}

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!isPlatformAdmin(ctx.session.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this resource.",
    })
  }
  return next()
})
