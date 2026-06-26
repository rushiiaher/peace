import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { compareTwoStrings } from 'string-similarity'

export const dynamic = 'force-dynamic'

interface ParsedRow {
  srNo: number
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  options: string[]
  answerText: string
  correctIndex: number
  isValid: boolean
  error?: string
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function findMatchingOption(answerText: string, options: string[]): { index: number; confidence: number } {
  const trimmedAnswer = answerText.trim()

  // Check if answer is a number (1, 2, 3, 4) — must be within the available options
  if (/^[1-4]$/.test(trimmedAnswer)) {
    const optionNumber = parseInt(trimmedAnswer)
    if (optionNumber >= 1 && optionNumber <= options.length) {
      return { index: optionNumber - 1, confidence: 1.0 }
    }
    return { index: -1, confidence: 0 }
  }
  
  const normalizedAnswer = normalize(answerText)
  
  for (let i = 0; i < options.length; i++) {
    if (normalize(options[i]) === normalizedAnswer) {
      return { index: i, confidence: 1.0 }
    }
  }
  
  for (let i = 0; i < options.length; i++) {
    const normalizedOption = normalize(options[i])
    if (normalizedOption.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedOption)) {
      return { index: i, confidence: 0.9 }
    }
  }
  
  let bestIndex = -1
  let bestScore = 0
  const threshold = 0.6
  
  for (let i = 0; i < options.length; i++) {
    const score = compareTwoStrings(normalizedAnswer, normalize(options[i]))
    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }
  
  if (bestScore >= threshold) {
    return { index: bestIndex, confidence: bestScore }
  }
  
  return { index: -1, confidence: 0 }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (data.length < 2) {
      return NextResponse.json({ error: 'Excel file is empty or has no data rows' }, { status: 400 })
    }
    
    const parsedRows: ParsedRow[] = []
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i]

      // Skip only truly empty rows. Rows missing options/answer are kept and
      // flagged invalid below (with a reason) instead of being silently dropped.
      if (!row || row.length < 2 || !row[1]) {
        continue
      }
      
      // Read cell as string WITHOUT using `|| ''` — that would wipe falsy values
      // like boolean False (True/False answers) or the number 0.
      const cell = (v: any) => (v === null || v === undefined) ? '' : String(v).trim()

      // Strip a leading 0-indexed numbering prefix ("0 Text", "1 Text"), but
      // never strip an option down to empty — bare-digit options ("1", "2") are valid.
      const stripPrefix = (s: string) => {
        const t = s.replace(/^[0-3]\s*/, '')
        return t === '' ? s : t
      }

      const srNo = Number(row[0]) || i
      const question = cell(row[1])
      const option1 = stripPrefix(cell(row[2]))
      const option2 = stripPrefix(cell(row[3]))
      const option3 = stripPrefix(cell(row[4]))
      const option4 = stripPrefix(cell(row[5]))
      const answerText = cell(row[6])

      // Variable-length options: supports True/False (2 opts) and MCQ (3-4 opts).
      // Only non-empty options are kept, in column order.
      const options = [option1, option2, option3, option4].filter(o => o !== '')

      let isValid = true
      let error = ''
      let correctIndex = -1

      if (!question) {
        isValid = false
        error = 'Question is empty'
      }

      // Need at least 2 options (e.g. True/False). Was previously requiring all 4.
      if (options.length < 2) {
        isValid = false
        error = error ? `${error}; Need at least 2 options` : 'Need at least 2 options'
      }

      if (!answerText) {
        isValid = false
        error = error ? `${error}; Answer is empty` : 'Answer is empty'
      } else if (isValid) {
        const match = findMatchingOption(answerText, options)

        if (match.index === -1) {
          isValid = false
          error = `Answer "${answerText}" does not match any option`
        } else {
          correctIndex = match.index
          if (match.confidence < 0.9) {
            error = `Low confidence match (${(match.confidence * 100).toFixed(0)}%) - Please verify`
          }
        }
      }

      parsedRows.push({
        srNo,
        question,
        option1,
        option2,
        option3,
        option4,
        options,
        answerText,
        correctIndex,
        isValid,
        error
      })
    }
    
    const validRows = parsedRows.filter(r => r.isValid)
    const invalidRows = parsedRows.filter(r => !r.isValid)
    
    return NextResponse.json({
      success: true,
      total: parsedRows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      rows: parsedRows
    })
  } catch (error: any) {
    console.error('Excel parse error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse Excel file' }, { status: 500 })
  }
}
