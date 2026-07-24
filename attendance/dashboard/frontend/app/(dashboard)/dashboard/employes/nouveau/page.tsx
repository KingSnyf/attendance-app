"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, ChevronDown, UserRound } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@/hooks/useAuth"
import { useCreateEmployee, useEmployees } from "@/lib/hooks/use-employees"
import { createEmployeeSchema } from "@/lib/schemas"

type FormState = {
  nom: string
  prenom: string
  email: string
  telephone: string
  role: "employe" | "gestionnaire" | "admin"
  departement: string
  designation: string
  equipe: string
  experience: string
  universite: string
  qualification: string
  grade: string
  dateDebut: string
  dateFin: string
}

const initialForm: FormState = {
  nom: "", prenom: "", email: "", telephone: "", role: "employe", departement: "Production",
  designation: "", equipe: "", experience: "", universite: "", qualification: "", grade: "",
  dateDebut: "", dateFin: "",
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] text-[#808798]">{label}</span>{children}{error && <span className="mt-1 block text-[10px] text-red-600">{error}</span>}</label>
}

const control = "h-10 w-full rounded-md border border-[#d9dee7] bg-white px-3 text-[11px] text-[#222b45] outline-none transition focus:border-[#5363dc]"

export default function NouvelEmployePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: employees = [] } = useEmployees()
  const createEmployee = useCreateEmployee()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const departments = useMemo(() => [...new Set(employees.map((employee) => employee.departement).filter(Boolean))].sort(), [employees])
  const set = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: "" }))
  }

  const validateFirstStep = () => {
    const parsed = createEmployeeSchema.safeParse({
      nom: form.nom, prenom: form.prenom, email: form.email, telephone: form.telephone,
      role: form.role, departement: form.departement,
    })
    if (parsed.success) return true
    const next: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => { next[String(issue.path[0])] = issue.message })
    setErrors(next)
    return false
  }

  const save = async () => {
    if (!validateFirstStep()) {
      setStep(1)
      return
    }
    try {
      await createEmployee.mutateAsync({
        nom: form.nom, prenom: form.prenom, email: form.email, telephone: form.telephone,
        role: form.role, departement: form.departement, isAdmin: user?.role === "admin",
      })
      toast.success("Profil employé créé.")
      router.push("/dashboard/employes")
    } catch {
      toast.error("La création du profil a échoué.")
    }
  }

  return (
    <div className="mx-auto max-w-[1050px]">
      <p className="mb-4 text-[11px] text-[#8a91a3]">Tableau de bord / Ajouter un profil</p>
      <section className="overflow-hidden rounded-lg border border-[#e1e5eb] bg-white shadow-[0_2px_10px_rgba(31,42,68,.04)]">
        <header className="flex items-center justify-between border-b border-[#eef0f3] px-5 py-4">
          <h1 className="text-sm font-semibold text-[#111a35]">Ajouter un profil</h1>
          <div className="flex items-center gap-2 text-[10px]">
            <button onClick={() => setStep(1)} className={step === 1 ? "font-semibold text-[#17203a]" : "text-[#8a91a3]"}>01</button>
            <span className="h-px w-12 bg-[#dfe3e9]" />
            <button onClick={() => validateFirstStep() && setStep(2)} className={step === 2 ? "border-b-2 border-[#55c4df] pb-1 font-semibold text-[#17203a]" : "text-[#8a91a3]"}>02</button>
          </div>
        </header>

        <div className="grid min-h-[520px] gap-10 p-7 md:grid-cols-[250px_1fr] md:p-12">
          <div className="flex items-start justify-center pt-8">
            <div className="relative flex size-40 items-center justify-center rounded-full bg-[#f4f6f8]">
              <UserRound className="size-16 text-[#a9afbd]" />
              <button className="absolute bottom-11 right-6 flex size-7 items-center justify-center rounded-full border-2 border-white bg-white text-[#697084] shadow" aria-label="Ajouter une photo"><Camera className="size-3.5" /></button>
            </div>
          </div>

          {step === 1 ? (
            <div className="grid content-start gap-x-10 gap-y-5 md:grid-cols-2">
              <Field label="Prénom" error={errors.prenom}><input className={control} value={form.prenom} onChange={(event) => set("prenom", event.target.value)} /></Field>
              <Field label="Nom" error={errors.nom}><input className={control} value={form.nom} onChange={(event) => set("nom", event.target.value)} /></Field>
              <Field label="Email" error={errors.email}><input type="email" className={control} value={form.email} onChange={(event) => set("email", event.target.value)} /></Field>
              <Field label="Téléphone" error={errors.telephone}><input className={control} value={form.telephone} onChange={(event) => set("telephone", event.target.value)} placeholder="06 00 00 00 00" /></Field>
              <Field label="Rôle">
                <div className="relative"><select className={`${control} appearance-none`} value={form.role} onChange={(event) => set("role", event.target.value)}><option value="employe">Employé</option>{user?.role === "admin" && <><option value="gestionnaire">Gestionnaire</option><option value="admin">Administrateur</option></>}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-3.5 text-[#7d8496]" /></div>
              </Field>
              <Field label="Département" error={errors.departement}>
                <div className="relative"><select className={`${control} appearance-none`} value={form.departement} onChange={(event) => set("departement", event.target.value)}>{departments.length ? departments.map((item) => <option key={item}>{item}</option>) : <><option>Production</option><option>Design</option><option>Développement</option><option>Data Science</option></>}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-3.5 text-[#7d8496]" /></div>
              </Field>
              <div className="md:col-span-2 mt-6 flex justify-end gap-3">
                <button onClick={() => router.back()} className="h-10 rounded-md px-5 text-xs font-medium text-[#596174] hover:bg-[#f4f6f8]">Annuler</button>
                <button onClick={() => validateFirstStep() && setStep(2)} className="h-10 rounded-md bg-[#5363dc] px-6 text-xs font-semibold text-white">Suivant</button>
              </div>
            </div>
          ) : (
            <div className="grid content-start gap-x-10 gap-y-5 md:grid-cols-2">
              <Field label="Désignation"><input className={control} value={form.designation} onChange={(event) => set("designation", event.target.value)} placeholder="Senior UI/UX Designer" /></Field>
              <Field label="Département"><input className={control} value={form.departement} onChange={(event) => set("departement", event.target.value)} /></Field>
              <Field label="Équipe"><input className={control} value={form.equipe} onChange={(event) => set("equipe", event.target.value)} placeholder="UX" /></Field>
              <Field label="Expérience"><input className={control} value={form.experience} onChange={(event) => set("experience", event.target.value)} placeholder="6 ans" /></Field>
              <h2 className="md:col-span-2 mt-2 text-xs font-semibold text-[#17203a]">Qualification</h2>
              <Field label="Université / École"><input className={control} value={form.universite} onChange={(event) => set("universite", event.target.value)} /></Field>
              <Field label="Diplôme le plus élevé"><input className={control} value={form.qualification} onChange={(event) => set("qualification", event.target.value)} /></Field>
              <Field label="Mention / Grade"><input className={control} value={form.grade} onChange={(event) => set("grade", event.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date de début"><input type="date" className={control} value={form.dateDebut} onChange={(event) => set("dateDebut", event.target.value)} /></Field>
                <Field label="Date de fin"><input type="date" className={control} value={form.dateFin} onChange={(event) => set("dateFin", event.target.value)} /></Field>
              </div>
              <div className="md:col-span-2 mt-6 flex justify-end gap-3">
                <button onClick={() => setStep(1)} className="h-10 rounded-md px-5 text-xs font-medium text-[#596174] hover:bg-[#f4f6f8]">Retour</button>
                <button onClick={save} disabled={createEmployee.isPending} className="h-10 rounded-md bg-[#5363dc] px-7 text-xs font-semibold text-white disabled:opacity-60">{createEmployee.isPending ? "Enregistrement..." : "Enregistrer"}</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
