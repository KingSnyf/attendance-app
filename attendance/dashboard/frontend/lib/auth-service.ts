const TOKEN_KEY = "attendance_token"
const USER_KEY = "attendance_user"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

function getUser(): { id: string; email: string; role: string; prenom: string; nom: string } | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function setUser(user: { id: string; email: string; role: string; prenom: string; nom: string }) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const authService = { getToken, setToken, getUser, setUser, logout }
