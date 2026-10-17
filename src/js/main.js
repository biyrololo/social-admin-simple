import { initUsersPage } from './users.js'
import { initFriendsPage } from './friends.js'
import { initNewsPage } from './news.js'

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.toLowerCase()
    const navUsers = document.getElementById('nav-users')
    const navFriends = document.getElementById('nav-friends')
    const navNews = document.getElementById('nav-news')

    if (path.includes('friends')) {
        navFriends?.classList.add('active')
        initFriendsPage()
    } else if (path.includes('news')) {
        navNews?.classList.add('active')
        initNewsPage()
    } else {
        navUsers?.classList.add('active')
        initUsersPage()
    }
})
