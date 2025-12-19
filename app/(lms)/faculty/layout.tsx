import type { ReactNode } from "react"
import RoleShell from "@/components/lms/role-shell"

export default function FacultyLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell role="faculty" title="Faculty Panel">
      {children}
    </RoleShell>
  )
}
