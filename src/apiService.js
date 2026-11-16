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
        friends: [],
        friends: [],
        lastUpdated: Date.now(),
      };
      if (dataRes.ok) {
        const fetched = await safeJson(dataRes);
        if (fetched) userData = fetched;
      }
      if (!userData.loans) userData.loans = [];
      if (!userData.notes) userData.notes = [];
      if (!userData.friends) userData.friends = [];

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
        friends: [],
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

// 7. Search registered users in Firebase by username or name
export async function searchUsersApi(query, currentUserId) {
  try {
    const users = await getFirebaseUsers();
    if (!users) return [];
    const q = String(query || '').trim().toLowerCase().replace(/^@/, '');
    return users
      .filter(u => u && u.id && u.id !== currentUserId)
      .filter(u => {
        if (!q) return true;
        const un = String(u.username || '').toLowerCase().replace(/^@/, '');
        const nm = String(u.name || '').toLowerCase();
        return un.includes(q) || nm.includes(q);
      })
      .map(u => ({
        id: u.id,
        username: u.username,
        name: u.name || u.username,
        avatar: u.avatar || '🎓',
      }));
  } catch (err) {
    console.warn('Search users error:', err);
    return [];
  }
}

// 8. Create a 2-way shared debt request
export async function createDebtRequestApi(request) {
  try {
    const res = await fetch(`${FIREBASE_BASE_URL}/debtRequests/${request.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return res.ok;
  } catch (err) {
    console.warn('Create debt request error:', err);
    return false;
  }
}

// 9. Fetch debt requests relevant to a user (as target or creator)
export async function fetchUserDebtRequestsApi(userId) {
  try {
    const res = await fetch(`${FIREBASE_BASE_URL}/debtRequests.json`);
    if (res.ok) {
      const data = await safeJson(res);
      if (!data) return [];
      const list = Object.values(data).filter(Boolean);
      return list.filter(r => r.targetId === userId || r.creatorId === userId);
    }
  } catch (err) {
    console.warn('Fetch debt requests error:', err);
  }
  return [];
}

// 10. Update a debt request status (confirm, decline, settle)
export async function updateDebtRequestApi(requestId, updateData) {
  try {
    const res = await fetch(`${FIREBASE_BASE_URL}/debtRequests/${requestId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    return res.ok;
  } catch (err) {
    console.warn('Update debt request error:', err);
    return false;
  }
}

// ================= ADMIN API FUNCTIONS =================

// 11. Fetch all users along with their activity metadata from Firebase
export async function fetchAllUsersAdminApi() {
  try {
    const [usersRes, userDataRes] = await Promise.all([
      fetch(`${FIREBASE_BASE_URL}/users.json`),
      fetch(`${FIREBASE_BASE_URL}/userData.json`),
    ]);

    let usersList = [];
    if (usersRes.ok) {
      const usersData = await safeJson(usersRes);
      if (usersData) {
        if (Array.isArray(usersData)) {
          usersList = usersData.filter(Boolean);
        } else {
          usersList = Object.values(usersData).filter(Boolean);
        }
      }
    }

    let allUserData = {};
    if (userDataRes.ok) {
      const data = await safeJson(userDataRes);
      if (data) allUserData = data;
    }

    // Merge metadata
    return usersList.map(u => {
      const ud = allUserData[u.id] || {};
      const txs = Array.isArray(ud.transactions) ? ud.transactions : [];
      const loans = Array.isArray(ud.loans) ? ud.loans : [];
      const notes = Array.isArray(ud.notes) ? ud.notes : [];

      // Calculate Cash & Bank balance
      const cashIncome = txs.filter(t => t.type === 'income' && (t.account || 'cash') === 'cash').reduce((s, t) => s + Number(t.amount || 0), 0);
      const cashExpense = txs.filter(t => t.type === 'expense' && (t.account || 'cash') === 'cash').reduce((s, t) => s + Number(t.amount || 0), 0);
      const bankIncome = txs.filter(t => t.type === 'income' && t.account === 'bank').reduce((s, t) => s + Number(t.amount || 0), 0);
      const bankExpense = txs.filter(t => t.type === 'expense' && t.account === 'bank').reduce((s, t) => s + Number(t.amount || 0), 0);

      return {
        ...u,
        txCount: txs.length,
        loansCount: loans.length,
        notesCount: notes.length,
        cashBalance: cashIncome - cashExpense,
        bankBalance: bankIncome - bankExpense,
        totalBalance: (cashIncome - cashExpense) + (bankIncome - bankExpense),
        lastUpdated: ud.lastUpdated || u.createdAt || null,
      };
    });
  } catch (err) {
    console.error('Fetch all users admin error:', err);
    return [];
  }
}

// 12. Reset a user's password (Admin action)
export async function resetUserPasswordAdminApi(userId, newPlainPassword) {
  try {
    const usersRes = await fetch(`${FIREBASE_BASE_URL}/users.json`);
    if (!usersRes.ok) return { success: false, error: 'Failed to access database' };
    const users = await safeJson(usersRes);
    if (!users) return { success: false, error: 'User list empty' };

    const newHash = await sha256Hex(String(newPlainPassword).trim());

    if (Array.isArray(users)) {
      const idx = users.findIndex(u => u && u.id === userId);
      if (idx === -1) return { success: false, error: 'User not found' };
      const res = await fetch(`${FIREBASE_BASE_URL}/users/${idx}/passwordHash.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHash),
      });
      return { success: res.ok };
    } else {
      // Object mapping
      const entry = Object.entries(users).find(([_, u]) => u && u.id === userId);
      if (!entry) return { success: false, error: 'User not found' };
      const [key] = entry;
      const res = await fetch(`${FIREBASE_BASE_URL}/users/${key}/passwordHash.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHash),
      });
      return { success: res.ok };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 13. Toggle user account suspension / status (Admin action)
export async function toggleUserSuspensionAdminApi(userId, isSuspended) {
  try {
    const usersRes = await fetch(`${FIREBASE_BASE_URL}/users.json`);
    if (!usersRes.ok) return false;
    const users = await safeJson(usersRes);
    if (!users) return false;

    if (Array.isArray(users)) {
      const idx = users.findIndex(u => u && u.id === userId);
      if (idx === -1) return false;
      const res = await fetch(`${FIREBASE_BASE_URL}/users/${idx}/isSuspended.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSuspended),
      });
      return res.ok;
    } else {
      const entry = Object.entries(users).find(([_, u]) => u && u.id === userId);
      if (!entry) return false;
      const [key] = entry;
      const res = await fetch(`${FIREBASE_BASE_URL}/users/${key}/isSuspended.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSuspended),
      });
      return res.ok;
    }
  } catch (err) {
    console.error('Toggle suspension error:', err);
    return false;
  }
}

// 14. Delete a user completely from database (Admin action)
export async function deleteUserAdminApi(userId) {
  try {
    const usersRes = await fetch(`${FIREBASE_BASE_URL}/users.json`);
    if (!usersRes.ok) return false;
    const users = await safeJson(usersRes);
    if (!users) return false;

    // Filter out user and re-save users array/object
    let newUsers = [];
    if (Array.isArray(users)) {
      newUsers = users.filter(u => u && u.id !== userId);
    } else {
      newUsers = Object.values(users).filter(u => u && u.id !== userId);
    }

    await Promise.all([
      fetch(`${FIREBASE_BASE_URL}/users.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUsers),
      }),
      fetch(`${FIREBASE_BASE_URL}/userData/${userId}.json`, {
        method: 'DELETE',
      }),
    ]);

    return true;
  } catch (err) {
    console.error('Delete user admin error:', err);
    return false;
  }
}
