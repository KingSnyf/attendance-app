export type Role = "employe" | "gestionnaire" | "admin"

export type Utilisateur = {
  id: string
  email: string
  nom: string
  prenom: string
  role: Role
  departement: string
  statut_actuel: string
  photo_url?: string | null
  appareil?: {
    modele: string
    identifiant_appareil: string
    actif: boolean
    derniere_geoloc?: { lat: number; lng: number; date: string } | null
  } | null
}

export type Anomalie = {
  id: string
  type: string
  description: string
  date_detection: string
  user_id: string
  traitee: boolean
  geoloc_verifiee: boolean
}

export type DemandeModification = {
  id: string
  session_id: string
  modification_proposee: string
  raison: string
  statut: string
  date_demande: string
}

export type SessionPresence = {
  id: string
  date: string
  heure_arrivee: string
  heure_depart?: string | null
  retard_minutes: number
  methode_validation: string
  lieu: string
  user_id: string
}

export type PresenceJour = {
  date: string
  statut: "present" | "absent" | "retard" | "ferie" | "weekend"
  sessions: SessionPresence[]
}

export type EmployeDetail = {
  utilisateur: Utilisateur
  calendrier: PresenceJour[]
  sessions: SessionPresence[]
  anomalies: Anomalie[]
}

export type ParametresSysteme = {
  reseau_bssid: string
  plage_ip_locale: string
  geofencing_actif: boolean
  rayon_geofencing_metres: number
  coordonnees_bureau: { lat: number; lng: number }
  tolerance_retard_minutes: number
  duree_pause_max_minutes: number
  jours_feries: string[]
  jours_ouvres: string[]
}

export type JournalActivite = {
  id: string
  auteur_id: string
  action: string
  type_action: string
  cible: string
  details: string
  date: string
}

export type DashboardData = {
  stats: { presents: number; absents: number; enPause: number; anomaliesNonTraitees: number }
  geofencingAlerts: Anomalie[]
  employees: Utilisateur[]
  weeklyPresence: Array<{ label: string; presents: number; absents: number }>
  monthlyPresence: Array<{ label: string; presents: number; absents: number }>
}
