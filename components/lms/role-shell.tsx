"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { RoleSidebar } from "./role-sidebar"
import { Menu, X, Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function RoleShell({
  role,
  title,
  children,
}: {
  role: "super-admin" | "institute-admin" | "faculty" | "student" | "parent"
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const pathname = usePathname()
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const [loading, setLoading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  // Reset loading state when pathname changes (navigation completed)
  React.useEffect(() => {
    setLoading(false)
    setProgress(0)
  }, [pathname])

  // Progress simulation when loading
  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (loading) {
      // Immediate jump to 10%
      setProgress(10)

      // Simulate progress
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          const diff = Math.random() * 10
          return Math.min(prev + diff, 90)
        })
      }, 200)
    }
    return () => clearInterval(timer)
  }, [loading])

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const getRoleColor = () => {
    switch (role) {
      case 'super-admin': return 'bg-red-100 text-red-700'
      case 'institute-admin': return 'bg-blue-100 text-blue-700'
      case 'student': return 'bg-green-100 text-green-700'
      case 'faculty': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
      {/* Top Loading Bar */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 z-[100] h-1 bg-primary/20">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <header className="flex-none z-40 border-b border-border bg-primary shadow-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white p-1">
                <img
                  src="/Peacexperts_LOGO.png"
                  alt="Peacexperts Logo"
                  className="h-full w-full object-contain rounded-full"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-foreground">{title}</h1>
                <p className="text-xs text-primary-foreground/80 hidden sm:block">Welcome back!</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 hover:bg-primary-foreground/10 px-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center bg-primary-foreground">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-primary-foreground">{user?.name || 'User'}</p>
                    <p className="text-xs text-primary-foreground/80 capitalize">{role.replace('-', ' ')}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for desktop */}
        <div className="hidden md:block flex-none">
          <RoleSidebar
            role={role}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onNavigateStart={() => setLoading(true)}
          />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 relative">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Mobile menu">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-72 bg-background shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2">
                <img
                  src="/Peacexperts_LOGO.png"
                  alt="Peacexperts Logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <RoleSidebar
              role={role}
              className="w-full border-0"
              onNavigate={() => setOpen(false)}
              onNavigateStart={() => { setOpen(false); setLoading(true); }}
              ariaLabel={`${role} mobile navigation`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
