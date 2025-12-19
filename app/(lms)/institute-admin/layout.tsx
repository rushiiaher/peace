import type { ReactNode } from "react"
import RoleShell from "@/components/lms/role-shell"
import PaymentGuard from "@/components/lms/payment-guard"

export default function InstituteAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleShell role="institute-admin" title="Institute Admin">
      <PaymentGuard>
        {children}
      </PaymentGuard>
    </RoleShell>
  )
}
