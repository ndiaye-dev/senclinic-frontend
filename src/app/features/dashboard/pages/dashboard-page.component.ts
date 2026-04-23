import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { MedecinsService } from '../../../core/services/medecins.service';
import { PatientsService } from '../../../core/services/patients.service';
import { RendezVousService } from '../../../core/services/rendez-vous.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import type { Consultation } from '../../../core/models/consultation.model';
import type { Medecin } from '../../../core/models/medecin.model';
import type { Patient } from '../../../core/models/patient.model';
import type { RendezVous } from '../../../core/models/rendez-vous.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly medecins = signal<Medecin[]>([]);
  readonly patients = signal<Patient[]>([]);
  readonly rendezVous = signal<RendezVous[]>([]);
  readonly consultations = signal<Consultation[]>([]);
  readonly todayLabel = this.formatDateLong(new Date());
  readonly quickActions = [
    {
      label: 'Nouveau patient',
      description: 'Enregistrer un nouveau dossier medical',
      path: '/patients'
    },
    {
      label: 'Planifier un rendez-vous',
      description: 'Creer un rendez-vous dans le calendrier',
      path: '/rendez-vous'
    },
    {
      label: 'Saisir une consultation',
      description: 'Ajouter compte rendu, diagnostic, ordonnance',
      path: '/consultations'
    },
    {
      label: 'Gerer les medecins',
      description: 'Mettre a jour disponibilites et equipes',
      path: '/medecins'
    }
  ] as const;

  readonly totalPatients = computed(() => this.patients().length);
  readonly totalMedecins = computed(() => this.medecins().length);
  readonly consultationsCount = computed(() => this.consultations().length);
  readonly medecinsActifs = computed(() => this.medecins().filter((medecin) => medecin.statut === 'actif').length);
  readonly patientsHospitalises = computed(
    () => this.patients().filter((patient) => patient.statut === 'hospitalise').length
  );
  readonly certificatsDelivres = computed(
    () => this.consultations().filter((consultation) => consultation.certificat).length
  );
  readonly rdvAujourdhui = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.rendezVous().filter((rdv) => rdv.date_rdv === today).length;
  });
  readonly rdvSemaine = computed(() => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);
    end.setDate(today.getDate() + 7);

    return this.rendezVous().filter((rdv) => {
      const rdvDate = new Date(`${rdv.date_rdv}T00:00:00`);
      return rdvDate >= start && rdvDate <= end;
    }).length;
  });
  readonly tauxRdvConfirmes = computed(() => {
    const total = this.rendezVous().length;
    if (total === 0) {
      return 0;
    }

    const confirmes = this.rendezVous().filter((rdv) => rdv.statut === 'confirme' || rdv.statut === 'termine').length;
    return Math.round((confirmes / total) * 100);
  });
  readonly chargeMoyenneParMedecin = computed(() => {
    const medecins = this.medecinsActifs();
    if (medecins === 0) {
      return 0;
    }

    return Math.round(this.totalPatients() / medecins);
  });
  readonly occupationMedicale = computed(() => {
    const reference = Math.max(1, this.medecinsActifs() * 24);
    return Math.min(100, Math.round((this.totalPatients() / reference) * 100));
  });
  readonly patientsParSexe = computed(() => {
    const total = this.totalPatients() || 1;
    const hommes = this.patients().filter((patient) => patient.sexe === 'Homme').length;
    const femmes = this.patients().filter((patient) => patient.sexe === 'Femme').length;
    const autres = this.patients().filter((patient) => patient.sexe === 'Autre').length;

    return {
      hommes,
      femmes,
      autres,
      pctHommes: Math.round((hommes / total) * 100),
      pctFemmes: Math.round((femmes / total) * 100),
      pctAutres: Math.round((autres / total) * 100)
    };
  });
  readonly sexeDonutStyle = computed(() => {
    const stats = this.patientsParSexe();
    const maleStop = stats.pctHommes;
    const femaleStop = stats.pctHommes + stats.pctFemmes;

    return `conic-gradient(
      #1d4ed8 0% ${maleStop}%,
      #0f766e ${maleStop}% ${femaleStop}%,
      #f59e0b ${femaleStop}% 100%
    )`;
  });
  readonly topMedecinsCharge = computed(() => {
    const counts = new Map<number, number>();
    for (const patient of this.patients()) {
      counts.set(patient.medecin_traitant, (counts.get(patient.medecin_traitant) ?? 0) + 1);
    }

    const max = Math.max(1, ...counts.values());

    return this.medecins()
      .filter((medecin) => medecin.statut === 'actif')
      .map((medecin) => {
        const patients = counts.get(medecin.id) ?? 0;
        return {
          id: medecin.id,
          nom: `Dr ${medecin.prenom} ${medecin.nom}`,
          specialite: medecin.specialite,
          patients,
          fill: Math.round((patients / max) * 100)
        };
      })
      .sort((a, b) => b.patients - a.patients)
      .slice(0, 4);
  });

  readonly distributionRendezVous = computed(() => {
    const collection = this.rendezVous();
    const total = collection.length || 1;
    const statuses: RendezVous['statut'][] = ['planifie', 'confirme', 'termine', 'annule'];

    return statuses.map((status) => {
      const count = collection.filter((rdv) => rdv.statut === status).length;
      const percentage = Math.round((count / total) * 100);

      return {
        status,
        count,
        percentage
      };
    });
  });
  readonly alertesPrioritaires = computed(() => {
    const alertes: Array<{ niveau: 'critique' | 'attention' | 'ok'; titre: string; detail: string }> = [];

    if (this.patientsHospitalises() >= 2) {
      alertes.push({
        niveau: 'critique',
        titre: 'Surveillance hospitalisation',
        detail: `${this.patientsHospitalises()} patients sont actuellement hospitalises.`
      });
    }

    if (this.tauxRdvConfirmes() < 60) {
      alertes.push({
        niveau: 'attention',
        titre: 'Confirmation des rendez-vous',
        detail: `Le taux de confirmation est de ${this.tauxRdvConfirmes()}%. Pensez a relancer les patients.`
      });
    }

    if (this.occupationMedicale() > 78) {
      alertes.push({
        niveau: 'attention',
        titre: 'Capacite medicale elevee',
        detail: `Occupation estimee a ${this.occupationMedicale()}%, reequilibrage des plannings recommande.`
      });
    }

    if (alertes.length === 0) {
      alertes.push({
        niveau: 'ok',
        titre: 'Situation stable',
        detail: 'Aucun signal critique detecte sur le flux clinique.'
      });
    }

    return alertes.slice(0, 3);
  });

  readonly agendaAujourdhui = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    const patientsMap = new Map(this.patients().map((patient) => [patient.id, `${patient.prenom} ${patient.nom}`]));
    const medecinsMap = new Map(this.medecins().map((medecin) => [medecin.id, `Dr ${medecin.prenom} ${medecin.nom}`]));

    return this.rendezVous()
      .filter((rdv) => rdv.date_rdv === today)
      .sort((a, b) => a.heure_rdv.localeCompare(b.heure_rdv))
      .map((rdv) => ({
        ...rdv,
        patientNom: patientsMap.get(rdv.patient_id) ?? 'Patient inconnu',
        medecinNom: medecinsMap.get(rdv.medecin_id) ?? 'Medecin inconnu'
      }));
  });
  readonly dernieresConsultations = computed(() => {
    const patientsMap = new Map(this.patients().map((patient) => [patient.id, `${patient.prenom} ${patient.nom}`]));
    const medecinsMap = new Map(this.medecins().map((medecin) => [medecin.id, `Dr ${medecin.prenom} ${medecin.nom}`]));

    return [...this.consultations()]
      .sort((a, b) => b.date_consultation.localeCompare(a.date_consultation))
      .slice(0, 4)
      .map((consultation) => ({
        ...consultation,
        patientNom: patientsMap.get(consultation.patient_id) ?? 'Patient inconnu',
        medecinNom: medecinsMap.get(consultation.medecin_id) ?? 'Medecin inconnu'
      }));
  });

  readonly prochainRendezVous = computed(() => {
    const patientsMap = new Map(this.patients().map((patient) => [patient.id, `${patient.prenom} ${patient.nom}`]));
    const medecinsMap = new Map(this.medecins().map((medecin) => [medecin.id, `Dr ${medecin.prenom} ${medecin.nom}`]));

    return this.rendezVous()
      .filter((rdv) => rdv.statut === 'planifie' || rdv.statut === 'confirme')
      .sort((a, b) => {
        const first = `${a.date_rdv}T${a.heure_rdv}`;
        const second = `${b.date_rdv}T${b.heure_rdv}`;
        return first.localeCompare(second);
      })
      .slice(0, 6)
      .map((rdv) => ({
        ...rdv,
        patientNom: patientsMap.get(rdv.patient_id) ?? 'Patient inconnu',
        medecinNom: medecinsMap.get(rdv.medecin_id) ?? 'Medecin inconnu'
      }));
  });

  constructor(
    private readonly patientsService: PatientsService,
    private readonly medecinsService: MedecinsService,
    private readonly rendezVousService: RendezVousService,
    private readonly consultationsService: ConsultationsService
  ) {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      patients: this.patientsService.list(),
      medecins: this.medecinsService.list(),
      rendezVous: this.rendezVousService.list(),
      consultations: this.consultationsService.list()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ patients, medecins, rendezVous, consultations }) => {
          this.patients.set(patients);
          this.medecins.set(medecins);
          this.rendezVous.set(rendezVous);
          this.consultations.set(consultations);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message || 'Erreur lors du chargement du tableau de bord.');
        }
      });
  }

  private formatDateLong(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }
}
