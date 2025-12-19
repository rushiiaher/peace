export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-semibold text-balance">{title}</h1>
      {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
    </header>
  )
}
