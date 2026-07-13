import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email invalide").min(1, "Email requis"),
  password: z.string().min(1, "Mot de passe requis"),
})

export const createEmployeeSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  prenom: z.string().min(1, "Prénom requis"),
  email: z.string().email("Email invalide"),
  departement: z.string().min(1, "Département requis"),
  telephone: z.string().regex(/^(?:(?:\+|00)33|0)[1-9]\d{8}$/, "Téléphone invalide").optional().or(z.literal("")),
  role: z.enum(["employe", "gestionnaire", "admin"]),
})

export const createRequestSchema = z.object({
  type: z.string().min(1, "Type requis"),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  motif: z.string().min(1, "Motif requis"),
})

export const updateSettingsSchema = z.object({
  reseau_bssid: z.string().optional(),
  plage_ip_locale: z.string().optional(),
  geofencing_actif: z.boolean(),
  rayon_geofencing_metres: z.number().min(0),
  tolerance_retard_minutes: z.number().min(0),
  duree_pause_max_minutes: z.number().min(0),
  heure_debut_journee: z.string(),
  heure_fin_journee: z.string(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(6, "Minimum 6 caractères"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })

export const createModificationRequestSchema = z.object({
  sessionPresenceId: z.string().min(1, "Session requise"),
  modificationProposee: z.string().min(1, "Modification requise"),
  raison: z.string().min(1, "Raison requise"),
})

export const registerSchema = z.object({
  email: z.string().email("Email invalide").min(1, "Email requis"),
  password: z.string().min(6, "Minimum 6 caractères"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>
export type CreateRequestFormData = z.infer<typeof createRequestSchema>
