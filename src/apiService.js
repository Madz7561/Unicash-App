// Firebase Realtime Database Service for UniCash
const FIREBASE_BASE_URL = 'https://unicash-app-fb12a-default-rtdb.firebaseio.com';

// Standard Web Crypto SHA-256 hash function (built-in to all modern browsers)
export async function sha256Hex(message) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    let h = 0;
    for (let i = 0; i < message.length; i++) {
      h = Math.imul(31, h) + message.charCodeAt(i) | 0;
    }
    return String(h);
  }
}

async function safeJson(res) {
  try {
    const text = await res.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// 1. Fetch network info (tunnel / local IP) if running with local server
export async function fetchNetworkInfo() {
  try {
    const res = await fetch('/api/network');
    if (res.ok) {
      const json = await safeJson(res);
      if (json && json.url) return json;
    }
  } catch {}
  return null;
}

// 2. Fetch all users from Firebase
export async function getFirebaseUsers() {
  try {
    const res = await fetch(`${FIREBASE_BASE_URL}/users.json`);
    if (res.ok) {
      const data = await safeJson(res);
      if (!data) return [];
      if (Array.isArray(data)) return data.filter(Boolean);
      return Object.values(data);
    }
  } catch (err) {
    console.warn('Firebase get users error:', err);
  }
  return null;
}

// 3. Login
export async function loginApi(username, password) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();
  const passwordHash = await sha256Hex(cleanPassword);

  // Try Firebase first
  try {
    const users = await getFirebaseUsers();
    if (users && users.length > 0) {
      const user = users.find(u => u && u.username && u.username.toLowerCase() === cleanUsername);
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }
      if (user.passwordHash !== passwordHash) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Fetch user data from Firebase
      const dataRes = await fetch(`${FIREBASE_BASE_URL}/userData/${user.id}.json`);
      let userData = {
        transactions: [],
        settings: { currency: 'Rs.', language: 'en', darkMode: true },
        loans: [],
        notes: [],
        lastUpdated: Date.now(),
      };
      if (dataRes.ok) {
        const fetched = await safeJson(dataRes);
        if (fetched) userData = fetched;
      }
      if (!userData.loans) userData.loans = [];
      if (!userData.notes) userData.notes = [];

      return {
        success: true,
        user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar },
        data: userData,
      };
    }
  } catch (err) {
    console.warn('Firebase login error:', err);
  }

  // Fallback to local server ONLY when running on localhost
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
      });
      const data = await safeJson(res);
      if (data) return data;
    } catch (err) {
      return { success: false, error: 'Connection error: ' + err.message };
    }
  }

  return { success: false, error: 'Unable to connect to database. Please check your internet connection.' };
}

// 4. Register
export async function registerApi({ username, password, name, avatar, initialBalance }) {
  const cleanUsername = String(username || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();
  const cleanName = String(name || '').trim();
  const passwordHash = await sha256Hex(cleanPassword);

  try {
    const users = await getFirebaseUsers();
    if (users) {
      const existing = users.find(u => u && u.username && u.username.toLowerCase() === cleanUsername);
      if (existing) {
        return { success: false, error: 'Username is already taken. Please choose another.' };
      }

      const userId = 'u_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const newUser = {
        id: userId,
        username: cleanUsername,
        passwordHash,
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

      const initialUserData = {
        transactions: initialTransactions,
        settings: { currency: 'Rs.', language: 'en', darkMode: true },
        loans: [],
        notes: [],
        lastUpdated: Date.now(),
      };

      // Append user to Firebase users array
      const nextIndex = users.length;
      await fetch(`${FIREBASE_BASE_URL}/users/${nextIndex}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      // Save initial user data
      await fetch(`${FIREBASE_BASE_URL}/userData/${userId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialUserData),
      });

      return {
        success: true,
        user: { id: newUser.id, username: newUser.username, name: newUser.name, avatar: newUser.avatar },
        data: initialUserData,
      };
    }
  } catch (err) {
    console.warn('Firebase register error:', err);
  }

  // Fallback to local server ONLY when running on localhost
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword, name: cleanName, avatar, initialBalance }),
      });
      const data = await safeJson(res);
      if (data) return data;
    } catch (err) {
      return { success: false, error: 'Connection error: ' + err.message };
    }
  }

  return { success: false, error: 'Registration failed. Please check your internet connection.' };
}

// 5. Fetch user data
export async function fetchUserDataApi(userId) {
  try {
    const res = await fetch(`${FIREBASE_BASE_URL}/userData/${userId}.json`);
    if (res.ok) {
      const data = await safeJson(res);
      if (data) {
        if (!data.loans) data.loans = [];
        return data;
      }
    }
  } catch (err) {
    console.warn('Firebase get user data error:', err);
  }

  // Fallback to local server
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    try {
      const res = await fetch(`/api/user-data?id=${userId}`);
      if (res.ok) return await safeJson(res);
    } catch {}
  }
  return null;
}

// 6. Save user data
export async function saveUserDataApi(payload) {
  try {
    const res = await fetch(`${FIREBASE_BASE_URL}/userData/${payload.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      // Also silently notify local server if running
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        fetch('/api/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }
      return true;
    }
  } catch (err) {
    console.warn('Firebase save user data error:', err);
  }

  // Fallback to local server
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    try {
      const res = await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {}
  }
  return false;
}
