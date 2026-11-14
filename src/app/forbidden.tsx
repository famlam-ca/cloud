import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/constants/app"

export const metadata: Metadata = {
  description: "You are not authorized to access this resource.",
  title: {
    absolute: "403 - Forbidden",
  },
}

export default function Forbidden() {
  return (
    <main className="bg-background relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)] bg-size-[5rem_5rem] opacity-60"
      />

      <div className="relative w-full max-w-2xl text-center">
        <div className="text-muted-foreground mb-8 flex items-center justify-center gap-4 font-mono text-xs tracking-[0.24em] uppercase">
          <span className="bg-primary/60 h-px w-10" />
          <span>Access restricted</span>
          <span className="bg-primary/60 h-px w-10" />
        </div>

        <p className="text-primary/20 font-mono text-[clamp(7rem,24vw,13rem)] leading-[0.8] font-bold">
          403
        </p>
        <div className="relative -mt-5 sm:-mt-8">
          <h1 className="text-3xl sm:text-4xl">
            You can&apos;t access this page
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-md text-lg text-balance md:text-pretty">
            You are not authorized to access this resource.
          </p>
          <Button className="mt-8" render={<Link href="/" />} size="lg">
            Return to {APP_NAME}
          </Button>
        </div>
      </div>
    </main>
  )
}
