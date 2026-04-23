export interface Medecin {
  id: number;
  numero_ordre: string;
  nom: string;
  prenom: string;
  specialite: string;
  telephone: string;
  email: string;
  statut: 'actif' | 'conge' | 'inactif';
}
