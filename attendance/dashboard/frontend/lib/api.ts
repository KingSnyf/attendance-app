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
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("attendance_token")
      localStorage.removeItem("attendance_user")
      window.location.replace("/auth")
      throw new Error("Session expirée")
    }
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

  getUser: () => request<any>("/auth/me"),

  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  getEmployees: () => request<Utilisateur[]>("/auth/users"),

  createEmployee: (data: { nom: string; prenom: string; email: string; departement: string; telephone?: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ ...data, role: "employe" }) }),

  createUser: (data: { nom: string; prenom: string; email: string; role: string; departement: string; telephone?: string }) =>
    request("/users", { method: "POST", body: JSON.stringify(data) }),

  getEmployeeDetail: (id: string) => request<EmployeDetail | null>(`/users/${id}`),

  deactivateDevice: (userId: string) => request(`/users/${userId}/device/deactivate`, { method: "PATCH" }),

  resetPin: (userId: string) => request<{ success: boolean; newPin: string }>(`/users/${userId}/reset-pin`, { method: "POST" }),

  toggleAccount: (userId: string) => request(`/users/${userId}/toggle-active`, { method: "PATCH" }),

  getModificationRequests: () => request<DemandeModification[]>("/modifications"),

  createModificationRequest: (data: {
    gestionnaireId: string
    sessionPresenceId: string
    modificationProposee: string
    raison: string
  }) => request<DemandeModification>("/modifications", { method: "POST", body: JSON.stringify(data) }),

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

  getMonthlyStats: (year?: number) => request(`/sessions/stats/monthly${year ? `?year=${year}` : ""}`),

  getMonthlyEmployeeStats: (year?: number, month?: number) =>
    request(`/sessions/stats/monthly/employees?year=${year || new Date().getFullYear()}&month=${month || new Date().getMonth() + 1}`),

  getSessions: (userId: string) => request(`/sessions/${userId}`),

  createRequest: (data: { type: string; dateDebut?: string; dateFin?: string; motif: string }) =>
    request("/requests", { method: "POST", body: JSON.stringify(data) }),

  getMyRequests: () => request("/requests/mine"),

  getRequests: () => request("/requests"),

  getPendingRequests: () => request<{ count: number }>("/requests/pending"),

  processRequest: (id: string, action: string, commentaire?: string) =>
    request(`/requests/${id}/process`, { method: "POST", body: JSON.stringify({ action, commentaire }) }),

  getMyAnomalies: () => request("/anomalies/mine"),

  search: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),

  selfAssociateDevice: (data: { identifiantAppareil: string; modele?: string; marque?: string }) =>
    request("/devices/self", { method: "POST", body: JSON.stringify(data) }),

  uploadFile: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("attendance_token") : null;
    const res = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error(`Upload error: ${res.status}`);
    return res.json();
  },
}