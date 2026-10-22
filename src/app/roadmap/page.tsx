import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { APP_NAME } from "@/constants/app"
import { Roadmap } from "@/modules/roadmap/ui/roadmap"

export const dynamic = "force-static"

export const metadata: Metadata = {
  description: "Things that have shipped and stuff in the works.",
  title: "Roadmap",
}

export default function Page() {
  return (
    <div className="group/backdrop relative isolate grid h-svh grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-30 scale-105">
        <Image
          alt=""
          className="size-full object-cover opacity-90 blur-[7px] saturate-[0.3] dark:hidden"
          height={1080}
          src="/images/dashboards-1.webp"
          width={19220}
        />
        <Image
          alt=""
          className="hidden size-full object-cover opacity-90 blur-[7px] saturate-[0.3] dark:block"
          height={1080}
          src="/images/dashboards-1-dark.webp"
          width={19220}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-muted/75 dark:bg-background/80"
      />
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link
          className="flex items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          href="/"
        >
          <Icons.logo className="size-6" />
          <span className="font-semibold text-base tracking-tight">
            {APP_NAME}
          </span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto grid max-w-360 grid-rows-[auto_minmax(0,1fr)] overflow-hidden px-4 pt-4">
        <div className="mb-8 text-left">
          <h1 className="mb-2 font-bold text-4xl tracking-tight">Roadmap</h1>
          <p className="text-muted-foreground">
            Things that have shipped and stuff in the works.
          </p>
        </div>
        <Roadmap />
      </main>
    </div>
  )
}
