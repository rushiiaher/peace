import { SectionHeader } from "@/components/lms/section"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export default function Ratings() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Institute Rating" subtitle="Rate and evaluate institute performance." />
      <form className="grid gap-4 max-w-md">
        <div className="grid gap-2">
          <Label>Rating (Max 10)</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Remark</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select remark" />
            </SelectTrigger>
            <SelectContent>
              {["Excellent", "Good", "Poor", "Not Applicable"].map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
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
