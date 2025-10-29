import { getSupabaseClient } from "./supabase.js"
import { getAuthState, onAuthChange, forceGuest } from "./auth-store.js"

// Parse URL hash and query params for OAuth tokens/codes
function parseUrlTokens() {
  const url = new URL(window.location.href)
  const hash = url.hash?.startsWith("#") ? url.hash.slice(1) : ""
  const hashParams = new URLSearchParams(hash)

  return {
    access_token: hashParams.get("access_token"),
    refresh_token: hashParams.get("refresh_token"),
    code: url.searchParams.get("code"),
  }
}

// Apply session from URL tokens if present
async function applyUrlSessionIfAny() {
  const supabase = getSupabaseClient()
  const url = new URL(window.location.href)
  const { access_token, refresh_token, code } = parseUrlTokens()

  // Handle hash tokens (email confirmation, password reset)
  if (access_token && refresh_token) {
    console.log("[v0] Found access_token in URL, setting session...")
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })
    if (error) {
      console.warn("[v0] setSession error:", error.message)
    } else {
      console.log("[v0] Session set successfully from URL tokens")
    }
    // Clean up URL
    window.history.replaceState({}, "", url.origin + url.pathname + url.search)
  }

  // Handle PKCE code (OAuth providers like Google)
  if (code) {
    console.log("[v0] Found OAuth code, exchanging for session...")
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.warn("[v0] exchangeCodeForSession error:", error.message)
    } else {
      console.log("[v0] Session exchanged successfully from OAuth code")
    }
    // Clean up URL
    url.searchParams.delete("code")
    window.history.replaceState({}, "", url.origin + url.pathname + (url.search ? url.search : ""))
  }
}

// Get user initials from email or username
function getInitials(emailOrName) {
  if (!emailOrName) return "U"
  const str = String(emailOrName).trim()
  return (str[0] || "U").toUpperCase()
}

// Show/hide elements
function show(el, visible = true) {
  if (!el) return
  el.classList.toggle("hidden", !visible)
  el.style.display = visible ? "flex" : "none"
}

function renderSkeleton(navRight) {
  navRight.innerHTML = `
    <div class="account-skeleton" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; justify-content: flex-end;">
      <div class="skeleton" style="width: 120px; height: 36px; border-radius: 9999px;"></div>
      <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
      <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
    </div>
  `
}

// Render guest navigation (Sign up / Log in)
function renderGuestNav(navRight, mobileAuthButtons) {
  navRight.innerHTML = `
    <div class="guest-actions" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; justify-content: flex-end;">
      <a href="login.html" class="btn-secondary" style="min-width: 80px; text-align: center; padding: 0.5rem 1rem;">Login</a>
      <a href="signup.html" class="btn-primary" style="min-width: 80px; text-align: center; padding: 0.5rem 1rem;">Sign Up</a>
      <button id="darkModeToggle" class="dark-mode-toggle" aria-label="Toggle dark mode">
        <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
    </div>
  `

  if (mobileAuthButtons) {
    mobileAuthButtons.innerHTML = `
      <a href="login.html" class="btn-secondary" style="width: 100%; text-align: center; padding: 0.875rem 1rem;">Login</a>
      <a href="signup.html" class="btn-primary" style="width: 100%; text-align: center; padding: 0.875rem 1rem;">Sign Up</a>
    `
  }

  initDarkModeToggle()
}

