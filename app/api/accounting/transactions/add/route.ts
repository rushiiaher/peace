import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Transaction from '@/lib/models/Transaction'

export async function POST(req: Request) {
    try {
        await connectDB()
        const data = await req.json()

        const { instituteId, type, category, amount, description, date, mode } = data

        if (!instituteId || !type || !amount || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newTransaction = await Transaction.create({
            instituteId,
            type,
            category: category || 'Miscellaneous',
            description,
            amount,
            date: new Date(date),
            paymentMode: mode, // Note: Transaction schema might not have 'paymentMode' but 'mode' or similar. Checking schema...
            // Checking Schema: category, description, amount, instituteId, paymentId, commission, date.
            // Wait, schema viewed in step 1287 DOES NOT have 'paymentMode'. It has 'type', 'category', 'description', 'amount'.
            // It links to 'Payment' optionally via 'paymentId'. 
            // I should stick to schema fields. Or add 'mode' to schema if needed. 
            // The dummy UI uses 'mode'.
            // I will add 'mode' to the schema in the next step to be consistent. 
            // For now, I'll save logic and then update schema.
            mode: mode || 'Cash'
        })

        return NextResponse.json(newTransaction, { status: 201 })
    } catch (error: any) {
        console.error('Add Transaction Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to add transaction' }, { status: 500 })
    }
}
