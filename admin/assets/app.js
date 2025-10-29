import { initAuth } from "./auth.js"
import { initRouter } from "./router.js"
import { showToast } from "./ui.js"

// Initialize auth guard
initAuth()

// Initialize router
initRouter()

// Dark mode toggle
const darkModeToggle = document.getElementById("darkModeToggle")
const body = document.body

// Load theme preference
const savedTheme = localStorage.getItem("admin_theme")
if (savedTheme === "dark") {
  body.classList.add("dark-mode")
}

darkModeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode")
  localStorage.setItem("admin_theme", body.classList.contains("dark-mode") ? "dark" : "light")
})

// Sidebar toggle
const sidebarToggle = document.getElementById("sidebarToggle")
const sidebar = document.getElementById("sidebar")
const mainWrapper = document.querySelector(".main-wrapper")

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed")
  sidebar.classList.toggle("open")
  mainWrapper.classList.toggle("sidebar-collapsed")
})

// Logout button
const logoutBtn = document.getElementById("logoutBtn")
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("admin_token")
  showToast("Logged out successfully", "success")
  setTimeout(() => {
    window.location.href = "/admin-login.html"
  }, 1000)
})
