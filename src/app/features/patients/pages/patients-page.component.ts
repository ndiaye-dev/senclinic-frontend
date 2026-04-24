import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import type { Medecin } from '../../../core/models/medecin.model';
import type { Patient } from '../../../core/models/patient.model';
import { MedecinsService } from '../../../core/services/medecins.service';
import { PatientsService } from '../../../core/services/patients.service';

@Component({
  selector: 'app-patients-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.scss'
})
export class PatientsPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly patientsService = inject(PatientsService);
  private readonly medecinsService = inject(MedecinsService);

  readonly patients = signal<Patient[]>([]);
  readonly medecins = signal<Medecin[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly submitAttempted = signal(false);

  readonly searchTerm = signal('');
  readonly sexeFilter = signal<'tous' | Patient['sexe']>('tous');
  readonly statutFilter = signal<'tous' | Patient['statut']>('tous');
  readonly currentPage = signal(1);
  readonly pageSize = 5;

  readonly form = this.fb.group({
    numero_dossier: ['', [Validators.required, Validators.minLength(4)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    date_naissance: ['', Validators.required],
    sexe: ['Homme' as Patient['sexe'], Validators.required],
    groupe_sanguin: ['O+'],
    poids: [60, [Validators.min(1), Validators.max(300)]],
    telephone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{9,18}$/)]],
    adresse: ['', [Validators.minLength(5)]],
    email: ['', [Validators.email]],
    numero_securite_sociale: ['', [Validators.minLength(8)]],
    allergies: ['Aucune'],
    antecedents_medicaux: ['Aucun'],
    traitements_cours: ['Aucun'],
    medecin_traitant: [1, [Validators.required, Validators.min(1)]],
    statut: ['actif' as Patient['statut'], Validators.required]
  });

  readonly filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sexe = this.sexeFilter();
    const statut = this.statutFilter();

    return this.patients().filter((patient) => {
      const searchableText = `${patient.numero_dossier} ${patient.nom} ${patient.prenom} ${patient.telephone}`.toLowerCase();
      const searchMatch = !term || searchableText.includes(term);
      const sexeMatch = sexe === 'tous' || patient.sexe === sexe;
      const statutMatch = statut === 'tous' || patient.statut === statut;
      return searchMatch && sexeMatch && statutMatch;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredPatients().length / this.pageSize)));

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  readonly paginatedPatients = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredPatients().slice(start, start + this.pageSize);
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
      patients: this.patientsService.list(),
      medecins: this.medecinsService.list()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ patients, medecins }) => {
          this.patients.set(patients);
          this.medecins.set(medecins);

          if (!medecins.some((medecin) => medecin.id === this.form.controls.medecin_traitant.value)) {
            this.form.controls.medecin_traitant.setValue(medecins[0]?.id ?? 1);
          }
        },
        error: (error: Error) => this.errorMessage.set(error.message || 'Chargement des patients impossible.')
      });
  }

  getMedecinNom(id: number): string {
    const medecin = this.medecins().find((item) => item.id === id);
    return medecin ? `Dr ${medecin.prenom} ${medecin.nom}` : 'Non assigne';
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onSexeFilter(value: string): void {
    this.sexeFilter.set(value as 'tous' | Patient['sexe']);
    this.currentPage.set(1);
  }

  onStatutFilter(value: string): void {
    this.statutFilter.set(value as 'tous' | Patient['statut']);
    this.currentPage.set(1);
  }

  openCreateForm(): void {
    this.submitAttempted.set(false);
    this.editingId.set(null);
    this.form.reset({
      numero_dossier: '',
      nom: '',
      prenom: '',
      date_naissance: '',
      sexe: 'Homme',
      groupe_sanguin: 'O+',
      poids: 60,
      telephone: '',
      adresse: '',
      email: '',
      numero_securite_sociale: '',
      allergies: 'Aucune',
      antecedents_medicaux: 'Aucun',
      traitements_cours: 'Aucun',
      medecin_traitant: this.medecins()[0]?.id ?? 1,
      statut: 'actif'
    });
    this.showForm.set(true);
  }

  openEditForm(patient: Patient): void {
    this.submitAttempted.set(false);
    this.editingId.set(patient.id);
    this.form.setValue({
      numero_dossier: patient.numero_dossier,
      nom: patient.nom,
      prenom: patient.prenom,
      date_naissance: patient.date_naissance,
      sexe: patient.sexe,
      groupe_sanguin: patient.groupe_sanguin,
      poids: patient.poids,
      telephone: patient.telephone,
      adresse: patient.adresse,
      email: patient.email,
      numero_securite_sociale: patient.numero_securite_sociale,
      allergies: patient.allergies,
      antecedents_medicaux: patient.antecedents_medicaux,
      traitements_cours: patient.traitements_cours,
      medecin_traitant: patient.medecin_traitant,
      statut: patient.statut
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.submitAttempted.set(false);
    this.showForm.set(false);
    this.editingId.set(null);
  }

  submit(): void {
    this.submitAttempted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const payload = this.form.getRawValue();
    const id = this.editingId();
    const request$ = id ? this.patientsService.update(id, payload) : this.patientsService.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.submitAttempted.set(false);
        this.cancelForm();
        this.loadData();
      },
      error: (error: Error) => this.errorMessage.set(error.message || 'Erreur lors de la sauvegarde du patient.')
    });
  }

  deletePatient(id: number): void {
    if (!confirm('Confirmer la suppression du patient ?')) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.patientsService
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

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.touched || this.submitAttempted()));
  }

  getFieldError(controlName: string): string {
    const control = this.form.get(controlName);
    const errors = control?.errors;

    if (!errors) {
      return '';
    }

    if (errors['required']) {
      return 'Champ obligatoire.';
    }

    if (errors['email']) {
      return 'Format email invalide.';
    }

    if (errors['pattern']) {
      return 'Format invalide.';
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength']['requiredLength'];
      return `Minimum ${requiredLength} caracteres.`;
    }

    if (errors['min']) {
      return `Valeur minimale: ${errors['min']['min']}.`;
    }

    if (errors['max']) {
      return `Valeur maximale: ${errors['max']['max']}.`;
    }

    return 'Valeur invalide.';
  }
}
