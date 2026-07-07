'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Undo2, Redo2,
} from 'lucide-react'

type ExecCommand =
  | 'bold' | 'italic' | 'underline'
  | 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'justifyFull'
  | 'insertOrderedList' | 'insertUnorderedList'
  | 'indent' | 'outdent'
  | 'undo' | 'redo'

interface ToolbarButton {
  cmd: ExecCommand
  icon: React.ComponentType<{ className?: string }>
  label: string
  /** queryCommandState reflects an on/off toggle (B/I/U, alignment, lists) */
  toggle?: boolean
}

// Toolbar grouped by category; nulls render a divider.
const TOOLBAR: (ToolbarButton | null)[] = [
  { cmd: 'undo', icon: Undo2, label: 'Undo' },
  { cmd: 'redo', icon: Redo2, label: 'Redo' },
  null,
  { cmd: 'bold', icon: Bold, label: 'Bold', toggle: true },
  { cmd: 'italic', icon: Italic, label: 'Italic', toggle: true },
  { cmd: 'underline', icon: Underline, label: 'Underline', toggle: true },
  null,
  { cmd: 'justifyLeft', icon: AlignLeft, label: 'Align left', toggle: true },
  { cmd: 'justifyCenter', icon: AlignCenter, label: 'Align center', toggle: true },
  { cmd: 'justifyRight', icon: AlignRight, label: 'Align right', toggle: true },
  { cmd: 'justifyFull', icon: AlignJustify, label: 'Justify', toggle: true },
  null,
  { cmd: 'insertOrderedList', icon: ListOrdered, label: 'Numbered list', toggle: true },
  { cmd: 'insertUnorderedList', icon: List, label: 'Bullet list', toggle: true },
  null,
  { cmd: 'outdent', icon: Outdent, label: 'Decrease indent' },
  { cmd: 'indent', icon: Indent, label: 'Increase indent' },
]

interface LetterWritingEditorProps {
  value: string
  onChange: (html: string) => void
  readOnly?: boolean
  placeholder?: string
  className?: string
}

/**
 * Rich-text editor for the Letter Writing exam section.
 * Outputs HTML (via onChange) so the response persists through auto-save
 * and final submission. Uses document.execCommand with CSS styling so
 * alignment/formatting serialize into the saved HTML.
 */
export function LetterWritingEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Start writing your letter…',
  className = '',
}: LetterWritingEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<Record<string, boolean>>({})

  // Sync external value into the DOM only when it differs from the current
  // content — prevents wiping the caret position on every keystroke.
  useEffect(() => {
    const el = editorRef.current
    if (el && el.innerHTML !== value) {
      el.innerHTML = value || ''
    }
  }, [value])

  // Use CSS (inline styles) for alignment/formatting so it round-trips in HTML.
  useEffect(() => {
    try {
      document.execCommand('styleWithCSS', false, 'true')
    } catch {
      /* not supported — falls back to tag-based formatting */
    }
  }, [])

  const refreshActiveStates = useCallback(() => {
    const next: Record<string, boolean> = {}
    for (const btn of TOOLBAR) {
      if (btn?.toggle) {
        try {
          next[btn.cmd] = document.queryCommandState(btn.cmd)
        } catch {
          next[btn.cmd] = false
        }
      }
    }
    setActive(next)
  }, [])

  // Track selection so toggle buttons highlight correctly.
  useEffect(() => {
    const handler = () => {
      const el = editorRef.current
      if (!el) return
      // Only react when the selection is inside this editor.
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        refreshActiveStates()
      }
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [refreshActiveStates])

  const exec = (cmd: ExecCommand) => {
    if (readOnly) return
    editorRef.current?.focus()
    document.execCommand(cmd, false)
    onChange(editorRef.current?.innerHTML || '')
    refreshActiveStates()
  }

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || '')
  }

  const isEmpty = !value || value === '<br>' || value.replace(/<[^>]*>/g, '').trim() === ''

  return (
    <div className={`rounded-lg border bg-background ${className}`}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 border-b p-2">
          {TOOLBAR.map((btn, i) =>
            btn === null ? (
              <span key={`sep-${i}`} className="mx-1 h-6 w-px bg-border" aria-hidden />
            ) : (
              <button
                key={btn.cmd}
                type="button"
                title={btn.label}
                aria-label={btn.label}
                aria-pressed={btn.toggle ? !!active[btn.cmd] : undefined}
                onMouseDown={(e) => e.preventDefault() /* keep editor selection */}
                onClick={() => exec(btn.cmd)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                  btn.toggle && active[btn.cmd] ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`}
              >
                <btn.icon className="h-4 w-4" />
              </button>
            )
          )}
        </div>
      )}

      {/* Editable area */}
      <div className="relative">
        {isEmpty && !readOnly && (
          <p className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          role="textbox"
          aria-multiline="true"
          aria-label="Letter writing area"
          className="min-h-[320px] w-full px-4 py-3 text-sm leading-relaxed outline-none [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
        />
      </div>
    </div>
  )
}

export default LetterWritingEditor
