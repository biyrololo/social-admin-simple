import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
    try {
        let news = db.getNews()
        const { status, authorId } = req.query

        if (status) {
            news = news.filter(n => n.status === status)
        }
        if (authorId) {
            news = news.filter(n => n.authorId === Number(authorId))
        }

        res.json(news)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/user/:userId/friends', (req, res) => {
    try {
        const userId = Number(req.params.userId)
        const news = db.getFriendsNews(userId)
        res.json(news)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/:id', (req, res) => {
    try {
        const post = db.getNews(req.params.id)
        if (!post) {
            return res.status(404).json({ error: 'Новость не найдена' })
        }
        res.json(post)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/', (req, res) => {
    try {
        const { authorId, title, content } = req.body
        if (!authorId || !title || !content) {
            return res.status(400).json({ error: 'Заполните все поля' })
        }
        const newPost = db.createNews({ authorId, title, content })
        res.status(201).json(newPost)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.patch('/:id/status', (req, res) => {
    try {
        const { status } = req.body
        const updatedPost = db.updateNewsStatus(req.params.id, status)
        res.json(updatedPost)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.delete('/:id', (req, res) => {
    try {
        const deleted = db.deleteNews(req.params.id)
        if (!deleted) {
            return res.status(404).json({ error: 'Новость не найдена' })
        }
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router
