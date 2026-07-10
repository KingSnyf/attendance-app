import { randomBytes } from 'crypto';

/**
 * Génère un mot de passe temporaire aléatoire pour un nouveau compte.
 * Remplace l'ancien mot de passe codé en dur ("pass123") envoyé par le frontend :
 * chaque compte reçoit désormais un mot de passe unique et imprévisible,
 * communiqué à l'utilisateur par email de bienvenue.
 */
export function genererMotDePasseTemporaire(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const octets = randomBytes(12);
  let motDePasse = '';
  for (let i = 0; i < 12; i++) {
    motDePasse += alphabet[octets[i] % alphabet.length];
  }
  return motDePasse;
}