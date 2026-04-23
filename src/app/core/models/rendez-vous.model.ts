export interface RendezVous {
  id: number;
  patient_id: number;
  medecin_id: number;
  date_rdv: string;
  heure_rdv: string;
  motif: string;
  statut: 'planifie' | 'confirme' | 'termine' | 'annule';
}
