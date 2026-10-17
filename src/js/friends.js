import api, { showToast, showConfirm } from './api.js'

let currentUserId = null
let allUsers = []

export function initFriendsPage() {
    const container = document.getElementById('friendsListContainer')
    if (!container) return

    const urlParams = new URLSearchParams(window.location.search)
    currentUserId = urlParams.get('userId') ? Number(urlParams.get('userId')) : null

    loadInitialData()

    const userSelect = document.getElementById('currentUserSelect')
    userSelect?.addEventListener('change', (e) => {
        currentUserId = Number(e.target.value)
        const newUrl = `${window.location.pathname}?userId=${currentUserId}`
        window.history.pushState({ path: newUrl }, '', newUrl)

        updateSelectedUserInfo()
        loadFriends(currentUserId)
    })

    const addFriendModalBtn = document.getElementById('addFriendModalBtn')
    addFriendModalBtn?.addEventListener('click', () => {
        if (!currentUserId) return
        loadCandidates(currentUserId)
    })
}

async function loadInitialData() {
    try {
        allUsers = await api.get('/api/users')
        if (allUsers.length === 0) {
            document.getElementById('friendsListContainer').innerHTML = 
                '<div class="text-center py-4 text-muted">В базе данных нет пользователей</div>'
            return
        }

        if (!currentUserId || !allUsers.some(u => u.id === currentUserId)) {
            currentUserId = allUsers[0].id
        }

        populateUserSelect()
        updateSelectedUserInfo()
        await loadFriends(currentUserId)
    } catch (err) {
        console.error(err)
    }
}

function populateUserSelect() {
    const select = document.getElementById('currentUserSelect')
    if (!select) return

    select.innerHTML = allUsers.map(user => {
        const isSelected = user.id === currentUserId ? 'selected' : ''
        return `<option value="${user.id}" ${isSelected}>${escapeHtml(user.fullName)} (${user.email})</option>`
    }).join('')
}

function updateSelectedUserInfo() {
    const user = allUsers.find(u => u.id === currentUserId)
    if (!user) return

    const avatar = document.getElementById('selectedUserAvatar')
    const name = document.getElementById('selectedUserName')
    const info = document.getElementById('selectedUserInfo')

    if (avatar) avatar.src = user.avatar || '/uploads/empty.jpg'
    if (name) name.textContent = user.fullName
    if (info) info.textContent = `${user.email} • Статус: ${user.status} • Роль: ${user.role}`
}

async function loadFriends(userId) {
    const container = document.getElementById('friendsListContainer')
    const countBadge = document.getElementById('friendsCount')
    if (!container) return

    try {
        const friends = await api.get(`/api/users/${userId}/friends`, { channel: 'friends' })
        if (!friends) return
        if (countBadge) countBadge.textContent = friends.length

        if (friends.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-people display-4 d-block mb-3 text-secondary opacity-50"></i>
                    <h5>У пользователя пока нет друзей</h5>
                </div>
            `
            return
        }

        container.innerHTML = friends.map(friend => {
            const statusClass = `status-${friend.status}`
            const statusLabel = friend.status === 'active' ? 'Активный' :
                                friend.status === 'banned' ? 'Заблокирован' : 'Не подтвержден'

            return `
                <div class="friend-card">
                    <div class="friend-info">
                        <img src="${friend.avatar || '/uploads/empty.jpg'}" 
                             alt="${escapeHtml(friend.fullName)}" class="avatar-md">
                        <div class="friend-details">
                            <h6>${escapeHtml(friend.fullName)}</h6>
                            <p>${escapeHtml(friend.email)} • <span class="${statusClass}">${statusLabel}</span></p>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <a href="news.html?userId=${friend.id}" class="btn btn-sm btn-outline-primary" title="Посмотреть новости">
                            <i class="bi bi-newspaper me-1"></i>Новости
                        </a>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.removeFriendAction(${currentUserId}, ${friend.id})" title="Удалить из друзей">
                            <i class="bi bi-person-x me-1"></i>Удалить
                        </button>
                    </div>
                </div>
            `
        }).join('')
    } catch {
        container.innerHTML = `<div class="text-danger text-center py-4">Ошибка загрузки списка друзей</div>`
    }
}

async function loadCandidates(userId) {
    const candidatesList = document.getElementById('candidatesList')
    if (!candidatesList) return

    try {
        const candidates = await api.get(`/api/users/${userId}/friends/candidates`, { channel: 'candidates' })
        if (!candidates) return
        if (candidates.length === 0) {
            candidatesList.innerHTML = `<div class="text-center py-4 text-muted">Нет доступных пользователей для добавления</div>`
            return
        }

        candidatesList.innerHTML = candidates.map(candidate => `
            <div class="list-group-item d-flex justify-content-between align-items-center py-3">
                <div class="d-flex align-items-center gap-3">
                    <img src="${candidate.avatar || '/uploads/empty.jpg'}" 
                         alt="${escapeHtml(candidate.fullName)}" class="avatar-sm">
                    <div>
                        <div class="fw-semibold">${escapeHtml(candidate.fullName)}</div>
                        <small class="text-muted">${escapeHtml(candidate.email)}</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-primary" onclick="window.addFriendAction(${userId}, ${candidate.id})">
                    <i class="bi bi-plus-lg me-1"></i>Добавить
                </button>
            </div>
        `).join('')
    } catch {
        candidatesList.innerHTML = `<div class="text-danger text-center py-3">Ошибка загрузки кандидатов</div>`
    }
}

window.addFriendAction = async function(userId, friendId) {
    try {
        await api.post(`/api/users/${userId}/friends`, { friendId })
        showToast('Пользователь добавлен в друзья!', 'success')
        bootstrap.Modal.getInstance(document.getElementById('addFriendModal'))?.hide()
        await loadFriends(userId)
    } catch {}
}

window.removeFriendAction = async function(userId, friendId) {
    const ok = await showConfirm('Вы действительно хотите удалить этого пользователя из друзей?', 'Удаление из друзей')
    if (!ok) return
    try {
        await api.delete(`/api/users/${userId}/friends/${friendId}`)
        showToast('Пользователь удален из друзей', 'success')
        await loadFriends(userId)
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
