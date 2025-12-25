import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import FeePayment from '@/lib/models/FeePayment'
import User from '@/lib/models/User'
import Staff from '@/lib/models/Staff'
import Transaction from '@/lib/models/Transaction'

export async function GET(req: Request) {
    try {
        await connectDB()
        const { searchParams } = new URL(req.url)
        const instituteId = searchParams.get('instituteId')

        if (!instituteId) {
            return NextResponse.json({ error: 'Institute ID required' }, { status: 400 })
        }

        // 1. Fetch Income: Student Fee Payments
        const feePayments = await FeePayment.find({ instituteId })
            .populate('studentId', 'name')
            .lean()

        const incomeTransactions = feePayments.map((p: any) => ({
            id: p.receiptNumber || p._id.toString(),
            rawDate: new Date(p.paymentDate),
            type: 'Income',
            category: 'Student Fees',
            amount: p.paidAmount,
            party: p.studentId?.name || 'Unknown Student',
            mode: p.paymentMode,
            date: new Date(p.paymentDate).toLocaleDateString() + ', ' + new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            details: `Receipt: ${p.receiptNumber}`
        }))

        // 2. Fetch Expenses: Royalty Payments
        // We find students, then map over their courses
        const students = await User.find({
            instituteId,
            'courses.royaltyPaid': true
        }).populate('courses.courseId', 'name').select('name courses').lean()

        const royaltyTransactions: any[] = []
        students.forEach((s: any) => {
            if (s.courses && Array.isArray(s.courses)) {
                s.courses.forEach((c: any) => {
                    if (c.royaltyPaid && c.royaltyAmount > 0) {
                        const rDate = c.royaltyPaidAt ? new Date(c.royaltyPaidAt) : new Date()
                        royaltyTransactions.push({
                            id: `ROY-${s._id}-${c.courseId?._id}`,
                            rawDate: rDate, // for sorting
                            type: 'Expense',
                            category: 'Royalty Payment',
                            amount: c.royaltyAmount,
                            party: 'Super Admin',
                            mode: 'System', // Automated
                            date: rDate.toLocaleDateString(),
                            details: `Royalty for ${s.name} - ${c.courseId?.name}`
                        })
                    }
                })
            }
        })

        // 3. Fetch Expenses: Staff Salaries (Monthly Recurring)
        // We generate specific transaction records for each month since the staff joined.
        const staffMembers = await Staff.find({ instituteId }).lean()
        const salaryTransactions: any[] = []
        const now = new Date()

        staffMembers.forEach((staff: any) => {
            if (!staff.salary || staff.salary <= 0) return
            // Start from creation date or a default "start of fiscal year" if simplistic
            // Using createdAt is safest for "History".
            let cursor = new Date(staff.createdAt || new Date())

            // Move cursor to "End of Month" for payment? Or "1st of Next Month"?
            // Let's say Salary Paid on 1st of every month AFTER joining.
            // Adjust cursor to next month start
            if (cursor.getDate() > 1) {
                cursor.setMonth(cursor.getMonth() + 1)
                cursor.setDate(1) // 1st of next month
            }

            while (cursor <= now) {
                salaryTransactions.push({
                    id: `SAL-${staff._id}-${cursor.getFullYear()}-${cursor.getMonth()}`,
                    rawDate: new Date(cursor),
                    type: 'Expense',
                    category: 'Salary',
                    amount: staff.salary,
                    party: staff.name,
                    mode: 'Bank Transfer', // Default assumption
                    date: cursor.toLocaleDateString(),
                    details: `Monthly Salary (${cursor.toLocaleString('default', { month: 'long', year: 'numeric' })})`
                })

                // Advance 1 month
                cursor.setMonth(cursor.getMonth() + 1)
            }
        })

        // 4. Fetch Manual Transactions
        const manualTxns = await Transaction.find({ instituteId }).sort({ date: -1 }).lean()
        const formattedManualTxns = manualTxns.map((m: any) => ({
            id: m._id.toString(),
            rawDate: new Date(m.date),
            type: m.type, // Income or Expense
            category: m.category,
            amount: m.amount,
            party: m.description,
            mode: m.mode || 'Cash',
            date: new Date(m.date).toLocaleDateString(),
            details: m.description
        }))

        // 5. Merge and Sort
        const allTransactions = [
            ...incomeTransactions,
            ...royaltyTransactions,
            ...salaryTransactions,
            ...formattedManualTxns
        ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()) // Newest first

        // Calculate Totals
        const allExpenses = [
            ...royaltyTransactions,
            ...salaryTransactions,
            ...formattedManualTxns.filter((t: any) => t.type === 'Expense')
        ]
        const allIncome = [
            ...incomeTransactions,
            ...formattedManualTxns.filter((t: any) => t.type === 'Income')
        ]

        const stats = {
            totalIncome: allIncome.reduce((sum, t) => sum + (t.amount || 0), 0),
            totalExpense: allExpenses.reduce((sum, t) => sum + (t.amount || 0), 0),
            royaltyExpense: royaltyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
            salaryExpense: salaryTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        }

        return NextResponse.json({
            transactions: allTransactions,
            stats: {
                totalIncome: stats.totalIncome,
                totalExpense: stats.totalExpense,
                netProfit: stats.totalIncome - stats.totalExpense,
                cashInHand: stats.totalIncome - stats.totalExpense // Simply Net Profit for now, barring other cash flows
            }
        })

    } catch (error: any) {
        console.error("Accounting Error:", error)
        return NextResponse.json({ error: error.message || 'Failed to fetch accounting data' }, { status: 500 })
    }
}
