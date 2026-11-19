import { TRPCError } from "@trpc/server"
import type { APIError } from "better-auth"

const TRPC_CODES = new Set<TRPCError["code"]>([
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "TOO_MANY_REQUESTS",
])

export function toTRPCError(error: APIError): TRPCError {
  const status = String(error.status)
  return new TRPCError({
    cause: error,
    code: TRPC_CODES.has(status as TRPCError["code"])
      ? (status as TRPCError["code"])
      : "BAD_REQUEST",
    message: error.message,
  })
}