// Render authenticated navigation (credits + avatar)
function renderAuthNav(navRight, mobileAuthButtons, user, profile) {
  const initial = getInitials(profile?.username || profile?.email || user.email)
  const creditsDisplay = profile?.is_premium ? "∞" : profile?.credits || 0

  navRight.innerHTML = `
    <div class="user-actions" style="display: flex; align-items: center; gap: 0.75rem; width: 100%; justify-content: flex-end;">
      <div class="user-credits" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #06b6d4 0%, #6366f1 100%); border-radius: 9999px; color: white; font-weight: 600; font-size: 0.875rem; min-width: 120px; justify-content: center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <span>${creditsDisplay} ${profile?.is_premium ? "Premium" : "Credits"}</span>
      </div>
      <div class="user-dropdown" style="position: relative;">
        <button class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4 0%, #6366f1 100%); color: white; font-weight: 400; font-size: 1.125rem; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          ${initial}
        </button>
        <div class="dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 0.5rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 220px; z-index: 1000;">
          <div style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">
            <p style="font-weight: 600; color: #111827;">${profile?.username || "User"} ${profile?.is_premium ? "👑" : ""}</p>
            <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">${user.email}</p>
          </div>
          <a href="account.html" style="display: flex; align-items: center; padding: 0.75rem 1rem; color: #374151; text-decoration: none;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
            <svg style="width: 16px; height: 16px; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Account Settings
          </a>
          <a href="pricing.html" style="display: flex; align-items: center; padding: 0.75rem 1rem; color: #374151; text-decoration: none;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
            <svg style="width: 16px; height: 16px; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${profile?.is_premium ? "Manage Premium 👑" : "Upgrade to Premium"}
          </a>
          <button id="dropdownLogoutBtn" style="display: flex; align-items: center; width: 100%; text-align: left; padding: 0.75rem 1rem; color: #dc2626; border: none; background: transparent; cursor: pointer; border-top: 1px solid #e5e7eb;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">
            <svg style="width: 16px; height: 16px; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Logout
          </button>
        </div>
      </div>
      <button id="darkModeToggle" class="dark-mode-toggle" aria-label="Toggle dark mode">
        <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
    </div>
  `

  // Avatar dropdown toggle
  const userAvatar = navRight.querySelector(".user-avatar")
  const dropdownMenu = navRight.querySelector(".dropdown-menu")

  if (userAvatar && dropdownMenu) {
    userAvatar.addEventListener("click", (e) => {
      e.stopPropagation()
      dropdownMenu.style.display = dropdownMenu.style.display === "none" ? "block" : "none"
    })

    document.addEventListener("click", () => {
      dropdownMenu.style.display = "none"
    })
  }

  const logoutBtn = document.getElementById("dropdownLogoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await doLogout()
    })
  }

  // Mobile auth buttons
  if (mobileAuthButtons) {
    const mobileFreeBadge = !profile?.is_premium
      ? `
      <div class="mobile-free-badge" style="display: flex; align-items: center; justify-content: center; padding: 0.75rem 1rem; background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(99, 102, 241, 0.1)); border: 2px solid rgba(6, 182, 212, 0.3); border-radius: 1rem; color: #06b6d4; font-weight: 700; font-size: 1rem; letter-spacing: 0.05em; margin-bottom: 1rem;">
        FREE PLAN
      </div>
    `
      : ""

    mobileAuthButtons.innerHTML = `
      ${mobileFreeBadge}
      <div class="mobile-credits-display">
        <div class="mobile-credits-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <div class="mobile-credits-info">
            <span class="mobile-credits-label">Available Credits</span>
            <span class="mobile-credits-value">${creditsDisplay} ${profile?.is_premium ? "Premium" : "Credits"}</span>
          </div>
        </div>
      </div>
      <a href="account.html" class="btn-secondary mobile-menu-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        My Account
      </a>
      ${
        !profile?.is_premium
          ? `
        <a href="pricing.html" class="btn-primary mobile-menu-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
          Upgrade Premium
        </a>
      `
          : `
        <a href="pricing.html" class="btn-premium mobile-menu-btn">
          👑 Manage Premium
        </a>
      `
      }
      <button id="mobileLogoutBtn" class="btn-danger mobile-menu-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
        </svg>
        Logout
      </button>
    `

    const mobileLogoutBtn = document.getElementById("mobileLogoutBtn")
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener("click", async () => {
        await doLogout()
      })
    }
  }

  const navLeft = document.querySelector(".nav-left")
  if (navLeft && !profile?.is_premium) {
    // Remove existing free badge if any
    const existingBadge = navLeft.querySelector(".free-badge-left")
    if (existingBadge) {
      existingBadge.remove()
    }

    // Add new free badge
    const freeBadge = document.createElement("div")
    freeBadge.className = "free-badge-left"
    freeBadge.style.cssText =
      "display: flex; align-items: center; margin-left: 1rem; padding: 0.375rem 0.875rem; background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(99, 102, 241, 0.1)); border: 2px solid rgba(6, 182, 212, 0.3); border-radius: 9999px; color: #06b6d4; font-weight: 700; font-size: 0.875rem; letter-spacing: 0.05em; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);"
    freeBadge.textContent = "FREE"
    navLeft.appendChild(freeBadge)
  } else if (navLeft && profile?.is_premium) {
    // Remove free badge if user is premium
    const existingBadge = navLeft.querySelector(".free-badge-left")
    if (existingBadge) {
      existingBadge.remove()
    }
  }

  initDarkModeToggle()
}

