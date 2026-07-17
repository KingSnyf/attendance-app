"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Camera,
  CalendarDays,
  Clock,
  Lock,
  MapPinned,
  Router,
  Save,
  Shield,
  Timer,
  User,
  Wifi,
} from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/dashboard/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useSettings, useUpdateSettings } from "@/lib/hooks/use-settings";
import { updateSettingsSchema } from "@/lib/schemas";
import type { ParametresSysteme } from "@/lib/types";

const GeofenceMap = dynamic(
  () =>
    import("@/components/dashboard/geofence-map").then((m) => m.GeofenceMap),
  { ssr: false },
);

const joursSemaine = [
  "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche",
];

function SectionHeader({
  icon: Icon,
  title,
  description,
  tone = "brand",
}: {
  icon: any;
  title: string;
  description?: string;
  tone?: "brand" | "signal";
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={
          tone === "brand"
            ? "flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand"
            : "flex size-12 items-center justify-center rounded-xl bg-signal/10 text-signal"
        }
      >
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

function RuleCard({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: any;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:border-brand/40">
      <div className="mb-3 flex items-center gap-3">
        <Icon className="size-5 text-brand transition-transform group-hover:scale-110" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {label}
        </h4>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

export default function ParametresPage() {
  const { user, refreshUser } = useAuth();
  const { data: settingsData, isLoading: settingsLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const [settings, setSettings] = useState<ParametresSysteme | null>(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    nom: "",
    prenom: "",
    email: "",
    photoUrl: "",
  });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [changingPwd, setChangingPwd] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChangePassword = async () => {
    if (pwd.next.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setChangingPwd(true);
    try {
      await api.changePassword(pwd.current, pwd.next);
      toast.success("Mot de passe mis à jour avec succès.");
      setPwd({ current: "", next: "", confirm: "" });
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors du changement de mot de passe.");
    } finally {
      setChangingPwd(false);
    }
  };

  useEffect(() => {
    if (settingsData) setSettings(settingsData);
  }, [settingsData]);

  useEffect(() => {
    if (user)
      setProfile({
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        photoUrl: user.photo_url || "",
      });
  }, [user]);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = (await api.uploadFile(file)) as { url: string };
      setProfile((p) => ({ ...p, photoUrl: result.url }));
      toast.success("Photo uploadée.");
    } catch {
      toast.error("Échec de l'upload.");
    }
  };

  if (user?.role !== "admin" && user?.role !== "gestionnaire") {
    return (
      <Card>
        <p className="p-6 text-center text-muted-foreground">
          Accès réservé aux administrateurs et gestionnaires.
        </p>
      </Card>
    );
  }

  const isReadOnly = user?.role === "gestionnaire";

  if (settingsLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des paramètres système…</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <p className="p-6 text-center text-muted-foreground">
          Impossible de charger les paramètres. Vérifie que le backend est lancé.
        </p>
      </Card>
    );
  }

  const saveSettings = async () => {
    const parsed = updateSettingsSchema.safeParse(settings);
    if (!parsed.success) {
      toast.error("Certains champs sont invalides.");
      return;
    }
    setSaving(true);
    try {
      const updated = (await updateSettingsMutation.mutateAsync(
        settings,
      )) as ParametresSysteme;
      setSettings(updated);
      toast.success("Paramètres système sauvegardés.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    try {
      await api.updateProfile({
        firstName: profile.prenom,
        lastName: profile.nom,
        email: profile.email,
        photoUrl: profile.photoUrl,
      });
      await refreshUser();
      toast.success("Profil mis à jour.");
    } catch {
      toast.error("Erreur lors de la sauvegarde du profil.");
    }
  };

  const update = <K extends keyof ParametresSysteme>(
    key: K,
    value: ParametresSysteme[K],
  ) => setSettings((prev) => prev && { ...prev, [key]: value });

  return (
    <div className="space-y-6">
      {/* === EN-TÊTE === */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Paramètres système
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure les protocoles de sécurité et de présence de l'organisation.
        </p>
      </div>

      {/* === BENTO ROW: PROFIL + SÉCURITÉ === */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Profil */}
        <Card className="lg:col-span-8">
          <SectionHeader icon={User} title="Mon profil" description="Identité et photo affichées dans l'application." />
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative shrink-0"
            >
              <Avatar
                nom={`${profile.prenom} ${profile.nom}`}
                src={profile.photoUrl}
                size="xl"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
                <Camera className="size-5 text-white" />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
            </button>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <Input
                value={profile.prenom}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, prenom: e.target.value }))
                }
                placeholder="Prénom"
              />
              <Input
                value={profile.nom}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, nom: e.target.value }))
                }
                placeholder="Nom"
              />
              <Input
                value={profile.email}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="Email"
                className="sm:col-span-2"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={saveProfile}>
              <Save className="size-4" />
              Enregistrer le profil
            </Button>
          </div>

          {/* Changer le mot de passe */}
          <div className="mt-8 border-t border-border pt-6">
            <SectionHeader icon={Lock} title="Changer mon mot de passe" description="Met à jour le mot de passe de ton compte." />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Input
                type="password"
                value={pwd.current}
                onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                placeholder="Mot de passe actuel"
              />
              <Input
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                placeholder="Nouveau (min. 6 caractères)"
              />
              <Input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Confirmer le nouveau"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleChangePassword} disabled={changingPwd}>
                <Lock className="size-4" />
                {changingPwd ? "Mise à jour..." : "Changer le mot de passe"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Statut sécurité réseau -- carte accent sombre */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm lg:col-span-4">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center rounded-md border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {settings.geofencing_actif ? "Sécurité active" : "Sécurité désactivée"}
              </span>
              <Shield className="size-5 text-primary-foreground/70" />
            </div>
            <h4 className="mb-1 text-lg font-bold">Intégrité réseau</h4>
            <p className="text-sm text-primary-foreground/70">
              Accès restreint au Wi-Fi et à la plage IP du bureau.
            </p>
          </div>
          <div className="relative mt-6 space-y-3">
            <label className="block space-y-1.5">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary-foreground/60">
                <Router className="size-3.5" /> BSSID autorisé
              </span>
              <input
                value={settings.reseau_bssid}
                onChange={(e) => update("reseau_bssid", e.target.value)}
                disabled={isReadOnly}
                placeholder="00:11:22:33:44:55"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30 disabled:opacity-60"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary-foreground/60">
                <Wifi className="size-3.5" /> Nom du réseau (SSID)
              </span>
              <input
                value={settings.reseau_ssid ?? ""}
                onChange={(e) => update("reseau_ssid", e.target.value)}
                disabled={isReadOnly}
                placeholder="DTA-STAR"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30 disabled:opacity-60"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary-foreground/60">
                <Wifi className="size-3.5" /> Plage IP locale
              </span>
              <input
                value={settings.plage_ip_locale}
                onChange={(e) => update("plage_ip_locale", e.target.value)}
                disabled={isReadOnly}
                placeholder="192.168.1.0/24"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30 disabled:opacity-60"
              />
            </label>
          </div>
        </div>
      </div>

      {/* === GÉOFENCING === */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-6">
          <SectionHeader
            icon={MapPinned}
            tone="signal"
            title="Périmètre de présence (géofencing)"
            description="Zone géographique autorisée pour l'émargement mobile."
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground">
              Rayon : <span className="font-semibold">{settings.rayon_geofencing_metres}m</span>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              Activer
              <Switch
                checked={settings.geofencing_actif}
                onChange={(checked) => update("geofencing_actif", checked)}
                disabled={isReadOnly}
              />
            </label>
          </div>
        </div>
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="p-6">
            <GeofenceMap
              center={settings.coordonnees_bureau}
              radius={settings.rayon_geofencing_metres}
            />
          </div>
          <div className="grid gap-4 border-t border-border p-6 sm:grid-cols-2 lg:border-l lg:border-t-0">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Rayon de sécurité (mètres)
              </label>
              <Input
                type="number"
                value={settings.rayon_geofencing_metres}
                onChange={(e) =>
                  update("rayon_geofencing_metres", Number(e.target.value))
                }
                disabled={isReadOnly}
              />
            </div>
            <div />
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Latitude</label>
              <Input
                type="number"
                step="0.0001"
                value={settings.coordonnees_bureau.lat}
                onChange={(e) =>
                  setSettings(
                    (prev) =>
                      prev && {
                        ...prev,
                        coordonnees_bureau: {
                          ...prev.coordonnees_bureau,
                          lat: Number(e.target.value),
                        },
                      },
                  )
                }
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Longitude</label>
              <Input
                type="number"
                step="0.0001"
                value={settings.coordonnees_bureau.lng}
                onChange={(e) =>
                  setSettings(
                    (prev) =>
                      prev && {
                        ...prev,
                        coordonnees_bureau: {
                          ...prev.coordonnees_bureau,
                          lng: Number(e.target.value),
                        },
                      },
                  )
                }
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* === RÈGLES DE PRÉSENCE === */}
      <Card>
        <SectionHeader
          icon={Building2}
          title="Règles de présence & conformité"
          description="Paramètre les seuils de tolérance et les méthodes de validation."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RuleCard
            icon={Timer}
            label="Tolérance retard"
            description="Délai autorisé après l'heure de début sans marquage « Retard »."
          >
            <Input
              type="number"
              value={settings.tolerance_retard_minutes}
              onChange={(e) =>
                update("tolerance_retard_minutes", Number(e.target.value))
              }
              disabled={isReadOnly}
            />
          </RuleCard>
          <RuleCard
            icon={Clock}
            label="Durée max de pause"
            description="Durée maximale tolérée pour une pause avant anomalie."
          >
            <Input
              type="number"
              value={settings.duree_pause_max_minutes}
              onChange={(e) =>
                update("duree_pause_max_minutes", Number(e.target.value))
              }
              disabled={isReadOnly}
            />
          </RuleCard>
          <RuleCard
            icon={MapPinned}
            label="Géofencing"
            description="Exiger que le pointage se fasse dans le périmètre autorisé."
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {settings.geofencing_actif ? "Activé" : "Désactivé"}
              </span>
              <Switch
                checked={settings.geofencing_actif}
                onChange={(checked) => update("geofencing_actif", checked)}
                disabled={isReadOnly}
              />
            </div>
          </RuleCard>
          <RuleCard
            icon={Lock}
            label="Géolocalisation de secours"
            description="Autoriser une validation manuelle si le GPS échoue."
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {settings.geolocalisation_secours_active ? "Activé" : "Désactivé"}
              </span>
              <Switch
                checked={Boolean(settings.geolocalisation_secours_active)}
                onChange={(checked) =>
                  update("geolocalisation_secours_active", checked)
                }
                disabled={isReadOnly}
              />
            </div>
          </RuleCard>
        </div>
      </Card>

      {/* === HORAIRES STANDARD === */}
      <Card>
        <SectionHeader icon={Clock} title="Horaires standard" description="Plage horaire de référence pour le calcul des retards." />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Début de journée
            </label>
            <Input
              type="time"
              value={settings.heure_debut_journee || "08:00"}
              onChange={(e) => update("heure_debut_journee", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Fin de journée
            </label>
            <Input
              type="time"
              value={settings.heure_fin_journee || "17:00"}
              onChange={(e) => update("heure_fin_journee", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </Card>

      {/* === CALENDRIER === */}
      <Card>
        <SectionHeader icon={CalendarDays} title="Calendrier" description="Jours fériés et jours ouvrés de l'organisation." />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Jours fériés (un par ligne)
            </label>
            <textarea
              value={settings.jours_feries.join("\n")}
              onChange={(e) =>
                update(
                  "jours_feries",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              disabled={isReadOnly}
              className="min-h-36 w-full resize-none rounded-xl border border-border bg-card p-3 text-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="2026-01-01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Jours ouvrés
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {joursSemaine.map((jour) => (
                <label
                  key={jour}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm text-foreground transition hover:bg-muted has-checked:border-brand has-checked:bg-brand/5"
                >
                  <input
                    type="checkbox"
                    checked={settings.jours_ouvres.includes(jour)}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSettings(
                        (prev) =>
                          prev && {
                            ...prev,
                            jours_ouvres: checked
                              ? [...prev.jours_ouvres, jour]
                              : prev.jours_ouvres.filter((j) => j !== jour),
                          },
                      );
                    }}
                    className="size-4 accent-brand"
                  />
                  <span className="capitalize">{jour}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* === SAUVEGARDE GLOBALE === */}
      {!isReadOnly && (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Paramètres système
            </p>
            <p className="text-xs text-muted-foreground">
              La sauvegarde concerne le réseau, le géofencing, les règles et le
              calendrier.
            </p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Spinner /> : <Save className="size-4" />}
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </Button>
        </div>
      )}
    </div>
  );
}