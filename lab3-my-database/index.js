import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export class Database {
    #users = []
    #posts = []
    #usersFilePath
    #postsFilePath

    constructor(usersPath, postsPath) {
        this.#usersFilePath = this.#resolvePath(usersPath)
        this.#postsFilePath = this.#resolvePath(postsPath)
        this.#load()
    }

    #resolvePath(filePath) {
        if (!filePath) {
            throw new Error('Путь к файлу базы данных не может быть пустым')
        }
        if (filePath instanceof URL || (typeof filePath === 'string' && filePath.startsWith('file:'))) {
            return fileURLToPath(filePath)
        }
        return path.resolve(process.cwd(), filePath)
    }

    #load() {
        try {
            const usersData = readFileSync(this.#usersFilePath, 'utf8')
            this.#users = JSON.parse(usersData || '[]')
        } catch {
            this.#users = []
        }

        try {
            const postsData = readFileSync(this.#postsFilePath, 'utf8')
            this.#posts = JSON.parse(postsData || '[]')
        } catch {
            this.#posts = []
        }
    }

    #save() {
        writeFileSync(this.#usersFilePath, JSON.stringify(this.#users, null, 2), 'utf8')
        writeFileSync(this.#postsFilePath, JSON.stringify(this.#posts, null, 2), 'utf8')
    }

    getUsers(userId = undefined) {
        if (userId !== undefined && userId !== null) {
            return this.#users.find(u => u.id === Number(userId)) || null
        }
        return this.#users
    }

    createUser(userData) {
        const id = this.#users.length > 0 ? Math.max(...this.#users.map(u => u.id)) + 1 : 1
        const newUser = {
            id,
            fullName: userData.fullName || '',
            birthDate: userData.birthDate || '',
            email: userData.email || '',
            avatar: userData.avatar || '',
            role: userData.role || 'user',
            status: userData.status || 'unconfirmed',
            friends: Array.isArray(userData.friends) ? userData.friends.map(Number) : [],
            photos: Array.isArray(userData.photos) ? userData.photos : []
        }

        this.#users.push(newUser)
        this.#save()
        return newUser
    }

    updateUser(userId, data) {
        const id = Number(userId)
        let updatedUser = null
        const allowedFields = ['fullName', 'birthDate', 'email', 'avatar', 'role', 'status']

        this.#users = this.#users.map(u => {
            if (u.id === id) {
                const cleanData = {}
                for (const key of allowedFields) {
                    if (data[key] !== undefined) {
                        cleanData[key] = data[key]
                    }
                }
                updatedUser = { ...u, ...cleanData, id }
                return updatedUser
            }
            return u
        })

        if (updatedUser) {
            this.#save()
        }
        return updatedUser
    }

    updateUserRole(userId, role) {
        return this.updateUser(userId, { role })
    }

    updateUserStatus(userId, status) {
        return this.updateUser(userId, { status })
    }

    deleteUser(userId) {
        const id = Number(userId)
        const initialCount = this.#users.length
        this.#users = this.#users.filter(u => u.id !== id)

        this.#users.forEach(u => {
            u.friends = u.friends.filter(fId => fId !== id)
        })

        this.#posts = this.#posts.filter(p => p.authorId !== id)

        if (this.#users.length !== initialCount) {
            this.#save()
            return true
        }
        return false
    }

    getUserFriends(userId) {
        const user = this.getUsers(userId)
        if (!user) return []
        const friendIds = new Set(user.friends.map(Number))
        return this.#users.filter(u => friendIds.has(u.id))
    }

    addFriend(userId, friendId) {
        const uId = Number(userId)
        const fId = Number(friendId)

        if (uId === fId) return this.getUserFriends(uId)

        const user = this.getUsers(uId)
        const friend = this.getUsers(fId)

        if (!user || !friend) return []

        if (!user.friends.includes(fId)) user.friends.push(fId)
        if (!friend.friends.includes(uId)) friend.friends.push(uId)

        this.#save()
        return this.getUserFriends(uId)
    }

    removeFriend(userId, friendId) {
        const uId = Number(userId)
        const fId = Number(friendId)

        const user = this.getUsers(uId)
        const friend = this.getUsers(fId)

        if (!user) return []

        user.friends = user.friends.filter(id => id !== fId)
        if (friend) {
            friend.friends = friend.friends.filter(id => id !== uId)
        }

        this.#save()
        return this.getUserFriends(uId)
    }

    getUserPhotos(userId) {
        const user = this.getUsers(userId)
        return user?.photos || []
    }

    addUserPhoto(userId, photoData) {
        const user = this.getUsers(userId)
        if (!user) throw new Error('User not found')

        if (!Array.isArray(user.photos)) user.photos = []

        const photoId = user.photos.length > 0 ? Math.max(...user.photos.map(p => p.id)) + 1 : 1
        const newPhoto = {
            id: photoId,
            url: photoData.url,
            caption: photoData.caption || '',
            status: photoData.status || 'active',
            uploadedAt: new Date().toISOString()
        }

        user.photos.push(newPhoto)
        this.#save()
        return newPhoto
    }

    updatePhotoStatus(userId, photoId, status) {
        const user = this.getUsers(userId)
        const photo = user?.photos?.find(p => p.id === Number(photoId))
        if (!photo) return null

        photo.status = status
        this.#save()
        return photo
    }

    deletePhoto(userId, photoId) {
        const user = this.getUsers(userId)
        if (!user || !Array.isArray(user.photos)) return false

        const initialLength = user.photos.length
        user.photos = user.photos.filter(p => p.id !== Number(photoId))

        if (user.photos.length !== initialLength) {
            this.#save()
            return true
        }
        return false
    }

    getNews(newsId = undefined) {
        if (newsId !== undefined && newsId !== null) {
            const post = this.#posts.find(p => p.id === Number(newsId))
            if (!post) return null
            const author = this.getUsers(post.authorId)
            return {
                ...post,
                author: author ? { id: author.id, fullName: author.fullName, avatar: author.avatar } : null
            }
        }

        return this.#posts.map(p => {
            const author = this.getUsers(p.authorId)
            return {
                ...p,
                author: author ? { id: author.id, fullName: author.fullName, avatar: author.avatar } : null
            }
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    getFriendsNews(userId) {
        const user = this.getUsers(userId)
        if (!user) return []
        const friendIds = new Set(user.friends.map(Number))
        return this.getNews().filter(post => friendIds.has(Number(post.authorId)))
    }

    createNews(newsData) {
        const id = this.#posts.length > 0 ? Math.max(...this.#posts.map(p => p.id)) + 1 : 1
        const newPost = {
            id,
            authorId: Number(newsData.authorId),
            title: newsData.title || '',
            content: newsData.content || '',
            date: newsData.date || new Date().toISOString(),
            status: newsData.status || 'active'
        }

        this.#posts.unshift(newPost)
        this.#save()
        return this.getNews(id)
    }

    updateNewsStatus(newsId, status) {
        const post = this.#posts.find(p => p.id === Number(newsId))
        if (!post) return null

        post.status = status
        this.#save()
        return this.getNews(newsId)
    }

    deleteNews(newsId) {
        const id = Number(newsId)
        const initialLength = this.#posts.length
        this.#posts = this.#posts.filter(p => p.id !== id)

        if (this.#posts.length !== initialLength) {
            this.#save()
            return true
        }
        return false
    }
}

export default Database