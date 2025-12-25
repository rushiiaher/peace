"use client"
import Link from "next/link"
import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Building2, Star, BookOpen, FileText, HelpCircle,
  CreditCard, BarChart3, Wallet, Users, Settings, Headphones,
  UserPlus, GraduationCap, Package, IndianRupee, Calendar,
  MessageSquare, UserCog, User, CheckSquare, Bell, ClipboardList,
  ChevronLeft, ChevronRight, Truck
} from "lucide-react"

type Role = "super-admin" | "institute-admin" | "faculty" | "student" | "parent"

type NavItem = { href: string; label: string; icon?: any }

const navByRole: Record<Role, NavItem[]> = {
  "super-admin": [
    { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super-admin/institutes", label: "Institute Management", icon: Building2 },
    { href: "/super-admin/feedback", label: "Institute Rating & Feedback", icon: Star },
    { href: "/super-admin/courses", label: "Global Course Management", icon: BookOpen },
    { href: "/super-admin/exams", label: "Exam Management", icon: FileText },
    { href: "/super-admin/question-bank", label: "Question Bank", icon: HelpCircle },
    { href: "/super-admin/payments", label: "Payment Gateway", icon: CreditCard },
    { href: "/super-admin/reports", label: "Global Reports", icon: BarChart3 },
    { href: "/super-admin/accounting", label: "Account Management", icon: Wallet },
    { href: "/super-admin/users", label: "User Management", icon: Users },
    { href: "/super-admin/inventory", label: "Inventory Management", icon: Package },

    { href: "/super-admin/support", label: "Support & Tickets", icon: Headphones },
  ],
  "institute-admin": [
    { href: "/institute-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/institute-admin/enquiries", label: "Enquiry Management", icon: UserPlus },
    { href: "/institute-admin/students", label: "Student Management", icon: GraduationCap },
    { href: "/institute-admin/batches", label: "Batch Management", icon: Package },
    { href: "/institute-admin/courses", label: "Course Management", icon: BookOpen },
    { href: "/institute-admin/fees", label: "Fee Collection", icon: IndianRupee },
    { href: "/institute-admin/payments", label: "Payments to Super Admin", icon: CreditCard },
    { href: "/institute-admin/exams", label: "Exam Management", icon: FileText },
    { href: "/institute-admin/final-results", label: "Final Results", icon: CheckSquare },
    { href: "/institute-admin/delivery-status", label: "Delivery Status", icon: Truck },
    { href: "/institute-admin/question-bank", label: "Question Bank", icon: HelpCircle },
    { href: "/institute-admin/ratings", label: "Institute Ratings", icon: Star },
    { href: "/institute-admin/accounting", label: "Accounting", icon: Wallet },
    { href: "/institute-admin/staff", label: "Staff Management", icon: UserCog },
    { href: "/institute-admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/institute-admin/settings", label: "Settings", icon: Settings },
    { href: "/institute-admin/support", label: "Support", icon: Headphones },
  ],
  faculty: [
    { href: "/faculty", label: "Dashboard", icon: LayoutDashboard },
    { href: "/faculty/enquiries", label: "My Enquiries", icon: UserPlus },
    { href: "/faculty/students", label: "My Students", icon: GraduationCap },
    { href: "/faculty/batches", label: "My Batches", icon: Package },
    { href: "/faculty/marks", label: "Marks Entry", icon: FileText },

    { href: "/faculty/schedule", label: "Class Schedule", icon: Calendar },
    { href: "/faculty/progress", label: "Student Progress", icon: BarChart3 },

    { href: "/faculty/reports", label: "Reports", icon: ClipboardList },
    { href: "/faculty/profile", label: "My Profile", icon: User },
  ],
  student: [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/profile", label: "My Profile", icon: User },
    { href: "/student/course", label: "My Course", icon: BookOpen },

    { href: "/student/question-bank", label: "Question Bank", icon: HelpCircle },
    { href: "/student/exams", label: "Exams", icon: FileText },
    { href: "/student/results", label: "Results", icon: BarChart3 },
    { href: "/student/fees", label: "Fee Details", icon: IndianRupee },


    { href: "/student/support", label: "Support", icon: Headphones },
    { href: "/student/feedback", label: "Feedback", icon: MessageSquare },
  ],
  parent: [
    { href: "/parent", label: "Dashboard", icon: LayoutDashboard },
    { href: "/parent/student", label: "Student Profile", icon: User },

    { href: "/parent/results", label: "Results", icon: BarChart3 },
    { href: "/parent/fees", label: "Fee", icon: IndianRupee },
    { href: "/parent/schedule", label: "Schedule", icon: Calendar },

    { href: "/parent/progress", label: "Progress", icon: BarChart3 },
    { href: "/parent/contact", label: "Contact Institute", icon: Headphones },
  ],
}

export function RoleSidebar({
  role,
  className,
  onNavigate,
  ariaLabel,
  collapsed,
  onToggle,
  onNavigateStart,
}: {
  role: Role
  className?: string
  onNavigate?: () => void
  ariaLabel?: string
  collapsed?: boolean
  onNavigateStart?: () => void
  onToggle?: () => void
}) {
  const items = navByRole[role]
  const [optimisticPath, setOptimisticPath] = React.useState(usePathname())
  const pathname = usePathname()

  // Sync optimistic path with actual path when it changes (e.g. back button)
  React.useEffect(() => {
    setOptimisticPath(pathname)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === `/${role}`) {
      return optimisticPath === href
    }
    return optimisticPath.startsWith(href)
  }

  const handleLinkClick = (href: string) => {
    // Only trigger loading state if we are actually navigating to a new place
    if (href !== pathname) {
      if (onNavigateStart) onNavigateStart()
    }
    setOptimisticPath(href)
    if (onNavigate) onNavigate()
  }

  return (
    <nav
      className={cn(
        "h-full shrink-0 border-r border-border bg-white dark:bg-gray-900 text-sm flex flex-col shadow-sm transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        "md:static md:translate-x-0 md:opacity-100",
        className,
      )}
      aria-label={ariaLabel || `${role} navigation`}
      role="navigation"
    >
      <div className="flex-none p-4 border-b border-border/50 flex items-center justify-between">
        {!collapsed && <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Navigation</p>}
        {onToggle && (
          <button onClick={onToggle} className="p-1 hover:bg-accent rounded">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>
      <ul className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
                onClick={() => handleLinkClick(item.href)}
                title={collapsed ? item.label : undefined}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && active && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
