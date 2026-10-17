import api, { showToast, showConfirm } from './api.js'

const DEFAULT_AVATAR = '/uploads/empty.jpg'

let allUsers = []
let activePhotosUserId = null

export function initUsersPage() {
    const tableBody = document.getElementById('usersTableBody')
    if (!tableBody) return

    loadUsers()

    const searchInput = document.getElementById('searchInput')
    const roleFilter = document.getElementById('roleFilter')
    const statusFilter = document.getElementById('statusFilter')
    const resetBtn = document.getElementById('resetFiltersBtn')

    const applyFilters = () => {
        const query = (searchInput.value || '').toLowerCase()
        const selectedRole = roleFilter.value
        const selectedStatus = statusFilter.value

        const filtered = allUsers.filter(user => {
            const matchesQuery = user.fullName.toLowerCase().includes(query) ||
                                 user.email.toLowerCase().includes(query)
            const matchesRole = !selectedRole || user.role === selectedRole
            const matchesStatus = !selectedStatus || user.status === selectedStatus
            return matchesQuery && matchesRole && matchesStatus
        })

        renderUsersTable(filtered)
    }

    searchInput?.addEventListener('input', applyFilters)
    roleFilter?.addEventListener('change', applyFilters)
    statusFilter?.addEventListener('change', applyFilters)
    resetBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = ''
        if (roleFilter) roleFilter.value = ''
        if (statusFilter) statusFilter.value = ''
        renderUsersTable(allUsers)
    })

    const addAvatarInput = document.getElementById('addAvatarInput')
    const addAvatarPreview = document.getElementById('addUserAvatarPreview')
    const resetAddAvatarBtn = document.getElementById('resetAddAvatarBtn')

    addAvatarInput?.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file && addAvatarPreview) {
            addAvatarPreview.src = URL.createObjectURL(file)
            if (resetAddAvatarBtn) resetAddAvatarBtn.style.display = 'inline-block'
        }
    })

    resetAddAvatarBtn?.addEventListener('click', () => {
        if (addAvatarInput) addAvatarInput.value = ''
        if (addAvatarPreview) addAvatarPreview.src = DEFAULT_AVATAR
        resetAddAvatarBtn.style.display = 'none'
    })

    const saveNewUserBtn = document.getElementById('saveNewUserBtn')
    saveNewUserBtn?.addEventListener('click', async () => {
        const fullName = document.getElementById('addFullName').value.trim()
        const birthDate = document.getElementById('addBirthDate').value
        const email = document.getElementById('addEmail').value.trim()
        const role = document.getElementById('addRole').value
        const status = document.getElementById('addStatus').value
        const avatarFile = document.getElementById('addAvatarInput')?.files?.[0]

        if (!fullName || !email) {
            showToast('Заполните обязательные поля: ФИО и Email', 'danger', 'Ошибка')
            return
        }

        const formData = new FormData()
        formData.append('fullName', fullName)
        formData.append('birthDate', birthDate)
        formData.append('email', email)
        formData.append('role', role)
        formData.append('status', status)
        if (avatarFile) {
            formData.append('avatar', avatarFile)
        }

        try {
            await api.post('/api/users', formData)
            showToast('Пользователь успешно создан!', 'success')
            bootstrap.Modal.getInstance(document.getElementById('addUserModal'))?.hide()
            document.getElementById('addUserForm')?.reset()
            if (addAvatarPreview) addAvatarPreview.src = DEFAULT_AVATAR
            if (resetAddAvatarBtn) resetAddAvatarBtn.style.display = 'none'
            await loadUsers()
        } catch {}
    })

    const updateUserBtn = document.getElementById('updateUserBtn')
    updateUserBtn?.addEventListener('click', async () => {
        const id = document.getElementById('editUserId').value
        const fullName = document.getElementById('editFullName').value.trim()
        const birthDate = document.getElementById('editBirthDate').value
        const email = document.getElementById('editEmail').value.trim()
        const role = document.getElementById('editRole').value
        const status = document.getElementById('editStatus').value

        try {
            await api.put(`/api/users/${id}`, { fullName, birthDate, email, role, status })
            showToast('Данные пользователя обновлены', 'success')
            bootstrap.Modal.getInstance(document.getElementById('editUserModal'))?.hide()
            await loadUsers()
        } catch {}
    })

    const editAvatarInput = document.getElementById('editAvatarInput')
    editAvatarInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0]
        const userId = document.getElementById('editUserId').value
        if (!file || !userId) return

        const formData = new FormData()
        formData.append('avatar', file)

        try {
            const updated = await api.post(`/api/users/${userId}/avatar`, formData)
            document.getElementById('editUserAvatarPreview').src = updated.avatar || DEFAULT_AVATAR
            const deleteBtn = document.getElementById('deleteAvatarBtn')
            if (deleteBtn) deleteBtn.style.display = updated.avatar ? 'inline-block' : 'none'
            showToast('Аватар обновлен', 'success')
            await loadUsers()
        } catch {}
    })

    const deleteAvatarBtn = document.getElementById('deleteAvatarBtn')
    deleteAvatarBtn?.addEventListener('click', async () => {
        const userId = document.getElementById('editUserId').value
        if (!userId) return

        const ok = await showConfirm('Удалить аватар пользователя?', 'Удаление аватара')
        if (!ok) return

        try {
            await api.delete(`/api/users/${userId}/avatar`)
            document.getElementById('editUserAvatarPreview').src = DEFAULT_AVATAR
            deleteAvatarBtn.style.display = 'none'
            showToast('Аватар удален', 'success')
            await loadUsers()
        } catch {}
    })

    const uploadPhotoForm = document.getElementById('uploadPhotoForm')
    uploadPhotoForm?.addEventListener('submit', async (e) => {
        e.preventDefault()
        const fileInput = document.getElementById('newPhotoFileInput')
        const captionInput = document.getElementById('newPhotoCaptionInput')
        const file = fileInput.files[0]
        if (!file || !activePhotosUserId) return

        const formData = new FormData()
        formData.append('photo', file)
        formData.append('caption', captionInput.value.trim())

        try {
            await api.post(`/api/users/${activePhotosUserId}/photos`, formData)
            showToast('Фотография добавлена', 'success')
            uploadPhotoForm.reset()
            await loadUserPhotos(activePhotosUserId)
            await loadUsers()
        } catch {}
    })
}

