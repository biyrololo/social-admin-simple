import { Router } from 'express'
import { db } from '../db.js'

const router = Router({ mergeParams: true })

router.get('/', (req, res) => {
    try {
        const userId = Number(req.params.id)
        const friends = db.getUserFriends(userId)
        res.json(friends)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/candidates', (req, res) => {
    try {
        const userId = Number(req.params.id)
        const user = db.getUsers(userId)
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' })
        }
        const friendIds = new Set([userId, ...user.friends.map(Number)])
        const candidates = db.getUsers().filter(u => !friendIds.has(u.id))
        res.json(candidates)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post('/', (req, res) => {
    try {
        const userId = Number(req.params.id)
        const { friendId } = req.body
        if (!friendId) {
            return res.status(400).json({ error: 'friendId обязателен' })
        }
        const updatedFriends = db.addFriend(userId, friendId)
        res.status(201).json(updatedFriends)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

router.delete('/:friendId', (req, res) => {
    try {
        const userId = Number(req.params.id)
        const friendId = Number(req.params.friendId)
        const updatedFriends = db.removeFriend(userId, friendId)
        res.json(updatedFriends)
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
})

export default router
