import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EMPLOYEES = [
  { prenom: 'Yann', nom: 'Sihno', email: 'sihnoyann@gmail.com', role: 'admin', telephone: '+225 01 02 03 04 05' },
  { prenom: 'Wangari', nom: 'Maathai', email: 'wangari.maathai@demo.com', role: 'gestionnaire', telephone: '+254 712 345 678' },
  { prenom: 'Gestionnaire', nom: 'Demo', email: 'gestionnaire@demo.com', role: 'gestionnaire', telephone: '+225 05 00 00 00 01' },
  { prenom: 'Thomas', nom: 'Sankara', email: 'thomas.sankara@demo.com', role: 'employe', telephone: '+226 70 12 34 56' },
  { prenom: 'Youssou', nom: "N'Dour", email: 'youssou.ndour@demo.com', role: 'employe', telephone: '+221 77 123 45 67' },
  { prenom: 'Chimamanda', nom: 'Adichie', email: 'chimamanda.adichie@demo.com', role: 'employe', telephone: '+234 803 123 4567' },
  { prenom: 'Didier', nom: 'Drogba', email: 'didier.drogba@demo.com', role: 'employe', telephone: '+225 05 12 34 567' },
  { prenom: 'Angélique', nom: 'Kidjo', email: 'angelique.kidjo@demo.com', role: 'employe', telephone: '+229 61 12 34 56' },
  { prenom: 'Lupita', nom: "Nyong'o", email: 'lupita.nyongo@demo.com', role: 'employe', telephone: '+254 720 123 456' },
  { prenom: 'Haile', nom: 'Gebrselassie', email: 'haile.gebrselassie@demo.com', role: 'employe', telephone: '+251 911 123 456' },
  { prenom: 'Samuel', nom: "Eto'o", email: 'samuel.etoo@demo.com', role: 'employe', telephone: '+237 677 123 456' },
];

async function main() {
  console.log('🗑️  Nettoyage des données existantes...');
  await prisma.requestModification.deleteMany();
  await prisma.request.deleteMany();
  await prisma.logAction.deleteMany();
  await prisma.anomaly.deleteMany();
  await prisma.sessionPresence.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const codePinHash = await bcrypt.hash('1234', 10);

  console.log('👤 Création des utilisateurs...');
  const createdUsers = [];
  for (const emp of EMPLOYEES) {
    const user = await prisma.user.create({
      data: {
        firstName: emp.prenom,
        lastName: emp.nom,
        email: emp.email,
        passwordHash,
        codePinHash,
        methodeAuth: 'pin',
        role: emp.role,
        statutActuel: 'absent',
        departement: emp.role === 'admin' ? 'Direction' : emp.role === 'gestionnaire' ? 'RH' : 'Production',
        telephone: emp.telephone,
        actif: true,
        tentativesPin: 0,
        dateCreation: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`   ✓ ${emp.prenom} ${emp.nom} (${emp.role})`);
  }

  console.log('📱 Création des appareils...');
  const now = new Date();
  for (const user of createdUsers) {
    await prisma.device.create({
      data: {
        userId: user.id,
        identifiantAppareil: `DEVICE-${user.firstName?.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        marque: ['Samsung', 'Apple', 'Xiaomi', 'Tecno', 'Itel'][Math.floor(Math.random() * 5)],
        modele: ['Galaxy A54', 'iPhone 15', 'Redmi Note 12', 'Camon 20', 'P40'][Math.floor(Math.random() * 5)],
        dateAssociation: new Date(now.getTime() - Math.random() * 90 * 86400000),
        actif: true,
      },
    });
  }

  console.log('📅 Création des sessions (7 derniers jours)...');
  const employes = createdUsers.filter((u) => u.role === 'employe');
  const debut = new Date(now);
  debut.setDate(debut.getDate() - 7);
  debut.setHours(0, 0, 0, 0);

  for (let d = new Date(debut); d <= now; d.setDate(d.getDate() + 1)) {
    const jour = d.getDay();
    if (jour === 0 || jour === 6) continue;

    for (const emp of employes) {
      const arrivee = new Date(d);
      arrivee.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
      const depart = new Date(arrivee);
      depart.setHours(arrivee.getHours() + 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

      const retard = arrivee.getHours() * 60 + arrivee.getMinutes() > 8 * 60
        ? arrivee.getHours() * 60 + arrivee.getMinutes() - 8 * 60
        : null;

      await prisma.sessionPresence.create({
        data: {
          userId: emp.id,
          date: d,
          heureArrivee: arrivee,
          heureDepart: depart,
          typeArrivee: 'normale',
          methodeValidation: 'mobile',
          retardMinutes: retard,
          valide: true,
        },
      });
    }
  }

  console.log('⚙️  Création des paramètres par défaut...');
  await prisma.setting.create({
    data: {
      reseauBssid: '66:f1:e2:21:44:47',
      reseauSsid: 'DTA-STAR',
      plageIpLocale: '192.168.1.0/24',
      toleranceRetardMinutes: 15,
      dureePauseMaxMinutes: 90,
      joursFeries: JSON.stringify([]),
      joursOuvres: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      politiqueConfidentialite: 'Les données de pointage sont collectées pour le suivi des présences. Elles sont conservées pendant la durée légale et ne sont pas partagées avec des tiers.',
      geolocalisationSecoursActive: false,
      geofencingActif: true,
      rayonGeofencingMetres: 120,
      latitudeBureau: 3.879683,
      longitudeBureau: 11.541295,
      heureDebutJournee: '08:00',
      heureFinJournee: '17:00',
    },
  });

  console.log('✅ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
