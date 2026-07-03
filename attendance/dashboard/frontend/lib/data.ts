import type { Utilisateur } from "@/lib/types"

export const utilisateurs: Utilisateur[] = [
  { id: "1", email: "jean.dupont@example.com", nom: "Dupont", prenom: "Jean", role: "employe", departement: "Production", statut_actuel: "present", appareil: { modele: "iPhone 14", identifiant_appareil: "A1001", actif: true, derniere_geoloc: { lat: 48.8566, lng: 2.3522, date: "2026-07-03T08:30:00Z" } } },
  { id: "2", email: "marie.martin@example.com", nom: "Martin", prenom: "Marie", role: "employe", departement: "Production", statut_actuel: "present" },
  { id: "3", email: "pierre.leroy@example.com", nom: "Leroy", prenom: "Pierre", role: "employe", departement: "Logistique", statut_actuel: "pause" },
  { id: "4", email: "sophie.bernard@example.com", nom: "Bernard", prenom: "Sophie", role: "employe", departement: "Production", statut_actuel: "absent" },
  { id: "5", email: "lucas.petit@example.com", nom: "Petit", prenom: "Lucas", role: "employe", departement: "Logistique", statut_actuel: "present" },
  { id: "6", email: "emma.robert@example.com", nom: "Robert", prenom: "Emma", role: "gestionnaire", departement: "Production", statut_actuel: "present" },
  { id: "7", email: "nathan.richard@example.com", nom: "Richard", prenom: "Nathan", role: "admin", departement: "Administration", statut_actuel: "present" },
  { id: "8", email: "chloe.durand@example.com", nom: "Durand", prenom: "Chloe", role: "employe", departement: "Logistique", statut_actuel: "absent" },
  { id: "9", email: "admin@test.com", nom: "Admin", prenom: "Test", role: "admin", departement: "Administration", statut_actuel: "present" },
  { id: "10", email: "gestionnaire@test.com", nom: "Gestionnaire", prenom: "Test", role: "gestionnaire", departement: "Production", statut_actuel: "present" },
  { id: "11", email: "employe@test.com", nom: "Employe", prenom: "Test", role: "employe", departement: "Production", statut_actuel: "present" },
]

export const departementsDisponibles = ["Production", "Logistique", "Administration"]

export function getNomComplet(user: { nom: string; prenom: string }): string {
  return `${user.prenom} ${user.nom}`
}

export function getEmployeeSummaryRows() {
  return utilisateurs.map((u) => ({
    id: u.id,
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    departement: u.departement,
    statut_actuel: u.statut_actuel,
    premiere_arrivee: u.statut_actuel === "present" ? "08:15" : null,
    temps_cumule: u.statut_actuel === "present" ? "4h 32min" : null,
  }))
}

export const parametresSystemeData = {
  reseau_bssid: "00:1A:2B:3C:4D:5E",
  plage_ip_locale: "192.168.1.0/24",
  geofencing_actif: true,
  rayon_geofencing_metres: 100,
  coordonnees_bureau: { lat: 48.8566, lng: 2.3522 },
  tolerance_retard_minutes: 15,
  duree_pause_max_minutes: 60,
  jours_feries: ["2026-01-01", "2026-04-13", "2026-05-01", "2026-05-08", "2026-05-21", "2026-07-14", "2026-08-15", "2026-11-01", "2026-11-11", "2026-12-25"],
  jours_ouvres: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
}
