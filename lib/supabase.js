// Supabase client configuration
const SUPABASE_URL = "https://gyefxlyzxoasrsridxjk.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZWZ4bHl6eG9hc3JzcmlkeGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTY3NTcsImV4cCI6MjA3NjM5Mjc1N30.cZ89pfTn7LNoAnw4iX_dRUaBEogdE4PeS9U9j_k-1d8"

function getBaseUrl() {
  // Check if running on GitHub Pages
  if (window.location.hostname.includes("github.io")) {
    // For GitHub Pages: https://entrepreneur000.github.io/lynxfree
    return window.location.origin + "/lynxfree"
  }
  // For local development or custom domain
  return window.location.origin
}

// Create a single supabase client for interacting with your database
let supabaseClient = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  // Import Supabase from CDN
  if (typeof window !== "undefined" && !window.supabase) {
    throw new Error("Supabase library not loaded. Please include the Supabase CDN script.")
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return supabaseClient
}

// Auth helper functions
export async function signUp(email, username, password) {
  const supabase = getSupabaseClient()

  console.log("[v0] Starting signup process for:", email)

  // This is more reliable than checking the public.users table
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      },
      emailRedirectTo: getBaseUrl() + "/auth/callback.html",
    },
  })

  if (authError) {
    console.log("[v0] Signup error:", authError)
    if (
      authError.message.includes("already registered") ||
      authError.message.includes("already exists") ||
      authError.message.includes("User already registered")
    ) {
      throw new Error("An account with this email already exists. Please login.")
    }
    throw authError
  }

  // Supabase sometimes returns success even if user exists (just resends confirmation)
  if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
    // User already exists but hasn't confirmed email
    console.log("[v0] User already exists but hasn't confirmed email")
    throw new Error("An account with this email already exists. Please check your email or login.")
  }

  console.log("[v0] Auth signup successful:", authData)

  // Wait a moment for the trigger to create the user record
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Get the created user data from our users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single()

  if (userError) {
    console.error("[v0] Error fetching user data:", userError)
    // Return auth data even if we can't fetch user data yet
    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: username,
        credits: 3,
        is_premium: false,
      },
      session: authData.session,
    }
  }

  console.log("[v0] User data fetched:", userData)
  return { user: userData, session: authData.session }
}

export async function signIn(email, password) {
  const supabase = getSupabaseClient()

  console.log("[v0] Attempting login for:", email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.log("[v0] Login error:", error)
    if (error.message.includes("Email not confirmed")) {
      throw new Error(
        "Please confirm your email address before logging in. Check your inbox for the confirmation link.",
      )
    }
    throw error
  }

  console.log("[v0] Login successful, auth data:", data)

  // Get user data from our users table
  const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", data.user.id).single()

  if (userError) {
    console.error("[v0] Error fetching user data:", userError)
    // Return basic user data if we can't fetch from users table
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        credits: 3,
        is_premium: false,
      },
      session: data.session,
    }
  }

  if (userData.is_banned) {
    await supabase.auth.signOut()
    throw new Error("Your account has been banned. Please contact support for more information.")
  }

  console.log("[v0] User data fetched:", userData)
  return { user: userData, session: data.session }
}

export async function signInWithGoogle() {
  const supabase = getSupabaseClient()

  console.log("[v0] Starting Google OAuth sign-in...")

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getBaseUrl() + "/auth/callback.html",
    },
  })

  if (error) {
    console.error("[v0] Google OAuth error:", error)
    throw error
  }

  console.log("[v0] Google OAuth initiated:", data)
  return { data, error: null }
}

export async function signOut() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error

  // Clear local storage
  localStorage.removeItem("currentUser")
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient()

  console.log("[v0] getCurrentUser: Checking session...")

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("[v0] getCurrentUser: Session data:", session)

  if (!session) {
    console.log("[v0] getCurrentUser: No session found")
    return null
  }

  // Get user data from our users table
  console.log("[v0] getCurrentUser: Fetching user data for ID:", session.user.id)
  const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  if (error) {
    console.error("[v0] getCurrentUser: Error fetching user data:", error)
    return null
  }

  console.log("[v0] getCurrentUser: User data retrieved:", userData)
  return userData
}

