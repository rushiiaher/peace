import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddFeedback() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Add Feedback" subtitle="Configure feedback forms for specific institutes." />
      <form className="grid gap-4 max-w-md">
        <div className="grid gap-2">
          <Label>Select Institute</Label>
          <Input placeholder="Search institute" />
        </div>
        <div className="grid gap-2">
          <Label>Maximum Points</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select scale" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 8, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </section>
  )
}
