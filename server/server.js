import https from 'node:https'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createApp } from './app.js'

const PORT = process.env.PORT || 3000
const keyPath = path.resolve(process.cwd(), 'certs/server.key')
const certPath = path.resolve(process.cwd(), 'certs/server.crt')

if (!existsSync(keyPath) || !existsSync(certPath)) {
    console.error('SSL сертификаты не найдены в certs/')
    process.exit(1)
}

const sslOptions = {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath)
}

const app = createApp()
const server = https.createServer(sslOptions, app)

server.listen(PORT, () => {
    console.log(`Server running at https://localhost:${PORT}`)
})
