// app/(dashboard)/dashboard/employes/page.tsx
// Liste RH complète avec création d'employé et actions rapides sur les comptes.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
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
import { roleLabel, statutBadgeVariant, statutLabel } from "@/lib/labels";
import type { Utilisateur } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

export default function EmployesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [employees, setEmployees] = useState<Utilisateur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartement, setFilterDepartement] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterGeofencing, setFilterGeofencing] = useState("all");
  const [filterActif, setFilterActif] = useState("actifs");
  const [createOpen, setCreateOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    role: "employe",
    departement: departementsDisponibles[0] ?? "Production",
  });

  const loadEmployees = () => {
    setIsLoading(true);
    api.getEmployees().then((result) => {
      setEmployees(result);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => {
    loadEmployees();
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
          (filterStatut === "all" || employee.statut_actuel === filterStatut) &&
          (filterActif === "actifs" ? employee.actif : filterActif === "desactives" ? !employee.actif : true)
        );
      }),
    [employees, filterDepartement, filterStatut, searchQuery, filterActif],
  );

  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!form.nom.trim()) errors.nom = "Le nom est requis";
    if (!form.prenom.trim()) errors.prenom = "Le prénom est requis";
    if (!form.email.trim()) errors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalide";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        departement: form.departement,
      };
      if (isAdmin && form.role !== "employe") {
        await api.createUser({ ...payload, role: form.role });
      } else {
        await api.createEmployee(payload);
      }
      toast.success("Employé créé.");
      setCreateOpen(false);
      setFormErrors({});
      setForm({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        role: "employe",
        departement: departementsDisponibles[0] ?? "Production",
      });
      loadEmployees();
    } catch (e) {
      toast.error("Erreur lors de la création. Vérifiez les champs.");
    }
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
        <div className="flex gap-2">
          <Link href="/dashboard/employes/desactives">
            <Button variant="outline">
              <Users className="size-4" />
              Désactivés
            </Button>
          </Link>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nouvel employé
          </Button>
        </div>
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

      <div className="flex gap-2">
        {(["actifs", "desactives", "tous"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilterActif(opt)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
              filterActif === opt
                ? "bg-brand text-white"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {opt === "actifs" ? "Actifs" : opt === "desactives" ? "Désactivés" : "Tous"}
          </button>
        ))}
      </div>

      <Card>
        <TableWrapper className="border-0">
          <Table>
            <thead className="bg-muted/50">
              <tr>
                <TableHeadCell>Employé</TableHeadCell>
                <TableHeadCell>Email</TableHeadCell>
                <TableHeadCell>Téléphone</TableHeadCell>
                <TableHeadCell>Département</TableHeadCell>
                <TableHeadCell>Rôle</TableHeadCell>
                <TableHeadCell>Statut</TableHeadCell>
                <TableHeadCell>Compte</TableHeadCell>
                <TableHeadCell>Appareil</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
              <tr key={employee.id} className="border-t border-border">
                  <td className="px-2.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar
                        nom={getNomComplet(employee)}
                        src={employee.photo_url}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {getNomComplet(employee)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{employee.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 text-sm text-muted-foreground">{employee.email}</td>
                  <td className="px-2.5 py-2.5 text-sm text-muted-foreground">{employee.telephone || "—"}</td>
                  <td className="px-2.5 py-2.5 text-sm text-muted-foreground">{employee.departement}</td>
                  <td className="px-2.5 py-2.5">
                    <Badge variant="brand">{roleLabel[employee.role]}</Badge>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <Badge variant={statutBadgeVariant(employee.statut_actuel)}>
                      {statutLabel[employee.statut_actuel] ?? employee.statut_actuel}
                    </Badge>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <Badge variant={employee.actif ? "success" : "danger"}>
                      {employee.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span className="text-sm text-muted-foreground">
                      {employee.appareil?.marque ?? ""} {employee.appareil?.modele ?? "—"}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="flex gap-1">
                      <Link href={`/dashboard/employes/${employee.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2">Fiche</Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        onClick={async () => {
                          try {
                            await api.toggleAccount(employee.id);
                            toast.success(employee.actif ? "Compte désactivé" : "Compte réactivé");
                            loadEmployees();
                          } catch { toast.error("Erreur"); }
                        }}
                      >
                        {employee.actif ? "Désactiver" : "Réactiver"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2 border-warning text-warning-foreground hover:bg-warning"
                        onClick={async () => {
                          try {
                            const result = await api.resetPin(employee.id);
                            toast.success(result?.newPin ? `PIN : ${result.newPin}` : "PIN réinitialisé");
                          } catch { toast.error("Erreur"); }
                        }}
                      >
                        PIN
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
          <div>
            <Input
              placeholder="Nom"
              value={form.nom}
              onChange={(event) => { setForm((prev) => ({ ...prev, nom: event.target.value })); setFormErrors((prev) => ({ ...prev, nom: "" })); }}
            />
            {formErrors.nom && <p className="mt-1 text-xs text-destructive">{formErrors.nom}</p>}
          </div>
          <div>
            <Input
              placeholder="Prénom"
              value={form.prenom}
              onChange={(event) => { setForm((prev) => ({ ...prev, prenom: event.target.value })); setFormErrors((prev) => ({ ...prev, prenom: "" })); }}
            />
            {formErrors.prenom && <p className="mt-1 text-xs text-destructive">{formErrors.prenom}</p>}
          </div>
          <div>
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(event) => { setForm((prev) => ({ ...prev, email: event.target.value })); setFormErrors((prev) => ({ ...prev, email: "" })); }}
            />
            {formErrors.email && <p className="mt-1 text-xs text-destructive">{formErrors.email}</p>}
          </div>
          <Input
            placeholder="Téléphone"
            type="tel"
            value={form.telephone}
            onChange={(event) => setForm((prev) => ({ ...prev, telephone: event.target.value }))}
          />
          {isAdmin && (
            <select
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value }))
              }
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="employe">Employé</option>
              <option value="gestionnaire">Gestionnaire</option>
              <option value="admin">Admin</option>
            </select>
          )}
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