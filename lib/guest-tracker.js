// Guest analysis tracking using localStorage
const GUEST_ANALYSIS_KEY = "lynxface_guest_analyses"
const MAX_GUEST_ANALYSES = 1

export function getGuestAnalysisCount() {
  if (typeof window === "undefined") return 0

  const count = localStorage.getItem(GUEST_ANALYSIS_KEY)
  return count ? Number.parseInt(count, 10) : 0
}

export function incrementGuestAnalysis() {
  if (typeof window === "undefined") return

  const currentCount = getGuestAnalysisCount()
  localStorage.setItem(GUEST_ANALYSIS_KEY, (currentCount + 1).toString())
}

export function canGuestAnalyze() {
  return getGuestAnalysisCount() < MAX_GUEST_ANALYSES
}

export function resetGuestAnalyses() {
  if (typeof window === "undefined") return
  localStorage.removeItem(GUEST_ANALYSIS_KEY)
}

export function hasGuestAnalyzed() {
  return getGuestAnalysisCount() >= MAX_GUEST_ANALYSES
}
