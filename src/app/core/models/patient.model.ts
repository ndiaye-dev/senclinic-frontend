export interface Patient {
  id: number;
  numero_dossier: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'Homme' | 'Femme' | 'Autre';
  groupe_sanguin: string;
  poids: number;
  telephone: string;
  adresse: string;
  email: string;
  numero_securite_sociale: string;
  allergies: string;
  antecedents_medicaux: string;
  traitements_cours: string;
  medecin_traitant: number;
  statut: 'actif' | 'hospitalise' | 'inactif';
}
