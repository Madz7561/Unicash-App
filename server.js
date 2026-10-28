import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

app.use(cors());
app.use(express.json());

const DB_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DB_DIR, 'db.json');

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function getLocalIp() {
  const nets = os.networkInterfaces();
  let fallback = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (net.address.startsWith('172.20.10.')) {
          return net.address;
        }
        if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
          fallback = net.address;
        }
      }
    }
  }
  return fallback;
}

function loadDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDB = {
      users: [],
      userData: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
    return initialDB;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.users) parsed.users = [];
    if (!parsed.userData) parsed.userData = {};
    return parsed;
  } catch {
    return { users: [], userData: {} };
  }
}

function saveDB(data) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ================= API ROUTES =================

// 1. GET /api/network - returns current server IP & tunnel if any
app.get('/api/network', (req, res) => {
  const ip = getLocalIp();
  let tunnelUrl = '';
  const tunnelFile = path.resolve(DB_DIR, 'tunnel.url');
  if (fs.existsSync(tunnelFile)) {
    tunnelUrl = fs.readFileSync(tunnelFile, 'utf-8').trim();
  }
  res.json({ ip, port: PORT, url: `http://${ip}:${PORT}`, tunnelUrl });
});

// 2. POST /api/auth/register - Register with Username and Password
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, name, avatar, initialBalance } = req.body;
    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();
    const cleanName = String(name || '').trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    if (!cleanName) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const db = loadDB();
    const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const userId = 'u_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newUser = {
      id: userId,
      username: cleanUsername,
      passwordHash: hashPassword(cleanPassword),
      name: cleanName,
      avatar: avatar || '🎓',
      createdAt: Date.now(),
    };

    const initAmt = parseFloat(initialBalance) || 0;
    const initialTransactions = [];
    if (initAmt > 0) {
      initialTransactions.push({
        id: 'tx-init-' + Date.now(),
        type: 'income',
        amount: initAmt,
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        note: 'Starting Cash in Hand',
      });
    }

    db.users.push(newUser);
    db.userData[userId] = {
      transactions: initialTransactions,
      settings: {
        currency: 'Rs.',
        language: 'en',
        darkMode: true,
      },
      loans: [],
      lastUpdated: Date.now(),
    };

    saveDB(db);

    res.json({
      success: true,
      user: { id: newUser.id, username: newUser.username, name: newUser.name, avatar: newUser.avatar },
      data: db.userData[userId],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/auth/login - Login with Username and Password
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    const db = loadDB();
    const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const expectedHash = hashPassword(cleanPassword);
    if (user.passwordHash !== expectedHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const userData = db.userData[user.id] || {
      transactions: [],
      settings: { currency: 'Rs.', language: 'en', darkMode: true },
      loans: [],
      lastUpdated: Date.now(),
    };
    if (!userData.loans) {
      userData.loans = [];
    }

    res.json({
      success: true,
      user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar },
      data: userData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/user-data?id=... - Get user's data
app.get('/api/user-data', (req, res) => {
  const userId = req.query.id;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const db = loadDB();
  const data = db.userData[userId];
  if (!data) {
    return res.status(404).json({ error: 'User data not found' });
  }

  if (!data.loans) data.loans = [];
  res.json(data);
});

// 5. POST /api/user-data - Save user's data
app.post('/api/user-data', (req, res) => {
  try {
    const { id, transactions, settings, loans, lastUpdated } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = loadDB();
    db.userData[id] = {
      transactions: transactions || [],
      settings: settings || { currency: 'Rs.', language: 'en', darkMode: true },
      loans: loans || [],
      lastUpdated: lastUpdated || Date.now(),
    };
    saveDB(db);

    res.json({ success: true, lastUpdated: db.userData[id].lastUpdated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= STATIC FILES & SPA FALLBACK =================
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`UniCash Production Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
});
