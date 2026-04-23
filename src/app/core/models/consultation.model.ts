export interface Consultation {
  id: number;
  patient_id: number;
  medecin_id: number;
  date_consultation: string;
  motif_consultation: string;
  symptomes: string;
  diagnostic: string;
  observations: string;
  ordonnance: string;
  certificat: boolean;
}
