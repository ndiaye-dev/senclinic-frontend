import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import type { Medecin } from '../../../core/models/medecin.model';
import type { Patient } from '../../../core/models/patient.model';
import type { RendezVous } from '../../../core/models/rendez-vous.model';
import { MedecinsService } from '../../../core/services/medecins.service';
import { PatientsService } from '../../../core/services/patients.service';
import { RendezVousService } from '../../../core/services/rendez-vous.service';

@Component({
  selector: 'app-rendez-vous-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rendez-vous-page.component.html',
  styleUrl: './rendez-vous-page.component.scss'
})
export class RendezVousPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly rendezVousService = inject(RendezVousService);
  private readonly patientsService = inject(PatientsService);
  private readonly medecinsService = inject(MedecinsService);

  readonly rendezVous = signal<RendezVous[]>([]);
  readonly patients = signal<Patient[]>([]);
  readonly medecins = signal<Medecin[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly searchTerm = signal('');
  readonly statutFilter = signal<'tous' | RendezVous['statut']>('tous');
  readonly currentPage = signal(1);
  readonly pageSize = 6;

  readonly form = this.fb.group({
    patient_id: [1, [Validators.required, Validators.min(1)]],
    medecin_id: [1, [Validators.required, Validators.min(1)]],
    date_rdv: ['', Validators.required],
    heure_rdv: ['', Validators.required],
    motif: ['', [Validators.required, Validators.minLength(4)]],
    statut: ['planifie' as RendezVous['statut'], Validators.required]
  });

  readonly filteredRendezVous = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const statut = this.statutFilter();

    return this.rendezVous().filter((item) => {
      const patientNom = this.getPatientNom(item.patient_id).toLowerCase();
      const medecinNom = this.getMedecinNom(item.medecin_id).toLowerCase();
      const searchText = `${item.motif} ${patientNom} ${medecinNom} ${item.date_rdv}`.toLowerCase();
      const matchesSearch = !term || searchText.includes(term);
      const matchesStatut = statut === 'tous' || item.statut === statut;
      return matchesSearch && matchesStatut;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRendezVous().length / this.pageSize)));

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  readonly paginatedRendezVous = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredRendezVous().slice(start, start + this.pageSize);
  });

  constructor() {
    effect(() => {
      const total = this.totalPages();
      if (this.currentPage() > total) {
        this.currentPage.set(total);
      }
    });

    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      rendezVous: this.rendezVousService.list(),
      patients: this.patientsService.list(),
      medecins: this.medecinsService.list()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ rendezVous, patients, medecins }) => {
          this.rendezVous.set(rendezVous);
          this.patients.set(patients);
          this.medecins.set(medecins);

          this.form.controls.patient_id.setValue(patients[0]?.id ?? 1);
          this.form.controls.medecin_id.setValue(medecins[0]?.id ?? 1);
        },
        error: (error: Error) => this.errorMessage.set(error.message || 'Impossible de charger les rendez-vous.')
      });
  }

  getPatientNom(id: number): string {
    const patient = this.patients().find((item) => item.id === id);
    return patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu';
  }

  getMedecinNom(id: number): string {
    const medecin = this.medecins().find((item) => item.id === id);
    return medecin ? `Dr ${medecin.prenom} ${medecin.nom}` : 'Medecin inconnu';
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onFilterChange(value: string): void {
    this.statutFilter.set(value as 'tous' | RendezVous['statut']);
    this.currentPage.set(1);
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({
      patient_id: this.patients()[0]?.id ?? 1,
      medecin_id: this.medecins()[0]?.id ?? 1,
      date_rdv: '',
      heure_rdv: '',
      motif: '',
      statut: 'planifie'
    });
    this.showForm.set(true);
  }

  openEditForm(item: RendezVous): void {
    this.editingId.set(item.id);
    this.form.setValue({
      patient_id: item.patient_id,
      medecin_id: item.medecin_id,
      date_rdv: item.date_rdv,
      heure_rdv: item.heure_rdv,
      motif: item.motif,
      statut: item.statut
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const payload = this.form.getRawValue();
    const id = this.editingId();
    const request$ = id ? this.rendezVousService.update(id, payload) : this.rendezVousService.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.cancelForm();
        this.loadData();
      },
      error: (error: Error) => this.errorMessage.set(error.message || 'Echec de la sauvegarde du rendez-vous.')
    });
  }

  deleteRendezVous(id: number): void {
    if (!confirm('Supprimer ce rendez-vous ?')) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.rendezVousService
      .delete(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.loadData(),
        error: (error: Error) => this.errorMessage.set(error.message || 'Suppression impossible.')
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }
}
