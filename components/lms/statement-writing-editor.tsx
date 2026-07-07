'use client'

import { useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Minus } from 'lucide-react'

export interface SheetData {
  rows: number
  cols: number
  /** cells["r,c"] = value; sparse so empty cells cost nothing */
  cells: Record<string, string>
}

interface StatementWritingEditorProps {
  value: SheetData
  onChange: (data: SheetData) => void
  readOnly?: boolean
  className?: string
}

const MIN_ROWS = 5
const MIN_COLS = 3
const MAX_ROWS = 100
const MAX_COLS = 26
const COL_WIDTH = 128 // fixed px — keeps table-layout:fixed stable (no reflow shake)

const colLabel = (i: number) => String.fromCharCode(65 + i) // 0 -> A

export const emptySheet = (rows = 15, cols = 6): SheetData => ({ rows, cols, cells: {} })

/**
 * Stable spreadsheet editor for the Statement Writing (Excel) exam section.
 *
 * Flicker / "vertical dark line" prevention is structural, not cosmetic:
 *  - table-layout: fixed + fixed column widths => typing never reflows the
 *    grid, so no shake/flicker while entering data.
 *  - border-collapse: collapse with a single 1px border per cell => adjacent
 *    borders share one line, so no doubled/overlapping "dark line".
 *  - No per-cell transitions, animations, timers or overlays => no repaint loop.
 */
export function StatementWritingEditor({
  value,
  onChange,
  readOnly = false,
  className = '',
}: StatementWritingEditorProps) {
  const { rows, cols, cells } = value

  const setCell = useCallback(
    (r: number, c: number, v: string) => {
      const key = `${r},${c}`
      const nextCells = { ...cells }
      if (v === '') delete nextCells[key]
      else nextCells[key] = v
      onChange({ rows, cols, cells: nextCells })
    },
    [cells, rows, cols, onChange]
  )

  const addRow = () => rows < MAX_ROWS && onChange({ ...value, rows: rows + 1 })
  const removeRow = () => {
    if (rows <= MIN_ROWS) return
    // drop cells in the removed last row
    const nextCells = Object.fromEntries(
      Object.entries(cells).filter(([k]) => Number(k.split(',')[0]) < rows - 1)
    )
    onChange({ rows: rows - 1, cols, cells: nextCells })
  }
  const addCol = () => cols < MAX_COLS && onChange({ ...value, cols: cols + 1 })
  const removeCol = () => {
    if (cols <= MIN_COLS) return
    const nextCells = Object.fromEntries(
      Object.entries(cells).filter(([k]) => Number(k.split(',')[1]) < cols - 1)
    )
    onChange({ rows, cols: cols - 1, cells: nextCells })
  }

  const colIndexes = useMemo(() => Array.from({ length: cols }, (_, i) => i), [cols])
  const rowIndexes = useMemo(() => Array.from({ length: rows }, (_, i) => i), [rows])

  return (
    <div className={`rounded-lg border bg-background ${className}`}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 border-b p-2 text-xs">
          <span className="text-muted-foreground mr-1">Rows</span>
          <Button type="button" size="icon-sm" variant="outline" onClick={removeRow} disabled={rows <= MIN_ROWS} title="Remove row">
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-6 text-center tabular-nums">{rows}</span>
          <Button type="button" size="icon-sm" variant="outline" onClick={addRow} disabled={rows >= MAX_ROWS} title="Add row">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <span className="text-muted-foreground mr-1">Columns</span>
          <Button type="button" size="icon-sm" variant="outline" onClick={removeCol} disabled={cols <= MIN_COLS} title="Remove column">
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-6 text-center tabular-nums">{cols}</span>
          <Button type="button" size="icon-sm" variant="outline" onClick={addCol} disabled={cols >= MAX_COLS} title="Add column">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Single scroll container; fixed table layout prevents reflow on typing */}
      <div className="overflow-auto">
        <table
          className="border-collapse select-text"
          style={{ tableLayout: 'fixed', width: 'max-content' }}
        >
          <thead>
            <tr>
              <th className="sticky left-0 z-10 h-8 w-12 border border-border bg-muted text-xs font-medium text-muted-foreground" />
              {colIndexes.map((c) => (
                <th
                  key={c}
                  className="h-8 border border-border bg-muted text-xs font-medium text-muted-foreground"
                  style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                >
                  {colLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowIndexes.map((r) => (
              <tr key={r}>
                <td className="sticky left-0 z-10 h-9 w-12 border border-border bg-muted text-center text-xs font-medium text-muted-foreground tabular-nums">
                  {r + 1}
                </td>
                {colIndexes.map((c) => (
                  <td
                    key={c}
                    className="border border-border p-0"
                    style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                  >
                    <input
                      type="text"
                      value={cells[`${r},${c}`] ?? ''}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      readOnly={readOnly}
                      className="h-9 w-full bg-transparent px-2 text-sm outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-400 dark:focus:bg-blue-950/30"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StatementWritingEditor
