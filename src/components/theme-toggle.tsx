"use client"

import { IconMoonStars, IconSun } from "@tabler/icons-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      className="bg-accent hover:bg-accent/80 dark:bg-accent dark:hover:bg-accent/80 relative"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      size="icon-sm"
      variant="outline"
    >
      <IconMoonStars className="scale-100 dark:scale-0" />
      <IconSun className="absolute scale-0 dark:scale-100" />
    </Button>
  )
}