export async function updateUserCredits(userId, newCredits) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("users")
    .update({ credits: newCredits })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function decrementUserCredits(userId) {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new Error("User not found")

  if (user.is_premium) {
    // Premium users don't need credit deduction, just return current user
    return user
  }

  if (user.credits <= 0) {
    throw new Error("No credits remaining. Please upgrade to Premium.")
  }

  // Just decrement credits, no tracking
  const { data, error } = await supabase
    .from("users")
    .update({ credits: user.credits - 1 })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveAnalysis(userId, imageUrl, analysisResult) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("analyses")
    .insert([
      {
        user_id: userId,
        image_url: imageUrl,
        analysis_result: analysisResult,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserAnalyses(userId) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function upgradeToPremium(userId) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("users")
    .update({ is_premium: true, credits: 999999 })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function resetPasswordForEmail(email) {
  const supabase = getSupabaseClient()

  console.log("[v0] Requesting password reset for:", email)

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getBaseUrl() + "/reset-password.html",
  })

  if (error) {
    console.error("[v0] Password reset request error:", error)
    throw error
  }

  console.log("[v0] Password reset email sent successfully")
  return { data, error: null }
}

// Account management functions
export async function getUserProfile(userId) {
  const supabase = getSupabaseClient()

  console.log("[v0] getUserProfile called for user:", userId)

  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) {
    console.error("[v0] getUserProfile error:", error)
    return { data: null, error }
  }

  console.log("[v0] getUserProfile data:", data)
  return { data, error: null }
}

export async function updateDisplayName(newName) {
  const supabase = getSupabaseClient()
  const user = await getCurrentUser()

  if (!user) {
    return { error: new Error("Not authenticated") }
  }

  const { data, error } = await supabase.from("users").update({ username: newName }).eq("id", user.id).select().single()

  return { data, error }
}

export async function updateEmail(newEmail) {
  const supabase = getSupabaseClient()

  console.log("[v0] updateEmail called with:", newEmail)

  // Update email in Supabase Auth
  try {
    const { data, error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: getBaseUrl() + "/account.html?type=email_change" },
    )

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updatePassword(newPassword) {
  const supabase = getSupabaseClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { data: null, error: new Error("Not authenticated. Please log in again.") }
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function checkAnalysisLimit(userId) {
  const user = await getCurrentUser()

  if (!user) {
    return { remaining: 0, canAnalyze: false }
  }

  if (user.is_premium) {
    return { remaining: Number.POSITIVE_INFINITY, canAnalyze: true }
  }

  // For free users, check credits
  const remaining = user.credits || 0
  return { remaining, canAnalyze: remaining > 0 }
}

// New functions to query analyses table for accurate counts
export async function getTotalAnalysesCount(userId) {
  const supabase = getSupabaseClient()

  console.log("[v0] getTotalAnalysesCount called for user:", userId)

  const { count, error } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (error) {
    console.error("[v0] Error getting total analyses count:", error)
    return 0
  }

  console.log("[v0] getTotalAnalysesCount result:", count)
  return count || 0
}

export async function getTodayAnalysesCount(userId) {
  const supabase = getSupabaseClient()

  console.log("[v0] getTodayAnalysesCount called for user:", userId)

  // Get today's date at midnight in ISO format
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  console.log("[v0] Querying analyses since:", todayISO)

  const { count, error } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayISO)

  if (error) {
    console.error("[v0] Error getting today's analyses count:", error)
    return 0
  }

  console.log("[v0] getTodayAnalysesCount result:", count)
  return count || 0
}

export async function deleteAccount(userId) {
  const supabase = getSupabaseClient()

  console.log("[v0] deleteAccount called for user:", userId)

  try {
    console.log("[v0] Attempting to call delete_user_account RPC function...")
    const { data, error: rpcError } = await supabase.rpc("delete_user_account")

    if (rpcError) {
      console.error("[v0] RPC function error:", rpcError)

      if (
        rpcError.message &&
        (rpcError.message.includes("function") ||
          rpcError.message.includes("does not exist") ||
          rpcError.message.includes("schema cache"))
      ) {
        console.log("[v0] Database function not found, using fallback deletion method...")

        console.log("[v0] Step 1: Deleting user analyses...")
        const { error: analysesError } = await supabase.from("analyses").delete().eq("user_id", userId)

        if (analysesError) {
          console.error("[v0] Error deleting analyses:", analysesError)
          throw new Error("Failed to delete user data. Please try again.")
        }
        console.log("[v0] Analyses deleted successfully")

        console.log("[v0] Step 2: Deleting user record...")
        const { error: userError } = await supabase.from("users").delete().eq("id", userId)

        if (userError) {
          console.error("[v0] Error deleting user:", userError)
          throw new Error("Failed to delete user account. Please try again.")
        }
        console.log("[v0] User record deleted successfully")

        console.log("[v0] Step 3: Signing out user...")
        await signOut()
        console.log("[v0] User signed out successfully")

        console.log("[v0] Account deletion completed successfully (fallback method)")
        return { success: true, message: "Account deleted successfully" }
      }

      throw new Error(rpcError.message || "Failed to delete account")
    }

    if (data && !data.success) {
      console.error("[v0] delete_user_account returned error:", data)
      throw new Error(data.message || "Failed to delete account")
    }

    console.log("[v0] Successfully deleted user account via RPC:", data)

    await signOut()

    console.log("[v0] Account deletion completed successfully")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error during account deletion:", error)
    throw error
  }
}
