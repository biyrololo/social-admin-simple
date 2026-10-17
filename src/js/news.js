import api, { showToast, showConfirm } from './api.js'

let currentUserId = null
let allUsers = []

export function initNewsPage() {
    const feedContainer = document.getElementById('newsFeedContainer')
    if (!feedContainer) return

    const urlParams = new URLSearchParams(window.location.search)
    currentUserId = urlParams.get('userId') ? Number(urlParams.get('userId')) : null

    loadInitialData()

    const userSelect = document.getElementById('newsUserSelect')
    const scopeSelect = document.getElementById('feedScopeSelect')
    const statusFilter = document.getElementById('newsStatusFilter')

    const reloadFeed = () => {
        loadNewsFeed()
    }

    userSelect?.addEventListener('change', (e) => {
        currentUserId = Number(e.target.value)
        const newUrl = `${window.location.pathname}?userId=${currentUserId}`
        window.history.pushState({ path: newUrl }, '', newUrl)
        reloadFeed()
    })

    scopeSelect?.addEventListener('change', reloadFeed)
    statusFilter?.addEventListener('change', reloadFeed)

    const submitPostBtn = document.getElementById('submitPostBtn')
    submitPostBtn?.addEventListener('click', async () => {
        const authorId = document.getElementById('postAuthorSelect').value
        const title = document.getElementById('postTitleInput').value.trim()
        const content = document.getElementById('postContentInput').value.trim()

        if (!title || !content) {
            showToast('Заполните заголовок и содержание новости', 'warning')
            return
        }

        try {
            await api.post('/api/news', { authorId, title, content })
            showToast('Новость успешно опубликована!', 'success')
            bootstrap.Modal.getInstance(document.getElementById('createPostModal'))?.hide()
            document.getElementById('createPostForm')?.reset()
            await loadNewsFeed()
        } catch {}
    })
}

async function loadInitialData() {
    try {
        allUsers = await api.get('/api/users')
        if (allUsers.length === 0) {
            document.getElementById('newsFeedContainer').innerHTML = 
                '<div class="text-center py-4 text-muted">В базе данных нет пользователей</div>'
            return
        }

        if (!currentUserId || !allUsers.some(u => u.id === currentUserId)) {
            currentUserId = allUsers[0].id
        }

        populateUserSelects()
        await loadNewsFeed()
    } catch (err) {
        console.error(err)
    }
}

function populateUserSelects() {
    const userSelect = document.getElementById('newsUserSelect')
    const authorSelect = document.getElementById('postAuthorSelect')

    const options = allUsers.map(user => {
        const isSelected = user.id === currentUserId ? 'selected' : ''
        return `<option value="${user.id}" ${isSelected}>${escapeHtml(user.fullName)} (${user.email})</option>`
    }).join('')

    if (userSelect) userSelect.innerHTML = options
    if (authorSelect) authorSelect.innerHTML = options
}

async function loadNewsFeed() {
    const container = document.getElementById('newsFeedContainer')
    const scope = document.getElementById('feedScopeSelect')?.value || 'friends'
    const statusFilter = document.getElementById('newsStatusFilter')?.value || ''

    if (!container) return

    try {
        let endpoint = scope === 'friends' ? `/api/news/user/${currentUserId}/friends` : '/api/news'
        let news = await api.get(endpoint, { channel: 'newsFeed' })
        if (!news) return

        if (statusFilter) {
            news = news.filter(n => n.status === statusFilter)
        }

        if (news.length === 0) {
            const msg = scope === 'friends' 
                ? 'У друзей выбранного пользователя пока нет новостей' 
                : 'Новостей не найдено'
            container.innerHTML = `
                <div class="text-center py-5 text-muted app-card">
                    <i class="bi bi-newspaper display-4 d-block mb-3 text-secondary opacity-50"></i>
                    <h5>${msg}</h5>
                </div>
            `
            return
        }

        container.innerHTML = news.map(post => {
            const isBlocked = post.status === 'blocked'
            const postCardClass = isBlocked ? 'news-card news-blocked' : 'news-card'
            const statusBadgeClass = isBlocked ? 'bg-danger' : 'bg-success'
            const statusText = isBlocked ? 'Заблокировано' : 'Активно'
            const toggleBtnClass = isBlocked ? 'btn-outline-success' : 'btn-outline-warning'
            const toggleBtnText = isBlocked ? 'Активировать' : 'Заблокировать'
            const toggleIcon = isBlocked ? 'bi-check2-circle' : 'bi-slash-circle'
            const newStatus = isBlocked ? 'active' : 'blocked'

            const author = post.author || { fullName: 'Неизвестный автор', avatar: '/uploads/empty.jpg' }
            const postDate = new Date(post.date).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })

            return `
                <div class="${postCardClass}">
                    <div class="news-header">
                        <div class="author-info">
                            <img src="${author.avatar || '/uploads/empty.jpg'}" 
                                 alt="${escapeHtml(author.fullName)}" class="avatar-md">
                            <div>
                                <div class="author-name">${escapeHtml(author.fullName)}</div>
                                <div class="news-date">
                                    <i class="bi bi-clock me-1"></i>${postDate}
                                </div>
                            </div>
                        </div>
                        <span class="badge ${statusBadgeClass}">${statusText}</span>
                    </div>

                    <h5 class="news-title">${escapeHtml(post.title)}</h5>
                    <p class="news-content">${escapeHtml(post.content)}</p>

                    <div class="news-footer">
                        <small class="text-muted">ID: #${post.id}</small>
                        <div class="btn-group btn-group-sm">
                            <button class="btn ${toggleBtnClass}" 
                                    onclick="window.toggleNewsStatusAction(${post.id}, '${newStatus}')">
                                <i class="bi ${toggleIcon} me-1"></i>${toggleBtnText}
                            </button>
                            <button class="btn btn-outline-danger" 
                                    onclick="window.deleteNewsAction(${post.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `
        }).join('')
    } catch {
        container.innerHTML = `<div class="text-danger text-center py-4">Ошибка загрузки ленты новостей</div>`
    }
}

window.toggleNewsStatusAction = async function(newsId, newStatus) {
    try {
        await api.patch(`/api/news/${newsId}/status`, { status: newStatus })
        showToast(`Статус новости изменен на: ${newStatus}`, 'success')
        await loadNewsFeed()
    } catch {}
}

window.deleteNewsAction = async function(newsId) {
    const ok = await showConfirm('Вы действительно хотите удалить эту новость?', 'Удаление новости')
    if (!ok) return
    try {
        await api.delete(`/api/news/${newsId}`)
        showToast('Новость удалена', 'success')
        await loadNewsFeed()
    } catch {}
}

function escapeHtml(text) {
    if (!text) return ''
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
