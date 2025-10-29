import { getSupabaseClient } from "./supabase.js"

const authStore = {
  authReady: false,
  user: null,
  userProfile: null,
  listeners: [],
}

function getCachedSession() {
  try {
    // Supabase stores session in localStorage with key pattern: sb-<project-ref>-auth-token
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))

    if (keys.length > 0) {
      const sessionData = localStorage.getItem(keys[0])
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        return parsed
      }
    }
  } catch (error) {
    console.error("[v0] Error reading cached session:", error)
  }
  return null
}

export async function initAuth() {
  console.log("[v0] Initializing auth store...")

  const supabase = getSupabaseClient()

  const cachedSession = getCachedSession()
  if (cachedSession?.access_token && cachedSession?.user) {
    console.log("[v0] Found cached session, loading optimistically:", cachedSession.user.email)
    authStore.user = cachedSession.user
    authStore.authReady = true
    notifyListeners()

    // Load profile in background
    loadUserProfile(cachedSession.user).then(() => {
      notifyListeners()
    })
  }

  // Get fresh session from Supabase
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("[v0] Error getting session:", error)
  }

  if (session?.user) {
    console.log("[v0] Fresh session confirmed:", session.user.email)
    await loadUserProfile(session.user)
  } else {
    console.log("[v0] No session found")
    authStore.user = null
    authStore.userProfile = null
  }

  authStore.authReady = true
  notifyListeners()

  // Subscribe to auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("[v0] Auth state changed:", event, session?.user?.email)

    if (session?.user) {
      await loadUserProfile(session.user)
    } else {
      authStore.user = null
      authStore.userProfile = null
    }

    notifyListeners()
  })

  console.log("[v0] Auth store initialized, authReady:", authStore.authReady)
}

async function loadUserProfile(authUser) {
  const supabase = getSupabaseClient()

  const { data: profile, error } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  if (error) {
    console.error("[v0] Error loading user profile:", error)
    authStore.user = authUser
    authStore.userProfile = null
  } else {
    authStore.user = authUser
    authStore.userProfile = profile
  }
}

export function getAuthState() {
  return {
    authReady: authStore.authReady,
    user: authStore.user,
    userProfile: authStore.userProfile,
  }
}

export function onAuthChange(callback) {
  authStore.listeners.push(callback)

  // Return unsubscribe function
  return () => {
    authStore.listeners = authStore.listeners.filter((l) => l !== callback)
  }
}

function notifyListeners() {
  authStore.listeners.forEach((listener) => {
    listener(getAuthState())
  })
}

export function forceGuest() {
  console.log("[v0] Forcing guest state (optimistic logout)")
  authStore.user = null
  authStore.userProfile = null
  authStore.authReady = true
  notifyListeners()
}

export function requireAuth(redirectTo = "/signup.html") {
  const { authReady, user } = getAuthState()

  if (!authReady) {
    return false
  }

  if (!user) {
    window.location.href = redirectTo
    return false
  }

  return true
}

export function checkFreeTries() {
  const tries = localStorage.getItem("free_tries")
  return tries ? Number.parseInt(tries) : 0
}

export function incrementFreeTries() {
  const tries = checkFreeTries()
  localStorage.setItem("free_tries", (tries + 1).toString())
}

export function hasFreeTryAvailable() {
  return checkFreeTries() < 1
}
