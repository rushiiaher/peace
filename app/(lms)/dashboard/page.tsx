import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
  const items = [
    { label: "Total Institutes", value: "12" },
    { label: "Active Students", value: "1,284" },
    { label: "Open Enquiries", value: "96" },
    { label: "Pending Fees", value: "₹ 3.2L" },
  ]
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-balance">Dashboard</h1>
        <p className="text-muted-foreground">Overview of key metrics and institute performance.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m) => (
          <Card key={m.label} className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
