import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import type { Consultation } from '../../../core/models/consultation.model';
import type { Medecin } from '../../../core/models/medecin.model';
import type { Patient } from '../../../core/models/patient.model';
import { ConsultationsService } from '../../../core/services/consultations.service';
import { MedecinsService } from '../../../core/services/medecins.service';
import { PatientsService } from '../../../core/services/patients.service';

@Component({
  selector: 'app-consultations-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultations-page.component.html',
  styleUrl: './consultations-page.component.scss'
})
export class ConsultationsPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly consultationsService = inject(ConsultationsService);
  private readonly patientsService = inject(PatientsService);
  private readonly medecinsService = inject(MedecinsService);

  readonly consultations = signal<Consultation[]>([]);
  readonly patients = signal<Patient[]>([]);
  readonly medecins = signal<Medecin[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly searchTerm = signal('');
  readonly certificatFilter = signal<'tous' | 'avec' | 'sans'>('tous');
  readonly currentPage = signal(1);
  readonly pageSize = 5;

  readonly form = this.fb.group({
    patient_id: [1, [Validators.required, Validators.min(1)]],
    medecin_id: [1, [Validators.required, Validators.min(1)]],
    date_consultation: ['', Validators.required],
    motif_consultation: ['', [Validators.required, Validators.minLength(4)]],
    symptomes: ['', [Validators.required, Validators.minLength(4)]],
    diagnostic: ['', [Validators.required, Validators.minLength(4)]],
    observations: ['', Validators.required],
    ordonnance: ['', Validators.required],
    certificat: [false]
  });

  readonly filteredConsultations = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const certificat = this.certificatFilter();

    return this.consultations().filter((consultation) => {
      const patientNom = this.getPatientNom(consultation.patient_id).toLowerCase();
      const medecinNom = this.getMedecinNom(consultation.medecin_id).toLowerCase();
      const searchText = `${consultation.motif_consultation} ${consultation.diagnostic} ${patientNom} ${medecinNom}`.toLowerCase();
      const matchSearch = !term || searchText.includes(term);
      const matchCertificat =
        certificat === 'tous' ||
        (certificat === 'avec' && consultation.certificat) ||
        (certificat === 'sans' && !consultation.certificat);
      return matchSearch && matchCertificat;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredConsultations().length / this.pageSize)));

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  readonly paginatedConsultations = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredConsultations().slice(start, start + this.pageSize);
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
      consultations: this.consultationsService.list(),
      patients: this.patientsService.list(),
      medecins: this.medecinsService.list()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ consultations, patients, medecins }) => {
          this.consultations.set(consultations);
          this.patients.set(patients);
          this.medecins.set(medecins);

          this.form.controls.patient_id.setValue(patients[0]?.id ?? 1);
          this.form.controls.medecin_id.setValue(medecins[0]?.id ?? 1);
        },
        error: (error: Error) => this.errorMessage.set(error.message || 'Chargement des consultations impossible.')
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

  onCertificatFilter(value: string): void {
    this.certificatFilter.set(value as 'tous' | 'avec' | 'sans');
    this.currentPage.set(1);
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({
      patient_id: this.patients()[0]?.id ?? 1,
      medecin_id: this.medecins()[0]?.id ?? 1,
      date_consultation: '',
      motif_consultation: '',
      symptomes: '',
      diagnostic: '',
      observations: '',
      ordonnance: '',
      certificat: false
    });
    this.showForm.set(true);
  }

  openEditForm(consultation: Consultation): void {
    this.editingId.set(consultation.id);
    this.form.setValue({
      patient_id: consultation.patient_id,
      medecin_id: consultation.medecin_id,
      date_consultation: consultation.date_consultation,
      motif_consultation: consultation.motif_consultation,
      symptomes: consultation.symptomes,
      diagnostic: consultation.diagnostic,
      observations: consultation.observations,
      ordonnance: consultation.ordonnance,
      certificat: consultation.certificat
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
    const request$ = id
      ? this.consultationsService.update(id, payload)
      : this.consultationsService.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.cancelForm();
        this.loadData();
      },
      error: (error: Error) => this.errorMessage.set(error.message || 'Sauvegarde impossible.')
    });
  }

  deleteConsultation(id: number): void {
    if (!confirm('Supprimer cette consultation ?')) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.consultationsService
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
