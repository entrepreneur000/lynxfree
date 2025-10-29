import { getCurrentUser, signOut } from "./supabase.js"

function hasStoredSession() {
  try {
    const keys = Object.keys(localStorage)
    return keys.some((key) => key.startsWith("sb-") && key.includes("-auth-token"))
  } catch {
    return false
  }
}

const navRight = document.getElementById("navRight")
if (navRight) {
  if (hasStoredSession()) {
    // Hide the default logged-out state immediately
    navRight.classList.add("auth-loading")
  } else {
    // Show logged-out state immediately
    navRight.classList.add("auth-ready")
  }
}

export async function updateNavigation() {
  console.log("[v0] updateNavigation called")

  const currentUser = await getCurrentUser()
  console.log("[v0] Current user from getCurrentUser:", currentUser)

  const navRight = document.getElementById("navRight")
  const mobileAuthButtons = document.querySelector(".mobile-auth-buttons")

  if (currentUser) {
    console.log("[v0] User is logged in, updating navigation")
    const initial = currentUser.username ? currentUser.username[0].toUpperCase() : currentUser.email[0].toUpperCase()
    const creditsDisplay = currentUser.is_premium ? "∞" : currentUser.credits

    navRight.innerHTML = `
      <div class="user-credits" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #06b6d4 0%, #6366f1 100%); border-radius: 9999px; color: white; font-weight: 600; font-size: 0.875rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <span>${creditsDisplay} ${currentUser.is_premium ? "Premium" : "Credits"}</span>
      </div>
      <div class="user-dropdown" style="position: relative;">
        <button class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4 0%, #6366f1 100%); color: white; font-weight: 600; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          ${initial}
        </button>
        <div class="dropdown-menu" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 0.5rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 200px; z-index: 1000;">
          <div style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">
            <p style="font-weight: 600; color: #111827;">${currentUser.username || "User"}</p>
            <p style="font-size: 0.875rem; color: #6b7280;">${currentUser.email}</p>
          </div>
          <a href="account.html" style="display: block; padding: 0.75rem 1rem; color: #374151; text-decoration: none; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
            <svg style="display: inline-block; width: 16px; height: 16px; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Account Settings
          </a>
          <a href="pricing.html" style="display: block; padding: 0.75rem 1rem; color: #374151; text-decoration: none; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
            <svg style="display: inline-block; width: 16px; height: 16px; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${currentUser.is_premium ? "Manage Premium" : "Upgrade to Premium"}
          </a>
          <button id="logoutBtn" style="display: block; width: 100%; text-align: left; padding: 0.75rem 1rem; color: #dc2626; border: none; background: transparent; cursor: pointer; transition: background 0.2s; border-top: 1px solid #e5e7eb;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">
            <svg style="display: inline-block; width: 16px; height: 16px; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    `

    const userAvatar = navRight.querySelector(".user-avatar")
    const dropdownMenu = navRight.querySelector(".dropdown-menu")

    userAvatar.addEventListener("click", (e) => {
      e.stopPropagation()
      dropdownMenu.style.display = dropdownMenu.style.display === "none" ? "block" : "none"
    })

    document.addEventListener("click", () => {
      dropdownMenu.style.display = "none"
    })

    const logoutBtn = document.getElementById("logoutBtn")
    logoutBtn.addEventListener("click", async () => {
      await signOut()
      window.location.href = "index.html"
    })

    // Update mobile menu
    if (mobileAuthButtons) {
      mobileAuthButtons.innerHTML = `
        <a href="account.html" class="btn-primary" style="width: 100%;">My Account</a>
      `
    }
  }

  if (navRight) {
    navRight.classList.remove("auth-loading")
    navRight.classList.add("auth-ready")
  }

  return currentUser
}
