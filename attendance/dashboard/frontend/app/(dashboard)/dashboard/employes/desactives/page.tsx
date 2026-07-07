"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Power, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/dashboard/avatar";
import { Badge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableHeadCell, TableWrapper } from "@/components/ui/table";
import { api } from "@/lib/api";
import { getNomComplet } from "@/lib/data";
import { roleLabel } from "@/lib/labels";
import type { Utilisateur } from "@/lib/types";

export default function EmployesDesactivesPage() {
  const [employees, setEmployees] = useState<Utilisateur[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    setIsLoading(true);
    api.getEmployees().then((result) => {
      setEmployees(result.filter((e) => !e.actif));
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  useEffect(() => { load() }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/employes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-2">
        <ArrowLeft className="size-4" />
        Retour aux employés
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Comptes désactivés</h2>
          <p className="text-sm text-muted-foreground">
            {employees.length} employé(s) dont le compte est inactif.
          </p>
        </div>
      </div>

      <Card>
        <TableWrapper className="border-0">
          <Table>
            <thead className="bg-muted/50">
              <tr>
                <TableHeadCell>Employé</TableHeadCell>
                <TableHeadCell>Email</TableHeadCell>
                <TableHeadCell>Département</TableHeadCell>
                <TableHeadCell>Rôle</TableHeadCell>
                <TableHeadCell>Appareil</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t border-border">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar nom={getNomComplet(employee)} src={employee.photo_url} size="sm" />
                      <div>
                        <p className="font-medium text-foreground">{getNomComplet(employee)}</p>
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
                          try {
                            await api.toggleAccount(employee.id);
                            toast.success("Compte réactivé");
                            load();
                          } catch { toast.error("Erreur"); }
                        }}
                      >
                        <Power className="size-4" />
                        Réactiver
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun compte désactivé.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </Card>
    </div>
  );
}
