import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { existsSync } from 'node:fs'
import multer from 'multer'

import usersRouter from './routes/users.js'
import friendsRouter from './routes/friends.js'
import newsRouter from './routes/news.js'

export function createApp() {
    const app = express()

    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    const uploadsDir = path.resolve(process.cwd(), 'uploads')
    app.use('/uploads', express.static(uploadsDir))

    const buildTarget = (process.env.SERVE_BUILD || 'webpack').toLowerCase()
    const distPath = path.resolve(process.cwd(), `dist/${buildTarget}`)

    if (existsSync(distPath)) {
        app.use(express.static(distPath))
    }

    app.use('/api/users', usersRouter)
    app.use('/api/users/:id/friends', friendsRouter)
    app.use('/api/news', newsRouter)

    const servePage = (pageName) => (req, res, next) => {
        const filePath = path.join(distPath, pageName)
        if (existsSync(filePath)) {
            return res.sendFile(filePath)
        }
        next()
    }

    app.get('/', servePage('index.html'))
    app.get('/users', servePage('index.html'))
    app.get('/friends', servePage('friends.html'))
    app.get('/news', servePage('news.html'))

    app.use((req, res) => {
        res.status(404).json({ error: 'Маршрут не найден', path: req.originalUrl })
    })

    app.use((err, req, res, next) => {
        const status = err.status ?? (err instanceof multer.MulterError ? 400 : err.status ?? 500)
        if (status === 500) console.error(err)
        res.status(status).json({ error: status === 500 ? 'Внутренняя ошибка сервера' : err.message })
    })

    return app
}

export default createApp
