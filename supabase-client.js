import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"

const SUPABASE_URL = "https://gyefxlyzxoasrsridxjk.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZWZ4bHl6eG9hc3JzcmlkeGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTY3NTcsImV4cCI6MjA3NjM5Mjc1N30.cZ89pfTn7LNoAnw4iX_dRUaBEogdE4PeS9U9j_k-1d8"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function getBaseUrl() {
  // Check if running on GitHub Pages
  if (window.location.hostname.includes("github.io")) {
    // For GitHub Pages: https://entrepreneur000.github.io/lynxfree
    return window.location.origin + "/lynxfree"
  }
  // For local development or custom domain
  return window.location.origin
}

// Auth helper functions
export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getBaseUrl() + "/auth/callback.html",
    },
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getBaseUrl() + "/reset-password.html",
  })
  return { data, error }
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  return { data, error }
}

export async function updateEmail(newEmail) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  })
  return { data, error }
}

export async function updateDisplayName(displayName) {
  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  })
  return { data, error }
}

export async function deleteAccount() {
  const user = await getCurrentUser()
  if (!user) return { error: "No user logged in" }

  // Delete user profile first
  await supabase.from("user_profiles").delete().eq("user_id", user.id)

  // Note: Supabase doesn't allow direct user deletion from client
  // You'll need to set up a server function or use Supabase dashboard
  return { error: null }
}

// User profile functions
export async function getUserProfile(userId) {
  const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

  return { data, error }
}

export async function createUserProfile(userId, email, displayName) {
  const { data, error } = await supabase.from("user_profiles").insert({
    user_id: userId,
    email: email,
    display_name: displayName,
    subscription_type: "free",
    analyses_today: 0,
    last_analysis_date: new Date().toISOString().split("T")[0],
  })

  return { data, error }
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase.from("user_profiles").update(updates).eq("user_id", userId)

  return { data, error }
}

// Usage tracking functions
export async function checkAnalysisLimit(userId) {
  const { data: profile, error } = await getUserProfile(userId)

  if (error) return { allowed: false, error }

  const today = new Date().toISOString().split("T")[0]

  // Reset counter if it's a new day
  if (profile.last_analysis_date !== today) {
    await updateUserProfile(userId, {
      analyses_today: 0,
      last_analysis_date: today,
    })
    return { allowed: true, remaining: 50 }
  }

  // Premium users have unlimited analyses
  if (profile.subscription_type === "premium") {
    return { allowed: true, remaining: "unlimited" }
  }

  // Free users limited to 50 per day
  if (profile.analyses_today >= 50) {
    return { allowed: false, remaining: 0, error: "Daily limit reached" }
  }

  return { allowed: true, remaining: 50 - profile.analyses_today }
}

export async function incrementAnalysisCount(userId) {
  const { data: profile } = await getUserProfile(userId)

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      analyses_today: profile.analyses_today + 1,
      total_analyses: profile.total_analyses + 1,
    })
    .eq("user_id", userId)

  return { data, error }
}

// Listen to auth state changes
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChanged(callback)
}
