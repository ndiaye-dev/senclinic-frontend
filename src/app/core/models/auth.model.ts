export type UserRole = 'administrateur' | 'medecin' | 'secretaire';

export interface SessionUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
}
