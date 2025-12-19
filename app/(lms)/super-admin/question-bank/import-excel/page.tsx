'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SectionHeader } from "@/components/lms/section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react"

export default function ImportQBExcelPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [topic, setTopic] = useState('')
  const [parsedData, setParsedData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      setCourses(data)
    } catch (error) {
      toast.error('Failed to fetch courses')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Please upload an Excel file (.xlsx or .xls)')
        return
      }
      setFile(selectedFile)
      setParsedData(null)
    }
  }

  const handleParse = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/question-banks/parse-excel', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to parse Excel file')
        return
      }

      setParsedData(data)
      toast.success(`Parsed ${data.total} rows: ${data.valid} valid, ${data.invalid} invalid`)
    } catch (error) {
      toast.error('Failed to parse Excel file')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedCourse || !topic || !parsedData) {
      toast.error('Please select course, enter topic, and parse the file first')
      return
    }

    const validQuestions = parsedData.rows.filter((r: any) => r.isValid)

    if (validQuestions.length === 0) {
      toast.error('No valid questions to import')
      return
    }

    setImporting(true)

    try {
      const user = localStorage.getItem('user')
      const userId = user ? JSON.parse(user).id : null

      const res = await fetch('/api/question-banks/import-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse,
          topic,
          questions: validQuestions,
          userId
        })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to import questions')
        return
      }

      toast.success(data.message)
      router.push('/super-admin/question-bank')
    } catch (error) {
      toast.error('Failed to import questions')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <SectionHeader title="Import Question Bank from Excel" subtitle="Upload Excel file to create Question Bank" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Upload Excel File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Expected Excel Format:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Columns (in order):</strong></p>
              <ol className="list-decimal list-inside ml-2">
                <li>sr.No.</li>
                <li>question</li>
                <li>4 (option1)</li>
                <li>5 (option2)</li>
                <li>6 (option3)</li>
                <li>7 (option4)</li>
                <li>answer (full text matching one of the options)</li>
              </ol>
            </div>
          </div>

          <div>
            <Label htmlFor="file">Select Excel File</Label>
            <div className="flex gap-2">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button onClick={handleParse} disabled={!file || loading}>
                {loading ? 'Parsing...' : 'Parse File'}
              </Button>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {parsedData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Configure Question Bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="course">Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course: any) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="topic">Question Bank Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Full Stack Development - Module 1"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Step 3: Review Parsed Questions</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {parsedData.valid} Valid
                  </Badge>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    {parsedData.invalid} Invalid
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto space-y-3">
                {parsedData.rows.map((row: any, index: number) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      row.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Q{row.srNo}
                        </Badge>
                        {row.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      {row.error && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {row.error}
                        </Badge>
                      )}
                    </div>

                    <p className="font-medium text-sm mb-2">{row.question}</p>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[row.option1, row.option2, row.option3, row.option4].map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded ${
                            row.correctIndex === i
                              ? 'bg-green-100 border border-green-300 font-medium'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Answer: {row.answerText}
                      {row.correctIndex !== -1 && ` → Option ${String.fromCharCode(65 + row.correctIndex)}`}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  onClick={handleImport}
                  disabled={!selectedCourse || !topic || parsedData.valid === 0 || importing}
                  className="flex-1"
                >
                  {importing ? 'Importing...' : `Import ${parsedData.valid} Valid Questions`}
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
