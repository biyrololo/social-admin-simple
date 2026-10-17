export function showToast(message, type = 'success', title = 'Уведомление') {
    const toastEl = document.getElementById('app-toast')
    if (!toastEl) return

    const titleEl = document.getElementById('toast-title')
    const bodyEl = document.getElementById('toast-body')
    const iconEl = document.getElementById('toast-icon')

    if (titleEl) titleEl.textContent = title
    if (bodyEl) bodyEl.textContent = message
    if (iconEl) {
        iconEl.className = type === 'success' ? 'bi bi-check-circle-fill text-success me-2' :
                           type === 'danger' ? 'bi bi-exclamation-triangle-fill text-danger me-2' :
                           'bi bi-info-circle-fill text-primary me-2'
    }

    const toast = bootstrap.Toast.getOrCreateInstance(toastEl)
    toast.show()
}

export function showConfirm(message, title = 'Подтверждение') {
    return new Promise((resolve) => {
        const modalEl = document.getElementById('confirmModal')
        if (!modalEl) {
            resolve(false)
            return
        }

        const titleEl = document.getElementById('confirmModalTitle')
        const messageEl = document.getElementById('confirmModalMessage')
        const okBtn = document.getElementById('confirmModalOkBtn')

        if (titleEl) titleEl.textContent = title
        if (messageEl) messageEl.textContent = message

        let confirmed = false
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl)

        const handleOk = () => {
            confirmed = true
            modal.hide()
        }

        const handleHidden = () => {
            okBtn.removeEventListener('click', handleOk)
            modalEl.removeEventListener('hidden.bs.modal', handleHidden)
            resolve(confirmed)
        }

        okBtn.addEventListener('click', handleOk)
        modalEl.addEventListener('hidden.bs.modal', handleHidden)

        modal.show()
    })
}

let activeRequestsCount = 0

function showLoading() {
    activeRequestsCount++
    const bar = document.getElementById('globalProgressBar')
    if (bar) bar.classList.add('loading')
}

function hideLoading() {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1)
    if (activeRequestsCount === 0) {
        const bar = document.getElementById('globalProgressBar')
        if (bar) bar.classList.remove('loading')
    }
}

const channelLastIds = new Map()

async function request(endpoint, { method = 'GET', data = null, headers = {}, channel = null } = {}) {
    let currentReqId = null
    if (channel) {
        currentReqId = (channelLastIds.get(channel) || 0) + 1
        channelLastIds.set(channel, currentReqId)
    }

    showLoading()

    try {
        const isFormData = data instanceof FormData
        const reqHeaders = { ...headers }

        if (!isFormData && data !== null && !reqHeaders['Content-Type']) {
            reqHeaders['Content-Type'] = 'application/json'
        }

        const body = data === null ? undefined : (isFormData ? data : JSON.stringify(data))

        const res = await fetch(endpoint, {
            method,
            headers: reqHeaders,
            body
        })

        if (channel && channelLastIds.get(channel) !== currentReqId) {
            return null
        }

        if (!res.ok) {
            const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
            throw new Error(errData.error || `HTTP ${res.status}`)
        }

        return await res.json()
    } catch (err) {
        if (channel && channelLastIds.get(channel) !== currentReqId) {
            return null
        }
        console.error(err)
        showToast(err.message, 'danger', 'Ошибка')
        throw err
    } finally {
        hideLoading()
    }
}

export const api = {
    get: (endpoint, opts = {}) => request(endpoint, { ...opts, method: 'GET' }),
    post: (endpoint, data, opts = {}) => request(endpoint, { ...opts, method: 'POST', data }),
    put: (endpoint, data, opts = {}) => request(endpoint, { ...opts, method: 'PUT', data }),
    patch: (endpoint, data, opts = {}) => request(endpoint, { ...opts, method: 'PATCH', data }),
    delete: (endpoint, opts = {}) => request(endpoint, { ...opts, method: 'DELETE' })
}

export default api
