import "server-only"
import { createHydrationHelpers } from "@trpc/react-query/rsc"
import { headers } from "next/headers"
import * as React from "react"

import { createTRPCContext } from "@/server/api/init"
import type { AppRouter } from "@/server/api/root"
import { createCaller } from "@/server/api/root"

import { createQueryClient } from "./query-client"

const createContext = React.cache(async () => {
  const heads = new Headers(await headers())
  heads.set("x-trpc-source", "rsc")
  return createTRPCContext({ headers: heads })
})

const caller = createCaller(createContext)
const getQueryClient = React.cache(createQueryClient)

export const { HydrateClient, trpc: api } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
)
