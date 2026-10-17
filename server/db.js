import path from 'node:path'
import { Database } from '../lab3-my-database/index.js'

const usersJsonPath = path.resolve(process.cwd(), 'data/users.json')
const newsJsonPath = path.resolve(process.cwd(), 'data/news.json')

export const db = new Database(usersJsonPath, newsJsonPath)
export default db
