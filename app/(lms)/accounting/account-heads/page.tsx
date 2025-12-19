import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function AccountHeads() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Add Account Head" subtitle="Create and manage accounting categories." />
      <form className="grid gap-4 max-w-xl">
        <div className="grid gap-2">
          <Label>Account Head</Label>
          <Input placeholder="Custom name (e.g., Office Rent)" />
        </div>
        <div className="grid gap-2">
          <Label>Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {["Income", "Expenses", "Salary", "Liabilities", "Banking"].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Save</Button>
      </form>
    </section>
  )
}
