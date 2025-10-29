export function initAuth() {
  const token = localStorage.getItem("admin_token")

  if (token !== "ok") {
    window.location.href = "/admin-login.html"
  }
}
