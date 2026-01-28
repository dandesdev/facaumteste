"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // Base toast styling
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // Semantic status colors (mode-adaptive)
          "--success-bg": "rgb(var(--success))",
          "--success-text": "rgb(var(--success-foreground))",
          "--success-border": "rgb(var(--success) / 0.3)",
          "--warning-bg": "rgb(var(--warning))",
          "--warning-text": "rgb(var(--warning-foreground))",
          "--warning-border": "rgb(var(--warning) / 0.3)",
          "--info-bg": "rgb(var(--info))",
          "--info-text": "rgb(var(--info-foreground))",
          "--info-border": "rgb(var(--info) / 0.3)",
          "--error-bg": "rgb(var(--error))",
          "--error-text": "rgb(var(--error-foreground))",
          "--error-border": "rgb(var(--error) / 0.3)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
