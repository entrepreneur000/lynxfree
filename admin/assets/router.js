import { showSkeleton, hideSkeleton, showToast, showModal } from "./ui.js"
import { supabase } from "./supabase.js"

const routes = {
  dashboard: renderDashboard,
  users: renderUsers,
}

export function initRouter() {
  // Handle initial route
  handleRoute()

  // Listen for hash changes
  window.addEventListener("hashchange", handleRoute)

  // Update active nav item on click
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"))
      e.currentTarget.classList.add("active")
    })
  })
}

function handleRoute() {
  const hash = window.location.hash.slice(2) || "dashboard"
  const route = routes[hash] || routes.dashboard

  // Update breadcrumb
  const breadcrumb = document.getElementById("breadcrumb")
  breadcrumb.textContent = hash.charAt(0).toUpperCase() + hash.slice(1)

  // Update active nav item
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active")
    if (item.dataset.route === hash) {
      item.classList.add("active")
    }
  })

  // Show skeleton while loading
  showSkeleton()

  // Simulate loading delay
  setTimeout(() => {
    route()
    hideSkeleton()
  }, 500)
}

async function renderDashboard() {
  const view = document.getElementById("view")

  try {
    const [usersCount, analysesCount, activeToday] = await Promise.all([
      supabase.count("users"),
      supabase.count("analyses"),
      supabase.countActiveToday(),
    ])

    view.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-description">Overview of your admin panel</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${usersCount.toLocaleString()}</div>
          <div class="stat-change">Registered users</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Total Analyses</div>
          <div class="stat-value">${analysesCount.toLocaleString()}</div>
          <div class="stat-change">Completed analyses</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Today Analyses</div>
          <div class="stat-value">${activeToday.toLocaleString()}</div>
          <div class="stat-change">Analyses today</div>
        </div>


      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Recent Activity</h2>
        </div>
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <h3 class="empty-title">No recent activity</h3>
          <p class="empty-description">Activity will appear here once users start interacting with the platform</p>
        </div>
      </div>
    `
  } catch (error) {
    console.error("[v0] Dashboard error:", error)
    showToast("Failed to load dashboard statistics", "error")
    view.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-description">Overview of your admin panel</p>
      </div>
      <div class="card">
        <div class="empty-state">
          <h3 class="empty-title">Failed to load data</h3>
          <p class="empty-description">Please check your database connection</p>
        </div>
      </div>
    `
  }
}

async function renderUsers() {
  const view = document.getElementById("view")

  try {
    const users = await supabase.query("users", {
      select: "*",
      order: "created_at.desc",
      limit: 100,
    })

    if (users.length === 0) {
      view.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">Users</h1>
          <p class="page-description">Manage all registered users</p>
        </div>

        <div class="card">
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h3 class="empty-title">No users yet</h3>
            <p class="empty-description">Users will appear here once they register on the platform</p>
          </div>
        </div>
      `
      return
    }

    const usersTableHTML = users
      .map((user) => {
        const createdDate = new Date(user.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        const isBanned = user.is_banned || false
        const statusBadge = isBanned
          ? '<span class="badge badge-danger">Banned</span>'
          : '<span class="badge badge-success">Active</span>'

        const displayName = user.name || user.username || user.email?.split("@")[0] || "Unknown"
        const provider = user.provider || "email"
        const providerBadge =
          provider === "google"
            ? '<span class="badge badge-info">Google</span>'
            : '<span class="badge badge-secondary">Email</span>'

        return `
        <tr>
          <td class="table-cell">
            <div class="user-info">
              <div class="user-avatar ${isBanned ? "banned" : ""}">${displayName[0].toUpperCase()}</div>
              <div>
                <div class="user-name">${displayName}</div>
                <div class="user-id">${user.email || "No email"}</div>
              </div>
            </div>
          </td>
          <td class="table-cell">${providerBadge}</td>
          <td class="table-cell">${createdDate}</td>
          <td class="table-cell">${statusBadge}</td>
          <td class="table-cell">
            <div class="table-actions">
              <button class="btn-action btn-action-ban" onclick="toggleBanUser('${user.id}', ${isBanned})" title="${isBanned ? "Unban" : "Ban"} User">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${
                    isBanned
                      ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'
                      : '<circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>'
                  }
                </svg>
                ${isBanned ? "Unban" : "Ban"}
              </button>
              <button class="btn-action btn-action-delete" onclick="deleteUser('${user.id}')" title="Delete User">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
            </div>
          </td>
        </tr>
      `
      })
      .join("")

    view.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Users Management</h1>
        <p class="page-description">Manage all registered users (${users.length} total)</p>
      </div>

      <div class="card">
        <div class="card-header-with-search">
          <h2 class="card-title">All Users</h2>
          <div class="search-wrapper">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input type="text" id="userSearch" class="search-input" placeholder="Search by name, email or ID...">
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="table-header">User</th>
                <th class="table-header">Provider</th>
                <th class="table-header">Joined Date</th>
                <th class="table-header">Status</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              ${usersTableHTML}
            </tbody>
          </table>
        </div>
      </div>
    `

    // Add search functionality
    const searchInput = document.getElementById("userSearch")
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase()
      const rows = document.querySelectorAll("#usersTableBody tr")

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase()
        row.style.display = text.includes(searchTerm) ? "" : "none"
      })
    })
  } catch (error) {
    console.error("[v0] Users error:", error)
    showToast("Failed to load users", "error")
    view.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Users</h1>
        <p class="page-description">Manage all registered users</p>
      </div>
      <div class="card">
        <div class="empty-state">
          <h3 class="empty-title">Failed to load users</h3>
          <p class="empty-description">Please check your database connection</p>
        </div>
      </div>
    `
  }
}

window.toggleBanUser = async (userId, isBanned) => {
  const action = isBanned ? "unban" : "ban"
  showModal(
    `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
    `Are you sure you want to ${action} this user? ${!isBanned ? "They will not be able to log in." : "They will be able to log in again."}`,
    async () => {
      try {
        await supabase.update("users", userId, { is_banned: !isBanned })
        showToast(`User ${action}ned successfully`, "success")
        handleRoute()
      } catch (error) {
        console.error(`[v0] ${action} user error:`, error)
        showToast(`Failed to ${action} user`, "error")
      }
    },
  )
}

window.deleteUser = async (userId) => {
  showModal(
    "Delete User",
    "Are you sure you want to delete this user? This action cannot be undone and will delete all their data.",
    async () => {
      try {
        console.log("[v0] Deleting user with ID:", userId)

        const result = await supabase.rpc("delete_user_account", { user_id: userId })
        console.log("[v0] Delete result:", result)

        if (result && result.success === false) {
          throw new Error(result.message || "Failed to delete user")
        }

        showToast("User deleted successfully", "success")
        setTimeout(() => {
          window.location.hash = "#/users"
          handleRoute()
        }, 500)
      } catch (error) {
        console.error("[v0] Delete user error:", error)
        showToast(`Failed to delete user: ${error.message}`, "error")
      }
    },
  )
}