async function loadUsers() {
    try {
        const users = await api.get('/api/users', { channel: 'users' })
        if (!users) return
        allUsers = users
        renderUsersTable(allUsers)
    } catch {
        const tableBody = document.getElementById('usersTableBody')
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Не удалось загрузить данные с сервера</td></tr>`
        }
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody')
    if (!tbody) return

    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Пользователи не найдены</td></tr>`
        return
    }

    tbody.innerHTML = users.map(user => {
        const statusClass = `status-${user.status}`
        const statusLabel = user.status === 'active' ? 'Активный' :
                            user.status === 'banned' ? 'Заблокирован' : 'Не подтвержден'
        const roleClass = `role-${user.role}`
        const roleLabel = user.role === 'admin' ? 'Администратор' : 'Пользователь'
        const photosCount = Array.isArray(user.photos) ? user.photos.length : 0

        return `
            <tr>
                <td>
                    <img src="${user.avatar || DEFAULT_AVATAR}" 
                         alt="${user.fullName}" class="avatar-sm">
                </td>
                <td>
                    <div class="fw-semibold">${escapeHtml(user.fullName)}</div>
                    <small class="text-muted">ID: ${user.id}</small>
                </td>
                <td>${user.birthDate || '<span class="text-muted">—</span>'}</td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="${roleClass}">${roleLabel}</span></td>
                <td><span class="${statusClass}">${statusLabel}</span></td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="window.editUser(${user.id})" title="Редактировать">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="window.openPhotosModal(${user.id})" title="Фотографии (${photosCount})">
                            <i class="bi bi-images"></i>
                        </button>
                        <a href="friends.html?userId=${user.id}" class="btn btn-outline-success" title="Друзья (${user.friends ? user.friends.length : 0})">
                            <i class="bi bi-people-fill"></i>
                        </a>
                        <a href="news.html?userId=${user.id}" class="btn btn-outline-secondary" title="Новости">
                            <i class="bi bi-newspaper"></i>
                        </a>
                        <button class="btn btn-outline-danger" onclick="window.deleteUser(${user.id})" title="Удалить">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
    }).join('')
}

window.editUser = function(userId) {
    const user = allUsers.find(u => u.id === Number(userId))
    if (!user) return

    document.getElementById('editUserId').value = user.id
    document.getElementById('editFullName').value = user.fullName
    document.getElementById('editBirthDate').value = user.birthDate || ''
    document.getElementById('editEmail').value = user.email
    document.getElementById('editRole').value = user.role
    document.getElementById('editStatus').value = user.status
    document.getElementById('editUserAvatarPreview').src = user.avatar || DEFAULT_AVATAR

    const deleteAvatarBtn = document.getElementById('deleteAvatarBtn')
    if (deleteAvatarBtn) {
        deleteAvatarBtn.style.display = user.avatar ? 'inline-block' : 'none'
    }

    const modal = new bootstrap.Modal(document.getElementById('editUserModal'))
    modal.show()
}

window.deleteUser = async function(userId) {
    const ok = await showConfirm('Вы действительно хотите удалить этого пользователя?', 'Удаление пользователя')
    if (!ok) return

    try {
        await api.delete(`/api/users/${userId}`)
        showToast('Пользователь успешно удален', 'success')
        await loadUsers()
    } catch {}
}

window.openPhotosModal = async function(userId) {
    activePhotosUserId = Number(userId)
    const user = allUsers.find(u => u.id === activePhotosUserId)
    if (!user) return

    document.getElementById('photosUserSubtitle').textContent = `${user.fullName} (${user.email})`
    await loadUserPhotos(activePhotosUserId)

    const modal = new bootstrap.Modal(document.getElementById('photosModal'))
    modal.show()
}

async function loadUserPhotos(userId) {
    const grid = document.getElementById('photosGrid')
    if (!grid) return

    try {
        const photos = await api.get(`/api/users/${userId}/photos`, { channel: 'userPhotos' })
        if (!photos) return
        if (photos.length === 0) {
            grid.innerHTML = '<p class="text-muted text-center py-4 col-12">У этого пользователя еще нет загруженных фотографий</p>'
            return
        }

        grid.innerHTML = photos.map(photo => {
            const isBlocked = photo.status === 'blocked'
            const badgeClass = isBlocked ? 'bg-danger' : 'bg-success'
            const badgeText = isBlocked ? 'Заблокировано' : 'Активно'
            const toggleBtnClass = isBlocked ? 'btn-outline-success' : 'btn-outline-warning'
            const toggleBtnText = isBlocked ? 'Активировать' : 'Заблокировать'
            const newStatus = isBlocked ? 'active' : 'blocked'

            return `
                <div class="photo-item">
                    <div class="photo-img-wrapper">
                        <img src="${photo.url}" alt="${escapeHtml(photo.caption || 'Фото')}">
                        <span class="badge ${badgeClass} photo-status-badge">${badgeText}</span>
                    </div>
                    <div class="photo-body">
                        <div class="photo-caption" title="${escapeHtml(photo.caption || '')}">
                            ${escapeHtml(photo.caption || 'Без подписи')}
                        </div>
                        <div class="d-flex gap-1 mt-2">
                            <button class="btn btn-xs ${toggleBtnClass} flex-fill" 
                                    onclick="window.togglePhotoStatus(${userId}, ${photo.id}, '${newStatus}')">
                                ${toggleBtnText}
                            </button>
                            <button class="btn btn-xs btn-outline-danger" 
                                    onclick="window.deletePhoto(${userId}, ${photo.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `
        }).join('')
    } catch {
        grid.innerHTML = '<p class="text-danger text-center col-12">Ошибка загрузки фотографий</p>'
    }
}

window.togglePhotoStatus = async function(userId, photoId, newStatus) {
    try {
        await api.patch(`/api/users/${userId}/photos/${photoId}/status`, { status: newStatus })
        showToast(`Статус фото изменен на: ${newStatus}`, 'success')
        await loadUserPhotos(userId)
        await loadUsers()
    } catch {}
}

window.deletePhoto = async function(userId, photoId) {
    const ok = await showConfirm('Удалить эту фотографию?', 'Удаление фотографии')
    if (!ok) return
    try {
        await api.delete(`/api/users/${userId}/photos/${photoId}`)
        showToast('Фотография удалена', 'success')
        await loadUserPhotos(userId)
        await loadUsers()
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
