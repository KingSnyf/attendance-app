// lib/labels.ts
// Libellés français centralisés pour les codes utilisés côté API,
// afin d'éviter d'afficher des valeurs brutes (ex: "device_different")
// et de garder un seul endroit à mettre à jour si un code change.

export const roleLabel: Record<string, string> = {
  employe: "Employé",
  gestionnaire: "Gestionnaire",
  admin: "Administrateur",
};

export const anomalieTypeLabel: Record<string, string> = {
  device_different: "Appareil différent",
  double_badge: "Double badge",
  hors_reseau: "Hors réseau",
  geofencing_incoherent: "Géofencing incohérent",
};

export const modificationStatutLabel: Record<string, string> = {
  en_attente: "En attente",
  validee: "Validée",
  rejetee: "Rejetée",
};