import React, { useState } from "react"
import { Link, useLocation } from "wouter"
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Receipt,
  Settings,
  Menu,
  X,
  Utensils,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Residents", href: "/residents", icon: Users },
  { name: "Billing", href: "/billing", icon: Receipt },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-60 flex-col bg-[hsl(var(--sidebar))] border-r border-stone-200 shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-[17px] text-slate-900 tracking-tight">MessMate</span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/8 text-primary"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-primary" : "text-slate-400")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">MessMate &middot; v1.0</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[hsl(var(--sidebar))] flex items-center justify-between px-4 z-40 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Utensils className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-base text-slate-900">MessMate</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-[hsl(var(--sidebar))] z-40 px-3 py-3">
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = location === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/8 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-400")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="p-5 md:p-8 pt-20 md:pt-8 w-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
