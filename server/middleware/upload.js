import multer from 'multer'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'

const uploadsDir = path.resolve(process.cwd(), 'uploads')
if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
        cb(null, `${randomUUID()}${ext}`)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        const err = new Error('Разрешены только изображения (JPEG, PNG, GIF, WebP)')
        err.status = 400
        cb(err, false)
    }
}

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
})

export default upload
