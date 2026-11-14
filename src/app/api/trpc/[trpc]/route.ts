import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import type { NextRequest } from "next/server"

import { env } from "@/env"
import { createTRPCContext } from "@/server/api/init"
import { appRouter } from "@/server/api/root"

async function createContext(req: NextRequest) {
  return createTRPCContext({ headers: req.headers })
}

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    createContext: () => createContext(req),
    endpoint: "/api/trpc",
    onError:
      env.NODE_ENV === "development"
        ? ({ error, path }) => {
            console.error(
              `[tRPC] Error on ${path ?? "<no-path>"}: ${error.message}`,
            )
          }
        : undefined,
    req,
    router: appRouter,
  })

export { handler as GET, handler as POST }
