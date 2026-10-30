"use client"

import { IconLogin2 } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Icons } from "@/components/icons"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { APP_DESCRIPTION, APP_NAME } from "@/constants/app"
import { env } from "@/env"
import { authClient } from "@/lib/auth/client"

export default function Page() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  if (session?.user) router.push("/")

  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event
      const spotX = `${(clientX / window.innerWidth) * 100}%`
      const spotY = `${(clientY / window.innerHeight) * 100}%`
      document.documentElement.style.setProperty("--spot-x", spotX)
      document.documentElement.style.setProperty("--spot-y", spotY)
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  async function handleLogin() {
    try {
      setIsLoading(true)
      await authClient.signIn.social({
        callbackURL: "/",
        fetchOptions: {
          onError({ error }) {
            console.error(error)
            setIsLoading(false)
          },
        },
        provider: env.NEXT_PUBLIC_OAUTH_PROVIDER_ID,
      })
    } catch (error) {
      console.error(error)
      setIsLoading(false)
    }
  }

  return (
    <div className="size-full">
      <div className="group/backdrop bg-background relative isolate flex min-h-svh flex-col overflow-hidden">
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
          className="bg-muted/75 dark:bg-background/80 pointer-events-none absolute inset-0 -z-20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 scale-105 opacity-0 transition-opacity duration-500 group-hover/backdrop:opacity-100 motion-reduce:hidden"
          style={{
            maskImage:
              "radial-gradient(circle 300px at var(--spot-x) var(--spot-y), black 0%, transparent 70%)",
          }}
        >
          <Image
            alt=""
            className="size-full object-cover dark:hidden"
            height={1080}
            src="/images/dashboards-1.webp"
            width={19220}
          />
          <Image
            alt=""
            className="hidden size-full object-cover dark:block"
            height={1080}
            src="/images/dashboards-1-dark.webp"
            width={19220}
          />
        </div>
        <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <Link
            className="focus-visible:ring-ring/50 flex items-center gap-2.5 outline-none focus-visible:ring-3"
            href="/"
          >
            <Icons.logo className="size-6" />
            <span className="text-base font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </Link>
          <ThemeToggle />
        </header>
        <main className="relative z-10 flex flex-1 items-center justify-center px-4 pt-2 pb-14 sm:px-6">
          <div className="from-primary/10 to-card/50 dark:from-primary/15 w-full max-w-md border bg-linear-to-b to-50% bg-size-[100%_101%] shadow-2xl backdrop-blur-2xl lg:max-w-lg">
            <div className="[&_input]:bg-background/80 dark:[&_input]:bg-input/60 flex flex-col gap-6 p-6 sm:p-8">
              <div className="mb-4 flex flex-col items-center gap-2">
                <div className="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-full sm:mx-0">
                  <IconLogin2 className="text-primary size-6" />
                </div>
                <h1 className="text-center text-2xl font-semibold tracking-tight">
                  {APP_NAME}
                </h1>
                <p className="text-muted-foreground text-center text-sm text-pretty">
                  {APP_DESCRIPTION.replace(/ \|/g, ".")}.
                </p>
              </div>
              <Button disabled={isLoading} onClick={handleLogin}>
                {isLoading ? <Spinner /> : <IconLogin2 />}
                Sign in
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
