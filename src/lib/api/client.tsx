"use client"

import type { QueryClient } from "@tanstack/react-query"
import { QueryClientProvider } from "@tanstack/react-query"
import {
  createTRPCReact,
  httpBatchStreamLink,
  loggerLink,
} from "@trpc/react-query"
import type { inferRouterInputs } from "@trpc/server"
import * as React from "react"
import superjson from "superjson"

import { createQueryClient } from "@/lib/api/query-client"
import { getBaseUrl } from "@/lib/utils"
import type { AppRouter } from "@/server/api/root"

let clientQueryClientSingleton: QueryClient | undefined
function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return createQueryClient()
  clientQueryClientSingleton ??= createQueryClient()
  return clientQueryClientSingleton
}

export const api = createTRPCReact<AppRouter>()

export type RouterInputs = inferRouterInputs<AppRouter>
export function TRPCReactProvider(props: React.PropsWithChildren) {
  const queryClient = getQueryClient()

  const [trpcClient] = React.useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          headers() {
            const headers = new Headers()
            headers.set("x-trpc-source", "nextjs-react")
            return headers
          },
          transformer: superjson,
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  )
}
