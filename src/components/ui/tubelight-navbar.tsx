"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
  panel?: boolean
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  onItemClick?: (item: NavItem) => void
}

export function NavBar({ items, className, onItemClick }: NavBarProps) {
  const pathname = usePathname()

  function isItemActive(item: NavItem) {
    if (item.panel) return false
    return item.url !== "#" && pathname.startsWith(item.url)
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-background/60 border border-white/10 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg shadow-black/40">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = isItemActive(item)
          const sharedClass = cn(
            "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
            "text-foreground/80 hover:text-primary",
            isActive && "bg-muted text-primary",
          )

          const content = (
            <>
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-16 h-8 bg-primary/50 rounded-full blur-lg -top-3 -left-4" />
                    <div className="absolute w-12 h-6 bg-primary/40 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/30 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/60 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </>
          )

          if (item.panel) {
            return (
              <button
                key={item.name}
                onClick={() => onItemClick?.(item)}
                className={sharedClass}
              >
                {content}
              </button>
            )
          }

          return (
            <Link key={item.name} href={item.url} className={sharedClass}>
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
