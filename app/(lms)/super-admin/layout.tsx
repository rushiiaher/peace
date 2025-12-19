import type { ReactNode } from "react"
import RoleShell from "@/components/lms/role-shell"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell role="super-admin" title="Super Admin Console">
      {children}
    </RoleShell>
  )
}
