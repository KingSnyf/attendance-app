import type { Anomalie, DashboardData, DemandeModification, EmployeDetail, ParametresSysteme, Utilisateur } from "@/lib/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002/api"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("attendance_token") : null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
    })
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  getAnomalies: () => request<Anomalie[]>("/anomalies"),

  resolveAnomaly: (id: string, comment: string, geolocVerified: boolean) =>
    request(`/anomalies/${id}/resolve`, { method: "POST", body: JSON.stringify({ comment, geoloc_verifiee: geolocVerified }) }),

  getEmployees: () => request<Utilisateur[]>("/auth/users"),

  createEmployee: (data: { nom: string; prenom: string; email: string; departement: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ ...data, password: "pass123", role: "employe" }) }),

  getEmployeeDetail: (id: string) => request<EmployeDetail | null>(`/users/${id}`),

  deactivateDevice: (userId: string) => request(`/users/${userId}/device/deactivate`, { method: "PATCH" }),

  resetPin: (userId: string) => request(`/users/${userId}/reset-pin`, { method: "POST" }),

  toggleAccount: (userId: string) => request(`/users/${userId}/toggle-active`, { method: "PATCH" }),

  getModificationRequests: () => request<DemandeModification[]>("/modifications"),

  approveRequest: (id: string) => request(`/modifications/${id}/process`, { method: "POST", body: JSON.stringify({ action: "approve" }) }),

  rejectRequest: (id: string) => request(`/modifications/${id}/process`, { method: "POST", body: JSON.stringify({ action: "reject" }) }),

  getSettings: () => request<ParametresSysteme>("/settings"),

  updateSettings: (settings: ParametresSysteme) => request("/settings", { method: "PUT", body: JSON.stringify(settings) }),

  getLogs: () => request("/logs"),

  updateProfile: (data: { firstName?: string; lastName?: string; photoUrl?: string; email?: string }) =>
    request<any>("/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>("/auth/password", { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) }),

  forgotPassword: (email: string) =>
    request<{ success: boolean }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  getTodaySessions: () => request("/sessions/today"),

  getDashboardData: () => request<DashboardData>("/sessions/stats"),

  getSessions: (userId: string) => request(`/sessions/${userId}`),
}