async function doLogout() {
  console.log("[v0] Starting optimistic logout...")

  // Clear Supabase local tokens synchronously
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
      .forEach((k) => localStorage.removeItem(k))
  } catch (e) {
    console.warn("[v0] Error clearing localStorage:", e)
  }

  // Force guest state immediately (UI updates instantly)
  forceGuest()

  // Fire-and-forget server signOut (no UI blocking)
  const supabase = getSupabaseClient()
  supabase.auth.signOut().catch((err) => {
    console.warn("[v0] signOut error (non-blocking):", err)
  })

  // Navigate to homepage
  window.location.href = "index.html"
}

// Initialize dark mode toggle
function initDarkModeToggle() {
  const darkModeToggle = document.getElementById("darkModeToggle")
  const mobileDarkModeToggle = document.getElementById("mobileDarkModeToggle")

  const currentTheme = localStorage.getItem("theme") || "light"
  if (currentTheme === "dark") {
    document.body.classList.add("dark-mode")
  }

  function toggleTheme() {
    document.body.classList.toggle("dark-mode")
    const isDark = document.body.classList.contains("dark-mode")
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", toggleTheme)
  }

  if (mobileDarkModeToggle) {
    mobileDarkModeToggle.addEventListener("click", toggleTheme)
  }
}

export function updateCreditsDisplay(credits, isPremium) {
  const navRight = document.getElementById("navRight")
  const mobileAuthButtons = document.querySelector(".mobile-auth-buttons")

  if (!navRight) return

  const creditsDisplay = isPremium ? "∞" : credits

  // Update desktop credit display
  const desktopCredits = navRight.querySelector(".user-credits span")
  if (desktopCredits) {
    desktopCredits.textContent = `${creditsDisplay} ${isPremium ? "Premium" : "Credits"}`
  }

  // Update mobile credit display
  if (mobileAuthButtons) {
    const mobileCreditsValue = mobileAuthButtons.querySelector(".mobile-credits-value")
    if (mobileCreditsValue) {
      mobileCreditsValue.textContent = `${creditsDisplay} ${isPremium ? "Premium" : "Credits"}`
    }
  }

  console.log("[v0] Credits display updated to:", creditsDisplay)
}

let headerBound = false
let unsubscribeAuthChange = null

// Main initialization function
export async function initHeader() {
  if (headerBound) {
    console.log("[v0] Header already initialized, skipping")
    return
  }
  headerBound = true

  const navRight = document.getElementById("navRight")
  const mobileAuthButtons = document.querySelector(".mobile-auth-buttons")

  if (!navRight) {
    console.error("[v0] navRight element not found")
    return
  }

  await applyUrlSessionIfAny()

  const { authReady, user, userProfile } = getAuthState()

  if (!authReady) {
    renderSkeleton(navRight)
  } else {
    if (!user) {
      renderGuestNav(navRight, mobileAuthButtons)
      const navLeft = document.querySelector(".nav-left")
      if (navLeft) {
        const existingBadge = navLeft.querySelector(".free-badge-left")
        if (existingBadge) {
          existingBadge.remove()
        }
      }
    } else {
      renderAuthNav(navRight, mobileAuthButtons, user, userProfile)
    }
  }

  unsubscribeAuthChange = onAuthChange(({ authReady, user, userProfile }) => {
    console.log("[v0] Header received auth change:", { authReady, user: user?.email })

    if (!authReady) {
      renderSkeleton(navRight)
    } else if (!user) {
      renderGuestNav(navRight, mobileAuthButtons)
      const navLeft = document.querySelector(".nav-left")
      if (navLeft) {
        const existingBadge = navLeft.querySelector(".free-badge-left")
        if (existingBadge) {
          existingBadge.remove()
        }
      }
    } else {
      renderAuthNav(navRight, mobileAuthButtons, user, userProfile)
    }
  })
}
