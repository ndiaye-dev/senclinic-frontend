import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import type { Medecin } from '../../../core/models/medecin.model';
import { MedecinsService } from '../../../core/services/medecins.service';

@Component({
  selector: 'app-medecins-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medecins-page.component.html',
  styleUrl: './medecins-page.component.scss'
})
export class MedecinsPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly medecinsService = inject(MedecinsService);

  readonly medecins = signal<Medecin[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly searchTerm = signal('');
  readonly statutFilter = signal<'tous' | Medecin['statut']>('tous');
  readonly currentPage = signal(1);
  readonly pageSize = 6;

  readonly form = this.fb.group({
    numero_ordre: ['', [Validators.required, Validators.minLength(5)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    specialite: ['', [Validators.required, Validators.minLength(3)]],
    telephone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s]{9,18}$/)]],
    email: ['', [Validators.required, Validators.email]],
    statut: ['actif' as Medecin['statut'], Validators.required]
  });

  readonly filteredMedecins = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const statut = this.statutFilter();

    return this.medecins().filter((medecin) => {
      const searchableText = `${medecin.nom} ${medecin.prenom} ${medecin.specialite} ${medecin.numero_ordre}`.toLowerCase();
      const matchesSearch = !term || searchableText.includes(term);
      const matchesStatut = statut === 'tous' || medecin.statut === statut;
      return matchesSearch && matchesStatut;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredMedecins().length / this.pageSize)));

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  readonly paginatedMedecins = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredMedecins().slice(start, start + this.pageSize);
  });

  constructor() {
    effect(() => {
      const total = this.totalPages();
      if (this.currentPage() > total) {
        this.currentPage.set(total);
      }
    });

    this.loadMedecins();
  }

  loadMedecins(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.medecinsService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (medecins) => this.medecins.set(medecins),
        error: (error: Error) => this.errorMessage.set(error.message || 'Impossible de charger les medecins.')
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onFilterChange(value: string): void {
    this.statutFilter.set(value as 'tous' | Medecin['statut']);
    this.currentPage.set(1);
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({
      numero_ordre: '',
      nom: '',
      prenom: '',
      specialite: '',
      telephone: '',
      email: '',
      statut: 'actif'
    });
    this.showForm.set(true);
  }

  openEditForm(medecin: Medecin): void {
    this.editingId.set(medecin.id);
    this.form.setValue({
      numero_ordre: medecin.numero_ordre,
      nom: medecin.nom,
      prenom: medecin.prenom,
      specialite: medecin.specialite,
      telephone: medecin.telephone,
      email: medecin.email,
      statut: medecin.statut
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset({
      numero_ordre: '',
      nom: '',
      prenom: '',
      specialite: '',
      telephone: '',
      email: '',
      statut: 'actif'
    });
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
      ? this.medecinsService.update(id, payload)
      : this.medecinsService.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.cancelForm();
        this.loadMedecins();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message || 'Echec lors de la sauvegarde du medecin.');
      }
    });
  }

  deleteMedecin(id: number): void {
    const confirmed = confirm('Voulez-vous supprimer ce medecin ?');
    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.medecinsService
      .delete(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.loadMedecins(),
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
