let _token: string | null = null
let _user: { id: string; email: string; role: string; prenom: string; nom: string } | null = null

function getToken(): string | null {
  return _token
}

function setToken(token: string | null) {
  _token = token
}

function getUser() {
  return _user
}

function setUser(user: { id: string; email: string; role: string; prenom: string; nom: string } | null) {
  _user = user
}

function logout() {
  _token = null
  _user = null
}

export const authService = { getToken, setToken, getUser, setUser, logout }
