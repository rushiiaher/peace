import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function AddSalary() {
  return (
    <section className="space-y-6">
      <SectionHeader
        title="Salary Details (Add Staff Payment)"
        subtitle="Process and track employee salary payments."
      />
      <form className="grid gap-4 max-w-2xl">
        <div className="grid gap-2">
          <Label>Date</Label>
          <Input type="date" />
        </div>
        <div className="grid gap-2">
          <Label>Month</Label>
          <Input placeholder="e.g., October 2025" />
        </div>
        <div className="grid gap-2">
          <Label>Amount</Label>
          <Input type="number" placeholder="Base salary" />
        </div>
        <div className="grid gap-2">
          <Label>Reason</Label>
          <Textarea placeholder="Payment notes" />
        </div>
        <div className="grid gap-2">
          <Label>Payment Mode</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Cash/Online/Cheque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Salary</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>HRA</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>DA</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>PF</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>IT</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>Total Pay</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>Paid Amount</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>Balance Amount</Label>
          <Input type="number" />
        </div>
        <div className="grid gap-2">
          <Label>Note</Label>
          <Textarea placeholder="Additional remarks" />
        </div>
        <Button type="submit">Save Payment</Button>
      </form>
    </section>
  )
}
