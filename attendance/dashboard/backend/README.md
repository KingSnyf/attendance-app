# Attendance backend (scaffold)

Scaffold minimal d'un backend NestJS pour le projet Attendance.

Instructions rapides:

1. Installer les dépendances:

```bash
cd backend
npm install
```

2. Générer Prisma (si vous utilisez la DB):

```bash
npm run prisma:generate
npm run prisma:migrate
```

3. Lancer en développement:

```bash
npm run dev
```

Le scaffold fourni des endpoints minimaux in-memory. Pour passer à Prisma, exécuter les commandes ci‑dessus puis adapter le `PrismaClient`.
