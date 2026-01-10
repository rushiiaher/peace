export const env = {
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID!,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET!,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!
}

// In production, throw error if any environment variable is missing
if (process.env.NODE_ENV === 'production') {
    Object.entries(env).forEach(([key, value]) => {
        if (!value) {
            throw new Error(`Environment variable ${key} is missing!`)
        }
    })
}

// For non-production, provide usable defaults where safe if not set, 
// though it's better to force them via .env
export const getEnv = (key: keyof typeof env) => {
    const value = env[key]
    if (!value && process.env.NODE_ENV === 'production') {
        throw new Error(`Environment variable ${key} is missing!`)
    }

    if (!value) {
        if (key === 'JWT_SECRET') return 'development-secret-key-change-me'
        if (key === 'MONGODB_URI') return 'mongodb://localhost:27017/lmsdb'
    }

    return value
}
