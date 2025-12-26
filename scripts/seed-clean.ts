import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local')
    process.exit(1)
}

const MONGODB_URI = process.env.MONGODB_URI

async function seed() {
    try {
        console.log('Connecting to MongoDB...')
        await mongoose.connect(MONGODB_URI)
        console.log('Connected!')

        // Access the native MongoDB driver database object
        const db = mongoose.connection.db
        if (!db) {
            throw new Error("Database connection not established")
        }

        console.log('Clearing all collections...')
        const collections = await db.collections()

        for (const collection of collections) {
            // Don't modify system collections
            if (collection.collectionName.startsWith('system.')) continue

            try {
                await collection.drop()
                console.log(`Dropped collection: ${collection.collectionName}`)
            } catch (err: any) {
                if (err.code === 26) {
                    console.log(`Collection ${collection.collectionName} not found (already dropped)`)
                } else {
                    console.error(`Error dropping ${collection.collectionName}:`, err)
                }
            }
        }

        console.log('Creating Super Admin...')
        const hashedPassword = await bcrypt.hash('admin123', 10)

        // Inline schema to avoid import issues
        const UserSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, required: true, default: 'super-admin' },
            firstName: { type: String },
            lastName: { type: String },
            status: { type: String, default: 'Active' },
            createdAt: { type: Date, default: Date.now },
            // Add minimal fields required by your app's stricter checks if any, usually this is enough for login
        }, { strict: false }) // strict: false allows us to put whatever, though we define key ones

        // Register model locally for this script
        // Check if duplicate
        const User = mongoose.models.User || mongoose.model('User', UserSchema)

        await User.create({
            name: 'Super Admin',
            email: 'admin@lms.com',
            password: hashedPassword,
            role: 'super-admin',
            firstName: 'Super',
            lastName: 'Admin',
            status: 'Active'
        })

        console.log('Super Admin created successfully!')
        console.log('Email: admin@lms.com')
        console.log('Password: admin123')

        console.log('Database clean complete.')
        process.exit(0)
    } catch (error) {
        console.error('Error seeding data:', error)
        process.exit(1)
    }
}

seed()
