import type React from "react"

const nav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Institutes • Add", href: "/institutes/add" },
  { label: "Enquiry • Add", href: "/enquiry/add" },
  { label: "Enquiry • List", href: "/enquiry/list" },
  { label: "Students • Add", href: "/students/add" },
  { label: "Students • List", href: "/students/list" },
  { label: "Batches • Add", href: "/batches/add" },
  { label: "Courses • Add", href: "/courses/add" },
  { label: "Courses • Delete", href: "/courses/delete" },
  { label: "Exams • Details", href: "/exams/details" },
  { label: "Exams • Schedule", href: "/exams/schedule" },
  { label: "Exams • Admit Card", href: "/exams/admit-card" },
  { label: "Exams • Confirmation", href: "/exams/confirmation" },
  { label: "Exams • Internal Marks", href: "/exams/internal-marks" },
  { label: "Exams • Results", href: "/exams/results" },
  { label: "Accounting • Student Fees", href: "/accounting/student-fees" },
  { label: "Accounting • Day Book", href: "/accounting/day-book" },
  { label: "Accounting • Account Heads", href: "/accounting/account-heads" },
  { label: "Master • Staff", href: "/master/staff/add" },
  { label: "Master • Salary", href: "/master/salary/add" },
  { label: "Master • Question Bank", href: "/master/question-bank" },
  { label: "Complaints", href: "/complaints" },
  { label: "Feedback • Configure", href: "/feedback/add" },
  { label: "Rating • Institute", href: "/ratings" },
  { label: "Notifications", href: "/notifications" },
  { label: "Settings", href: "/settings" },
  { label: "Reports", href: "/reports" },
]

import { SessionHeartbeat } from "@/components/lms/session-heartbeat"

import { RoyaltyGate } from "@/components/lms/royalty-gate"

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <SessionHeartbeat />
      <RoyaltyGate>
        <main className="">{children}</main>
      </RoyaltyGate>
    </div>
  )
}
