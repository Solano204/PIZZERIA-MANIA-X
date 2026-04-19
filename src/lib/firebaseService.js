/**
 * Firebase Service Layer
 *
 * All cloud persistence goes through this file.
 * Nothing is stored in localStorage — everything lives in Firestore.
 *
 * Firestore structure:
 *   branches/{branchId}          → single document containing the full state blob
 *   sessions/{sessionId}         → user session documents (for auth persistence)
 *
 * Rules needed in Firebase console:
 *   allow read, write: if true;   (during dev — tighten for production)
 */

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_DATA } from './defaultData'

// ─── helpers ────────────────────────────────────────────────────────────────

function branchRef(branchId) {
  return doc(db, 'branches', branchId)
}

function sessionRef(sessionId) {
  return doc(db, 'sessions', sessionId)
}

function cleanStateForSave(state) {
  const clean = { ...state }

  // Strip virtual (half-and-half) products — they're transient
  clean.products = (clean.products || []).filter(p => !p.isVirtual)

  // Keep only last 7 days of completed orders — keeps doc size manageable
  const limit = new Date()
  limit.setDate(limit.getDate() - 7)
  limit.setHours(0, 0, 0, 0)
  clean.orders = (clean.orders || []).filter(o => {
    if (o.paymentStatus !== 'paid' && o.status !== 'cancelled') return true
    return new Date(o.createdAt) >= limit
  })

  // Trim activity log to last 200 entries
  if (clean.activityLog?.length > 200) {
    clean.activityLog = clean.activityLog.slice(-200)
  }

  // Trim notifications to last 50
  if (clean.notifications?.length > 50) {
    clean.notifications = clean.notifications.slice(-50)
  }

  return clean
}

// ─── branch state ────────────────────────────────────────────────────────────

export async function loadBranchState(branchId) {
  try {
    const snap = await getDoc(branchRef(branchId))
    if (!snap.exists()) {
      // First time — seed with default data
      const seed = JSON.parse(JSON.stringify(DEFAULT_DATA))
      await setDoc(branchRef(branchId), { state: seed, updatedAt: serverTimestamp() })
      return seed
    }
    const data = snap.data()
    return { ...JSON.parse(JSON.stringify(DEFAULT_DATA)), ...(data.state || {}) }
  } catch (err) {
    console.error('[Firebase] loadBranchState error:', err)
    return JSON.parse(JSON.stringify(DEFAULT_DATA))
  }
}

export async function saveBranchState(branchId, state) {
  try {
    const clean = cleanStateForSave(state)
    await setDoc(
      branchRef(branchId),
      { state: clean, updatedAt: serverTimestamp() },
      { merge: false }
    )
  } catch (err) {
    console.error('[Firebase] saveBranchState error:', err)
    throw err
  }
}

export function subscribeToBranchState(branchId, callback) {
  const ref = branchRef(branchId)
  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (data?.state) {
          callback({ ...JSON.parse(JSON.stringify(DEFAULT_DATA)), ...data.state })
        }
      }
    },
    (err) => {
      console.error('[Firebase] snapshot error:', err)
    }
  )
  return unsub
}

// ─── session persistence (replaces localStorage) ────────────────────────────
// We store the active session in Firestore under a stable key derived from
// the device fingerprint (tab sessionStorage id).  This way closing the tab
// clears nothing but the session doc stays for 24 h.

function getSessionId() {
  let id = sessionStorage.getItem('pizzamania_session_id')
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem('pizzamania_session_id', id)
  }
  return id
}

export async function saveSession(user, branch) {
  const sid = getSessionId()
  sessionStorage.setItem('currentBranch', branch)
  await setDoc(sessionRef(sid), {
    user,
    branch,
    createdAt: serverTimestamp(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 h
  })
}

export async function loadSession() {
  const sid = getSessionId()
  try {
    const snap = await getDoc(sessionRef(sid))
    if (!snap.exists()) return null
    const data = snap.data()
    if (!data || Date.now() > data.expiresAt) return null
    return { user: data.user, branch: data.branch }
  } catch {
    return null
  }
}

export async function clearSession() {
  const sid = getSessionId()
  sessionStorage.removeItem('currentBranch')
  try {
    // Just overwrite with expired doc — avoids needing delete permission
    await setDoc(sessionRef(sid), { expiresAt: 0 })
  } catch {}
}
