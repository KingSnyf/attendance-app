// app/(dashboard)/dashboard/parametres/page.tsx
// Paramètres système réservés à l'administrateur avec réseau, géofencing et calendrier.

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { ParametresSysteme } from "@/lib/types";

const GeofenceMap = dynamic(
  () => import("@/components/dashboard/geofence-map").then((module) => module.GeofenceMap),
  { ssr: false },
);

const joursSemaine = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

export default function ParametresPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ParametresSysteme | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  if (user?.role !== "admin") {
    return <Card>Accès réservé aux administrateurs.</Card>;
  }

  if (!settings) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des paramètres système...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Réseau & sécurité</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            value={settings.reseau_bssid}
            onChange={(event) =>
              setSettings((prev) => prev && { ...prev, reseau_bssid: event.target.value })
            }
            placeholder="BSSID WiFi"
          />
          <Input
            value={settings.plage_ip_locale}
            onChange={(event) =>
              setSettings((prev) => prev && { ...prev, plage_ip_locale: event.target.value })
            }
            placeholder="Plage IP locale"
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Géofencing</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settings.geofencing_actif}
                onChange={(event) =>
                  setSettings((prev) =>
                    prev && { ...prev, geofencing_actif: event.target.checked },
                  )
                }
              />
              Activer le géofencing
            </label>
            <Input
              type="number"
              value={settings.rayon_geofencing_metres}
              onChange={(event) =>
                setSettings((prev) =>
                  prev && {
                    ...prev,
                    rayon_geofencing_metres: Number(event.target.value),
                  },
                )
              }
              placeholder="Rayon en mètres"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="number"
                step="0.0001"
                value={settings.coordonnees_bureau.lat}
                onChange={(event) =>
                  setSettings((prev) =>
                    prev && {
                      ...prev,
                      coordonnees_bureau: {
                        ...prev.coordonnees_bureau,
                        lat: Number(event.target.value),
                      },
                    },
                  )
                }
                placeholder="Latitude"
              />
              <Input
                type="number"
                step="0.0001"
                value={settings.coordonnees_bureau.lng}
                onChange={(event) =>
                  setSettings((prev) =>
                    prev && {
                      ...prev,
                      coordonnees_bureau: {
                        ...prev.coordonnees_bureau,
                        lng: Number(event.target.value),
                      },
                    },
                  )
                }
                placeholder="Longitude"
              />
            </div>
          </div>
          <GeofenceMap
            center={settings.coordonnees_bureau}
            radius={settings.rayon_geofencing_metres}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Règles de présence</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            type="number"
            value={settings.tolerance_retard_minutes}
            onChange={(event) =>
              setSettings((prev) =>
                prev && {
                  ...prev,
                  tolerance_retard_minutes: Number(event.target.value),
                },
              )
            }
            placeholder="Tolérance de retard"
          />
          <Input
            type="number"
            value={settings.duree_pause_max_minutes}
            onChange={(event) =>
              setSettings((prev) =>
                prev && {
                  ...prev,
                  duree_pause_max_minutes: Number(event.target.value),
                },
              )
            }
            placeholder="Durée max de pause"
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Calendrier</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Jours fériés</p>
            <textarea
              value={settings.jours_feries.join("\n")}
              onChange={(event) =>
                setSettings((prev) =>
                  prev && {
                    ...prev,
                    jours_feries: event.target.value
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  },
                )
              }
              className="min-h-36 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Jours ouvrés</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {joursSemaine.map((jour) => (
                <label key={jour} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={settings.jours_ouvres.includes(jour)}
                    onChange={(event) =>
                      setSettings((prev) =>
                        prev && {
                          ...prev,
                          jours_ouvres: event.target.checked
                            ? [...prev.jours_ouvres, jour]
                            : prev.jours_ouvres.filter((item) => item !== jour),
                        },
                      )
                    }
                  />
                  {jour}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={async () => {
            await api.updateSettings(settings);
            toast.success("Paramètres sauvegardés.");
          }}
        >
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
