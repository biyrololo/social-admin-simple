import { Router } from 'express'
import { db } from '../db.js'
import { upload } from '../middleware/upload.js'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const uploadsDir = fileURLToPath(new URL('../../uploads/', import.meta.url))

const router = Router()

router.get('/', (req, res) => {
    try {
        let users = db.getUsers()
        const { role, status, search } = req.query

        if (role) {
            users = users.filter(u => u.role === role)
        }
        if (status) {
            users = users.filter(u => u.status === status)
        }
        if (search) {
            const query = search.toLowerCase()
            users = users.filter(u =>
                u.fullName.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query)
            )
        }

        res.json(users)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/:id', (req, res) => {
    try {
        const user = db.getUsers(req.params.id)
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' })
        }
        res.json(user)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/', upload.single('avatar'), (req, res) => {
    try {
        const { fullName, birthDate, email, role, status } = req.body
        if (!fullName || !email) {
            return res.status(400).json({ error: 'Имя и email обязательны' })
        }
        const avatarUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.avatar || '')
        const newUser = db.createUser({ fullName, birthDate, email, role, status, avatar: avatarUrl })
        res.status(201).json(newUser)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.put('/:id', (req, res) => {
    try {
        const updatedUser = db.updateUser(req.params.id, req.body)
        if (!updatedUser) {
            return res.status(404).json({ error: 'Пользователь не найден' })
        }
        res.json(updatedUser)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/:id/role', (req, res) => {
    try {
        const { role } = req.body
        const updatedUser = db.updateUserRole(req.params.id, role)
        if (!updatedUser) {
            return res.status(404).json({ error: 'Пользователь не найден' })
        }
        res.json(updatedUser)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.patch('/:id/status', (req, res) => {
    try {
        const { status } = req.body
        const updatedUser = db.updateUserStatus(req.params.id, status)
        if (!updatedUser) {
            return res.status(404).json({ error: 'Пользователь не найден' })
        }
        res.json(updatedUser)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.delete('/:id', (req, res) => {
    try {
        const uploads = [...db.getUserPhotos(req.params.id), db.getUsers(req.params.id)?.avatar].filter(Boolean).filter(s => s.startsWith('/uploads/'))
        const deleted = db.deleteUser(req.params.id)
        if (!deleted) {
            return res.status(404).json({ error: 'Пользователь не найден' })
        }
        uploads.forEach(u => {
            unlink(path.join(uploadsDir, path.basename(u))).catch(() => { });
        })
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/:id/photos', (req, res) => {
    try {
        const photos = db.getUserPhotos(req.params.id)
        res.json(photos)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/:id/photos', upload.single('photo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не передан' })
        }
        const photoUrl = `/uploads/${req.file.filename}`
        const caption = req.body.caption || ''
        const newPhoto = db.addUserPhoto(req.params.id, {
            url: photoUrl,
            caption,
            status: 'active'
        })
        res.status(201).json(newPhoto)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.post('/:id/avatar', upload.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не передан' })
        }
        const avatarUrl = `/uploads/${req.file.filename}`
        const updated = db.updateUser(req.params.id, { avatar: avatarUrl })
        res.json(updated)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.delete('/:id/avatar', (req, res) => {
    try {
        const updated = db.updateUser(req.params.id, { avatar: '' })
        if (!updated) {
            return res.status(404).json({ error: 'Пользователь не найден' })
        }
        res.json(updated)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.patch('/:id/photos/:photoId/status', (req, res) => {
    try {
        const { status } = req.body
        const updatedPhoto = db.updatePhotoStatus(req.params.id, req.params.photoId, status)
        res.json(updatedPhoto)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.delete('/:id/photos/:photoId', (req, res) => {
    try {
        const deleted = db.deletePhoto(req.params.id, req.params.photoId)
        if (!deleted) {
            return res.status(404).json({ error: 'Фото не найдено' })
        }
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
