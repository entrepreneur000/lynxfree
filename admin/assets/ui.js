// Toast notifications
export function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer")

  const toast = document.createElement("div")
  toast.className = `toast ${type}`

  const icon =
    type === "error"
      ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
      : type === "warning"
        ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
        : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'

  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${icon}
    </svg>
    <span>${message}</span>
  `

  container.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// Skeleton loaders
export function showSkeleton() {
  const view = document.getElementById("view")
  view.innerHTML = `
    <div class="skeleton skeleton-line" style="width: 40%; height: 2rem; margin-bottom: 1rem;"></div>
    <div class="skeleton skeleton-line" style="width: 60%; height: 1rem; margin-bottom: 2rem;"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
  `
}

export function hideSkeleton() {
  // Skeleton is replaced by actual content
}

// Modal dialogs
export function showModal(title, message, onConfirm) {
  const container = document.getElementById("modalContainer")

  const modal = document.createElement("div")
  modal.className = "modal-overlay"
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
      </div>
      <div class="modal-body">
        <p>${message}</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modalCancel">Cancel</button>
        <button class="btn btn-danger" id="modalConfirm">Confirm</button>
      </div>
    </div>
  `

  container.appendChild(modal)

  document.getElementById("modalCancel").addEventListener("click", () => {
    modal.remove()
  })

  document.getElementById("modalConfirm").addEventListener("click", () => {
    onConfirm()
    modal.remove()
  })

  // Close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  })
}
