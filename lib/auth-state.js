import { getAuthState, forceGuest } from "./auth-store.js"

// Global auth state management - now proxies to auth-store
let currentUser = null
let authListeners = []

export function setCurrentUser(user) {
  currentUser = user
  notifyListeners()
}

export function getCurrentUserState() {
  const { user } = getAuthState()
  return user
}

export function onAuthStateChange(callback) {
  authListeners.push(callback)

  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter((listener) => listener !== callback)
  }
}

function notifyListeners() {
  authListeners.forEach((listener) => listener(currentUser))
}

export function clearAuthState() {
  forceGuest()
  currentUser = null
  notifyListeners()
}
