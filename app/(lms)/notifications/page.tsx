import { SectionHeader } from "@/components/lms/section"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function Notifications() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Notifications" subtitle="Manage SMS, Email, App, and Portal notifications." />
      <form className="grid gap-4 max-w-2xl">
        <div className="grid gap-2">
          <Label>Message</Label>
          <Textarea placeholder="Write your notification message" />
        </div>
        <div className="grid gap-2">
          <Label>Channels</Label>
          <div className="flex flex-wrap gap-4">
            {["SMS", "Email", "App", "Portal"].map((ch) => (
              <label key={ch} className="flex items-center gap-2 text-sm">
                <Checkbox /> {ch}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit">Send</Button>
      </form>
    </section>
  )
}
