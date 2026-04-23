import type { UserRole } from './auth.model';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  telephone: string;
  statut: 'actif' | 'inactif';
  mot_de_passe: string;
}
