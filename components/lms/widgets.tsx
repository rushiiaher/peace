"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

export function StatCard({
  label,
  value,
  hint,
  className,
  action,
}: {
  label: string
  value: string | number
  hint?: string
  className?: string
  action?: React.ReactNode
}) {
  return (
    <Card className={cn("bg-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardContent>
    </Card>
  )
}

export function SimpleLineChart({
  data,
  dataKey = "value",
  xKey = "label",
  color = "oklch(0.6 0.12 182)",
  height = 180,
}: {
  data: Array<Record<string, any>>
  dataKey?: string
  xKey?: string
  color?: string
  height?: number
}) {
  return (
    <div className="rounded-md border bg-card p-3">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SimpleBarChart({
  data,
  dataKey = "value",
  xKey = "label",
  color = "oklch(0.6 0.12 182)",
  height = 180,
  title,
  subtitle,
}: {
  data: Array<Record<string, any>>
  dataKey?: string
  xKey?: string
  color?: string
  height?: number
  title?: string
  subtitle?: string
}) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        {title ? <CardTitle className="text-base">{title}</CardTitle> : null}
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="pt-1">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey={xKey} stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <Button asChild size="sm" className="justify-start" variant="secondary">
      <a href={href}>{label}</a>
    </Button>
  )
}
