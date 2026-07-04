// app/(dashboard)/dashboard/employes/page.tsx
// Liste RH complète avec création d'employé et actions rapides sur les comptes.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Plus, Power, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/dashboard/avatar";
import { Badge } from "@/components/dashboard/status-badge";
import { EmployeeFilters } from "@/components/dashboard/employee-filters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table";
import { api } from "@/lib/api";
import { departementsDisponibles, getNomComplet } from "@/lib/data";
import type { Utilisateur } from "@/lib/types";

const roleLabel = {
  employe: "Employé",
  gestionnaire: "Gestionnaire",
  admin: "Administrateur",
};

export default function EmployesPage() {
  const [employees, setEmployees] = useState<Utilisateur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartement, setFilterDepartement] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterGeofencing, setFilterGeofencing] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    departement: departementsDisponibles[0] ?? "Production",
  });

  useEffect(() => {
    api.getEmployees().then((result) => {
      setEmployees(result);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      employees.filter((employee) => {
        const search = searchQuery.toLowerCase().trim();
        return (
          (!search ||
            getNomComplet(employee).toLowerCase().includes(search) ||
            employee.email.toLowerCase().includes(search)) &&
          (filterDepartement === "all" || employee.departement === filterDepartement) &&
          (filterStatut === "all" || employee.statut_actuel === filterStatut)
        );
      }),
    [employees, filterDepartement, filterStatut, searchQuery],
  );

  const handleCreate = async () => {
    await api.createEmployee(form);
    toast.success("Employé créé en mode démo.");
    setCreateOpen(false);
    setForm({
      nom: "",
      prenom: "",
      email: "",
      departement: departementsDisponibles[0] ?? "Production",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement des employés...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Répertoire des employés</h2>
          <p className="text-sm text-muted-foreground">
            Gèrez les comptes, appareils associés et accès de pointage.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvel employé
        </Button>
      </div>

      <EmployeeFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statut={filterStatut}
        setStatut={setFilterStatut}
        filterDepartement={filterDepartement}
        setFilterDepartement={setFilterDepartement}
        geofencing={filterGeofencing}
        setGeofencing={setFilterGeofencing}
        departements={departementsDisponibles}
      />

      <Card>
        <TableWrapper className="border-0">
          <Table>
            <thead className="bg-muted/50">
              <tr>
                <TableHeadCell>Employé</TableHeadCell>
                <TableHeadCell>Email</TableHeadCell>
                <TableHeadCell>Département</TableHeadCell>
                <TableHeadCell>Rôle</TableHeadCell>
                <TableHeadCell>Statut</TableHeadCell>
                <TableHeadCell>Appareil</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id} className="border-t border-border">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        nom={getNomComplet(employee)}
                        src={employee.photo_url}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {getNomComplet(employee)}
                        </p>
                        <p className="text-xs text-muted-foreground">{employee.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{employee.email}</td>
                  <td className="px-4 py-4 text-muted-foreground">{employee.departement}</td>
                  <td className="px-4 py-4">
                    <Badge variant="brand">{roleLabel[employee.role]}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge
                      variant={
                        employee.statut_actuel === "present"
                          ? "success"
                          : employee.statut_actuel === "pause"
                            ? "warning"
                            : employee.statut_actuel === "absent"
                              ? "danger"
                              : "info"
                      }
                    >
                      {employee.statut_actuel}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Smartphone className="size-4" />
                      <span>{employee.appareil?.modele ?? "Aucun"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <Link href={`/dashboard/employes/${employee.id}`}>
                        <Button variant="outline" size="sm" className="w-full">Voir la fiche</Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={async () => {
                          await api.deactivateDevice(employee.id);
                          toast.success("Appareil désactivé pour la démo.");
                        }}
                      >
                        <Power className="size-4" />
                        Désactiver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                        onClick={async () => {
                          await api.resetPin(employee.id);
                          toast.success("PIN réinitialisé pour la démo.");
                        }}
                      >
                        <KeyRound className="size-4" />
                        Réinitialiser PIN
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouvel employé"
        description="Formulaire simplifié pour la démonstration RH."
      >
        <div className="grid gap-4">
          <Input
            placeholder="Nom"
            value={form.nom}
            onChange={(event) => setForm((prev) => ({ ...prev, nom: event.target.value }))}
          />
          <Input
            placeholder="Prénom"
            value={form.prenom}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, prenom: event.target.value }))
            }
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <select
            value={form.departement}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, departement: event.target.value }))
            }
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          >
            {departementsDisponibles.map((departement) => (
              <option key={departement} value={departement}>
                {departement}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate}>Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
