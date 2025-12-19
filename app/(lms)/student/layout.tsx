import type { ReactNode } from "react"
import RoleShell from "@/components/lms/role-shell"
import StudentGuard from "@/components/lms/student-guard"

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell role="student" title="Student Portal">
      <StudentGuard>
        {children}
      </StudentGuard>
    </RoleShell>
  )
}
