let _token: string | null = null
let _user: { id: string; email: string; role: string; prenom: string; nom: string } | null = null

const TOKEN_KEY = "attendx_token"
const USER_KEY = "attendx_user"

if (typeof window !== "undefined") {
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (storedToken) _token = storedToken
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedUser) _user = JSON.parse(storedUser)
  } catch {
    /* ignore corrupted storage */
  }
}

function getToken(): string | null {
  return _token
}

function setToken(token: string | null) {
  _token = token
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }
}

function getUser() {
  return _user
}

function setUser(user: { id: string; email: string; role: string; prenom: string; nom: string } | null) {
  _user = user
  if (typeof window !== "undefined") {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  }
}

function logout() {
  _token = null
  _user = null
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

export const authService = { getToken, setToken, getUser, setUser, logout }
