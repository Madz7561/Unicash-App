import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DB_DIR, 'db.json')

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password).trim()).digest('hex')
}

function getLocalIp() {
  const nets = os.networkInterfaces()
  let fallback = 'localhost'
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (net.address.startsWith('172.20.10.')) {
          return net.address
        }
        if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
          fallback = net.address
        }
      }
    }
  }
  return fallback
}

// Read database and perform migration to username & password system
function loadDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDB = {
      users: [
        {
          id: 'u_main',
          username: 'user',
          passwordHash: hashPassword('1234'),
          name: 'මගේ ගිණුම (My Account)',
          avatar: '🎓',
          createdAt: Date.now(),
        },
      ],
      userData: {
        u_main: {
          transactions: [
            {
              id: 'tx-1',
              type: 'income',
              amount: 5000,
              category: 'other',
              date: new Date().toISOString().split('T')[0],
              note: 'ආරම්භක මුදල (Starting Cash)',
            },
          ],
          settings: {
            currency: 'Rs.',
            language: 'si',
            darkMode: true,
          },
          lastUpdated: Date.now(),
        },
      },
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8')
    return initialDB
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    const parsed = JSON.parse(raw)

    if (!parsed.users) parsed.users = []
    if (!parsed.userData) parsed.userData = {}

    // Ensure all existing users have username & passwordHash
    let changed = false
    parsed.users.forEach((u, idx) => {
      if (!u.username) {
        const cleanName = (u.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')
        u.username = cleanName || `user${idx + 1}`
        changed = true
      }
      if (!u.passwordHash) {
        // default password '1234' for existing accounts
        u.passwordHash = hashPassword(u.pin || '1234')
        changed = true
      }
    })

    // Ensure all existing user records have loans array and default to English
    Object.keys(parsed.userData).forEach(uid => {
      const uData = parsed.userData[uid]
      if (!uData.loans) {
        uData.loans = []
        changed = true
      }
      if (uData.settings && uData.settings.language === 'si') {
        uData.settings.language = 'en'
        changed = true
      }
    })

    if (changed) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8')
    }

    return parsed
  } catch {
    return { users: [], userData: {} }
  }
}

function saveDB(data) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// Authentication & Multi-user API Plugin
function authApiPlugin() {
  return {
    name: 'unicash-auth-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost:5173')
        const pathname = urlObj.pathname

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }

        // 1. GET /api/network - returns current server IP for iPhone connection
        if (pathname === '/api/network' && req.method === 'GET') {
          const ip = getLocalIp()
          const port = server.config.server.port || 5173
          let tunnelUrl = ''
          const tunnelFile = path.resolve(__dirname, 'data', 'tunnel.url')
          if (fs.existsSync(tunnelFile)) {
            tunnelUrl = fs.readFileSync(tunnelFile, 'utf-8').trim()
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ip, port, url: `http://${ip}:${port}`, tunnelUrl }))
          return
        }

        // 2. POST /api/auth/register - Register with Username and Password
        if (pathname === '/api/auth/register' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const { username, password, name, avatar, initialBalance } = JSON.parse(body)

              const cleanUsername = String(username || '').trim().toLowerCase()
              const cleanPassword = String(password || '').trim()
              const cleanName = String(name || '').trim()

              if (!cleanUsername || cleanUsername.length < 3) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Username must be at least 3 characters (අවම වශයෙන් අකුරු 3 ක් විය යුතුය)' }))
                return
              }

              if (!cleanPassword || cleanPassword.length < 4) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Password must be at least 4 characters (මුරපදය අවම වශයෙන් අකුරු/ඉලක්කම් 4 ක් විය යුතුය)' }))
                return
              }

              if (!cleanName) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Name is required (ඔබගේ නම අවශ්‍යයි)' }))
                return
              }

              const db = loadDB()

              // Check if username already exists
              const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername)
              if (existing) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'This username is already taken. Please choose another! (මෙම Username එක දැනටමත් භාවිතයේ ඇත. වෙනත් එකක් යොදන්න)' }))
                return
              }

              const userId = 'u_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
              const newUser = {
                id: userId,
                username: cleanUsername,
                passwordHash: hashPassword(cleanPassword),
                name: cleanName,
                avatar: avatar || '🎓',
                createdAt: Date.now(),
              }

              const initAmt = parseFloat(initialBalance) || 0
              const initialTransactions = []
              if (initAmt > 0) {
                initialTransactions.push({
                  id: 'tx-init-' + Date.now(),
                  type: 'income',
                  amount: initAmt,
                  category: 'other',
                  date: new Date().toISOString().split('T')[0],
                  note: 'Starting Cash in Hand',
                })
              }

              db.users.push(newUser)
              db.userData[userId] = {
                transactions: initialTransactions,
                settings: {
                  currency: 'Rs.',
                  language: 'en',
                  darkMode: true,
                },
                loans: [],
                lastUpdated: Date.now(),
              }

              saveDB(db)

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                user: { id: newUser.id, username: newUser.username, name: newUser.name, avatar: newUser.avatar },
                data: db.userData[userId],
              }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // 3. POST /api/auth/login - Login with Username and Password
        if (pathname === '/api/auth/login' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const { username, password } = JSON.parse(body)
              const cleanUsername = String(username || '').trim().toLowerCase()
              const cleanPassword = String(password || '').trim()

              const db = loadDB()
              const user = db.users.find(u => u.username.toLowerCase() === cleanUsername)

              if (!user) {
                res.statusCode = 401
                res.end(JSON.stringify({ error: 'Invalid username or password' }))
                return
              }

              const expectedHash = hashPassword(cleanPassword)
              if (user.passwordHash !== expectedHash) {
                res.statusCode = 401
                res.end(JSON.stringify({ error: 'Invalid username or password' }))
                return
              }

              const userData = db.userData[user.id] || {
                transactions: [],
                settings: { currency: 'Rs.', language: 'en', darkMode: true },
                loans: [],
                lastUpdated: Date.now(),
              }
              if (!userData.loans) {
                userData.loans = []
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar },
                data: userData,
              }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        // 4. GET /api/user-data?id=... - Get specific user's transactions & settings
        if (pathname === '/api/user-data' && req.method === 'GET') {
          const userId = urlObj.searchParams.get('id')
          if (!userId) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'User ID is required' }))
            return
          }

          const db = loadDB()
          const data = db.userData[userId]
          if (!data) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'User data not found' }))
            return
          }

          if (!data.loans) data.loans = []

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return
        }

        // 5. POST /api/user-data - Save specific user's transactions & settings
        if (pathname === '/api/user-data' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const { id, transactions, settings, loans, lastUpdated } = JSON.parse(body)
              if (!id) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'User ID is required' }))
                return
              }

              const db = loadDB()
              db.userData[id] = {
                transactions: transactions || [],
                settings: settings || { currency: 'Rs.', language: 'en', darkMode: true },
                loans: loans || [],
                lastUpdated: lastUpdated || Date.now(),
              }
              saveDB(db)

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, lastUpdated: db.userData[id].lastUpdated }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), authApiPlugin()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
})
