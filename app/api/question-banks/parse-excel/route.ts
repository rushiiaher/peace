import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { compareTwoStrings } from 'string-similarity'

interface ParsedRow {
  srNo: number
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
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
  
  // Check if answer is a number (1, 2, 3, 4)
  if (/^[1-4]$/.test(trimmedAnswer)) {
    const optionNumber = parseInt(trimmedAnswer)
    return { index: optionNumber - 1, confidence: 1.0 }
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
      
      if (!row || row.length < 7 || !row[1]) {
        continue
      }
      
      const srNo = Number(row[0]) || i
      const question = String(row[1] || '').trim()
      let option1 = String(row[2] || '').trim()
      let option2 = String(row[3] || '').trim()
      let option3 = String(row[4] || '').trim()
      let option4 = String(row[5] || '').trim()
      const answerText = String(row[6] || '').trim()
      
      option1 = option1.replace(/^[0-3]\s*/, '')
      option2 = option2.replace(/^[0-3]\s*/, '')
      option3 = option3.replace(/^[0-3]\s*/, '')
      option4 = option4.replace(/^[0-3]\s*/, '')
      
      let isValid = true
      let error = ''
      let correctIndex = -1
      
      if (!question) {
        isValid = false
        error = 'Question is empty'
      }
      
      if (!option1 || !option2 || !option3 || !option4) {
        isValid = false
        error = error ? `${error}; Missing options` : 'Missing options'
      }
      
      if (!answerText) {
        isValid = false
        error = error ? `${error}; Answer is empty` : 'Answer is empty'
      } else if (isValid) {
        const options = [option1, option2, option3, option4]
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
