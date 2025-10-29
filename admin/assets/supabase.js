// Supabase configuration and client
const SUPABASE_URL = "https://gyefxlyzxoasrsridxjk.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZWZ4bHl6eG9hc3JzcmlkeGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTY3NTcsImV4cCI6MjA3NjM5Mjc1N30.cZ89pfTn7LNoAnw4iX_dRUaBEogdE4PeS9U9j_k-1d8"

// Create Supabase client
class SupabaseClient {
  constructor(url, key) {
    this.url = url
    this.key = key
    this.headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }
  }

  async query(table, options = {}) {
    let url = `${this.url}/rest/v1/${table}`
    const params = new URLSearchParams()

    if (options.select) params.append("select", options.select)
    if (options.order) params.append("order", options.order)
    if (options.limit) params.append("limit", options.limit)
    if (options.offset) params.append("offset", options.offset)

    if (params.toString()) url += `?${params.toString()}`

    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
    })

    if (!response.ok) {
      throw new Error(`Supabase query failed: ${response.statusText}`)
    }

    return await response.json()
  }

  async insert(table, data) {
    const url = `${this.url}/rest/v1/${table}`

    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Supabase insert failed: ${response.statusText}`)
    }

    return await response.json()
  }

  async update(table, id, data) {
    const url = `${this.url}/rest/v1/${table}?id=eq.${id}`

    const response = await fetch(url, {
      method: "PATCH",
      headers: this.headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Supabase update failed: ${response.statusText}`)
    }

    return await response.json()
  }

  async delete(table, id) {
    console.log("[v0] Attempting to delete from table:", table, "with id:", id)
    const url = `${this.url}/rest/v1/${table}?id=eq.${id}`

    const response = await fetch(url, {
      method: "DELETE",
      headers: this.headers,
    })

    console.log("[v0] Delete response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Delete failed:", errorText)
      throw new Error(`Supabase delete failed: ${response.statusText} - ${errorText}`)
    }

    console.log("[v0] Delete successful")
    return true
  }

  async count(table) {
    const url = `${this.url}/rest/v1/${table}?select=*`

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        ...this.headers,
        Prefer: "count=exact",
      },
    })

    const contentRange = response.headers.get("content-range")
    if (contentRange) {
      const count = contentRange.split("/")[1]
      return Number.parseInt(count)
    }

    return 0
  }

  async countActiveToday() {
    // Get today's date at midnight in ISO format
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const url = `${this.url}/rest/v1/analyses?select=*&created_at=gte.${todayISO}`

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        ...this.headers,
        Prefer: "count=exact",
      },
    })

    const contentRange = response.headers.get("content-range")
    if (contentRange) {
      const count = contentRange.split("/")[1]
      return Number.parseInt(count)
    }

    return 0
  }

  async rpc(functionName, params = {}) {
    console.log("[v0] Calling RPC function:", functionName, "with params:", params)
    const url = `${this.url}/rest/v1/rpc/${functionName}`

    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(params),
    })

    console.log("[v0] RPC response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] RPC failed:", errorText)
      throw new Error(`Supabase RPC failed: ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] RPC result:", result)
    return result
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
