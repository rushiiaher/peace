import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function AdmitCard() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Download Admit Card" subtitle="Batch-wise admit card generation with student details." />
      <div className="grid gap-4 max-w-md">
        <div>
          <label className="block text-sm mb-1">Select Batch</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Choose batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="b1">Batch A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>Generate & Download</Button>
      </div>
    </section>
  )
}
