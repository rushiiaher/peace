/**
 * Image Compression Utility for Student Photos
 * 
 * Purpose: Compress uploaded images to save MongoDB storage
 * Target: 50-80 KB per photo (from typical 100-250 KB)
 * Storage Impact: 2-3x more students in same storage
 */

/**
 * Compress an image file to target size
 * @param file - The image file from input
 * @param maxSizeKB - Target size in KB (default: 60 KB)
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param maxHeight - Maximum height in pixels (default: 800)
 * @returns Promise<string> - Base64 encoded compressed image
 */
export async function compressImage(
    file: File,
    maxSizeKB: number = 60,
    maxWidth: number = 800,
    maxHeight: number = 800
): Promise<string> {
    return new Promise((resolve, reject) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            reject(new Error('File must be an image'))
            return
        }

        const reader = new FileReader()

        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string

            img.onload = () => {
                try {
                    // Create canvas for compression
                    const canvas = document.createElement('canvas')
                    let width = img.width
                    let height = img.height

                    // Calculate new dimensions maintaining aspect ratio
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width)
                            width = maxWidth
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height)
                            height = maxHeight
                        }
                    }

                    // Set canvas size
                    canvas.width = width
                    canvas.height = height

                    // Draw and compress
                    const ctx = canvas.getContext('2d')!
                    ctx.fillStyle = '#FFFFFF' // White background
                    ctx.fillRect(0, 0, width, height)
                    ctx.drawImage(img, 0, 0, width, height)

                    // Start with quality 0.8
                    let quality = 0.8
                    let base64 = canvas.toDataURL('image/jpeg', quality)
                    let currentSizeKB = base64.length / 1024

                    // Iteratively reduce quality until size is acceptable
                    while (currentSizeKB > maxSizeKB && quality > 0.1) {
                        quality -= 0.05
                        base64 = canvas.toDataURL('image/jpeg', quality)
                        currentSizeKB = base64.length / 1024
                    }

                    console.log(`Image compressed: ${(file.size / 1024).toFixed(2)} KB → ${currentSizeKB.toFixed(2)} KB (quality: ${(quality * 100).toFixed(0)}%)`)

                    resolve(base64)
                } catch (error) {
                    reject(error)
                }
            }

            img.onerror = () => reject(new Error('Failed to load image'))
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

/**
 * Get size of base64 string in KB
 * @param base64 - Base64 encoded string
 * @returns Size in KB
 */
export function getBase64SizeKB(base64: string): number {
    return base64.length / 1024
}

/**
 * Validate photo size before saving
 * @param base64 - Base64 encoded photo
 * @param maxSizeKB - Maximum allowed size in KB
 * @returns boolean - True if valid, false if too large
 */
export function validatePhotoSize(base64: string, maxSizeKB: number = 80): boolean {
    return getBase64SizeKB(base64) <= maxSizeKB
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "234 KB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Extract file extension from base64 data URI
 * @param base64 - Base64 data URI
 * @returns File extension (e.g., "jpeg", "png")
 */
export function getBase64Extension(base64: string): string {
    const match = base64.match(/^data:image\/(\w+);base64,/)
    return match ? match[1] : 'jpeg'
}

/**
 * Create a thumbnail from base64 image
 * @param base64 - Original base64 image
 * @param size - Thumbnail size (width and height)
 * @returns Promise<string> - Thumbnail base64
 */
export async function createThumbnail(base64: string, size: number = 150): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = base64

        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size

            const ctx = canvas.getContext('2d')!

            // Calculate crop dimensions for square thumbnail
            const sourceSize = Math.min(img.width, img.height)
            const sourceX = (img.width - sourceSize) / 2
            const sourceY = (img.height - sourceSize) / 2

            ctx.drawImage(
                img,
                sourceX, sourceY, sourceSize, sourceSize,
                0, 0, size, size
            )

            resolve(canvas.toDataURL('image/jpeg', 0.8))
        }

        img.onerror = () => reject(new Error('Failed to create thumbnail'))
    })
}

/**
 * Configuration constants
 */
export const PHOTO_CONFIG = {
    MAX_SIZE_KB: 80,           // Maximum photo size
    TARGET_SIZE_KB: 60,        // Target compressed size
    MAX_WIDTH: 800,            // Maximum width in pixels
    MAX_HEIGHT: 800,           // Maximum height in pixels
    THUMBNAIL_SIZE: 150,       // Thumbnail size in pixels
    QUALITY_START: 0.8,        // Starting quality for compression
    QUALITY_MIN: 0.1,          // Minimum quality allowed
} as const

/**
 * Storage calculations
 */
export const STORAGE_CALC = {
    /**
     * Calculate how many students can be stored
     * @param totalStorageMB - Total available storage in MB
     * @param avgPhotoSizeKB - Average photo size in KB
     * @param otherDataMB - Space used by other data in MB
     * @returns Number of students
     */
    maxStudents: (totalStorageMB: number, avgPhotoSizeKB: number, otherDataMB: number = 0): number => {
        const availableStorageMB = totalStorageMB - otherDataMB
        const availableStorageKB = availableStorageMB * 1024
        const totalPerStudentKB = avgPhotoSizeKB + 1.2 // Photo + user data
        return Math.floor(availableStorageKB / totalPerStudentKB)
    },

    /**
     * Calculate storage used by students
     * @param studentCount - Number of students
     * @param avgPhotoSizeKB - Average photo size in KB
     * @returns Storage used in MB
     */
    storageUsed: (studentCount: number, avgPhotoSizeKB: number): number => {
        const totalPerStudentKB = avgPhotoSizeKB + 1.2
        return (studentCount * totalPerStudentKB) / 1024
    },

    /**
     * Get MongoDB Atlas free tier capacity
     */
    freeTierStudents: (avgPhotoSizeKB: number = 66): number => {
        // M0 Free tier: 512 MB total, ~350 MB for students
        return STORAGE_CALC.maxStudents(512, avgPhotoSizeKB, 162)
    }
}

/**
 * Example usage in a React component:
 * 
 * import { compressImage, validatePhotoSize, formatFileSize } from '@/utils/image-compression'
 * 
 * const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0]
 *   if (!file) return
 *   
 *   try {
 *     // Show loading
 *     setUploading(true)
 *     
 *     // Compress image
 *     const compressed = await compressImage(file, 60) // Target 60 KB
 *     
 *     // Validate size
 *     if (!validatePhotoSize(compressed, 80)) {
 *       toast.error('Photo is too large even after compression')
 *       return
 *     }
 *     
 *     // Show size info
 *     const originalSize = formatFileSize(file.size)
 *     const compressedSize = formatFileSize(compressed.length)
 *     console.log(`Compressed from ${originalSize} to ${compressedSize}`)
 *     
 *     // Save to state
 *     setPhotoBase64(compressed)
 *     
 *   } catch (error) {
 *     console.error('Compression failed:', error)
 *     toast.error('Failed to compress image')
 *   } finally {
 *     setUploading(false)
 *   }
 * }
 */
