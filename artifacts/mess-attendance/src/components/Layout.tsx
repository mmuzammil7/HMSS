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
  Soup,
  LogOut,
  Lock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { PinLoginModal } from "@/components/PinLoginModal"

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
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { isAdmin, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white border-r border-slate-800 transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Soup className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">MessMate</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Admin section */}
        <div className="px-4 py-4 border-t border-slate-800">
          {isAdmin ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-900/30 border border-emerald-700/30">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Admin Mode Active</span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Logout Admin
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
            >
              <Lock className="w-5 h-5" />
              Admin Login
            </button>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 flex items-center justify-between px-4 z-40 border-b border-slate-800 text-white">
        <div className="flex items-center gap-2">
          <Soup className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg">MessMate</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={logout} className="p-2 text-slate-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          )}
          {!isAdmin && (
            <button onClick={() => setShowLoginModal(true)} className="p-2 text-slate-400 hover:text-white">
              <Lock className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-900 z-40 p-4">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location === item.href
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="p-4 md:p-8 pt-20 md:pt-8 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {showLoginModal && (
        <PinLoginModal
          onSuccess={() => setShowLoginModal(false)}
          onCancel={() => setShowLoginModal(false)}
        />
      )}
    </div>
  )
}
