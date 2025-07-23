  "use client"
  import { ThemeProvider as NextThemesProvider } from "next-themes"
  import { type ComponentProps } from "react"
  import { useEffect } from "react"
  import { useTheme } from "next-themes"

  interface ThemeProviderProps extends ComponentProps<typeof NextThemesProvider> {
    defaultTheme?: string
  }

  function ThemeSync() {
    const { theme, setTheme } = useTheme()

    useEffect(() => {
      // Check if theme is in localStorage
      const storedTheme = localStorage.getItem("polarlearn.theme")

      if (!storedTheme) {
        // Fetch theme from server if not in localStorage
        fetch("/api/v1/settings/theme")
          .then(res => res.json())
          .then(data => {
            if (data.theme) {
              setTheme(data.theme)
            }
          })
          .catch(err => {
            console.log("Could not fetch theme from server, using default")
          })
      }
    }, [setTheme])

    useEffect(() => {
      // Sync theme changes to server
      if (theme) {
        fetch("/api/v1/settings/theme", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ theme }),
        }).catch(err => {
          console.log("Could not sync theme to server")
        })
      }
    }, [theme])

    return null
  }

  export function ThemeProvider({
    children,
    defaultTheme = "dark",
    ...props
  }: ThemeProviderProps) {
    return (
      <NextThemesProvider
        {...props}
        defaultTheme={defaultTheme}
        disableTransitionOnChange={false}
        themes={["light", "dark"]}
        storageKey="polarlearn.theme"
      >
        <ThemeSync />
        {children}
      </NextThemesProvider>
    )
  }