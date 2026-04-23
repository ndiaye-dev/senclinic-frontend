import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import type { UserRole } from '../../../core/models/auth.model';
import type { Utilisateur } from '../../../core/models/utilisateur.model';
import { UtilisateursService } from '../../../core/services/utilisateurs.service';

@Component({
  selector: 'app-utilisateurs-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './utilisateurs-page.component.html',
  styleUrl: './utilisateurs-page.component.scss'
})
export class UtilisateursPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly utilisateursService = inject(UtilisateursService);

  readonly utilisateurs = signal<Utilisateur[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly searchTerm = signal('');
  readonly roleFilter = signal<'tous' | UserRole>('tous');
  readonly statutFilter = signal<'tous' | Utilisateur['statut']>('tous');
  readonly currentPage = signal(1);
  readonly pageSize = 6;

  readonly form = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['secretaire' as UserRole, Validators.required],
    telephone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s]{9,18}$/)]],
    statut: ['actif' as Utilisateur['statut'], Validators.required],
    mot_de_passe: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly filteredUtilisateurs = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const role = this.roleFilter();
    const statut = this.statutFilter();

    return this.utilisateurs().filter((user) => {
      const searchText = `${user.nom} ${user.prenom} ${user.email}`.toLowerCase();
      const searchMatch = !term || searchText.includes(term);
      const roleMatch = role === 'tous' || user.role === role;
      const statutMatch = statut === 'tous' || user.statut === statut;
      return searchMatch && roleMatch && statutMatch;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredUtilisateurs().length / this.pageSize)));

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1)
  );

  readonly paginatedUtilisateurs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredUtilisateurs().slice(start, start + this.pageSize);
  });

  constructor() {
    effect(() => {
      const total = this.totalPages();
      if (this.currentPage() > total) {
        this.currentPage.set(total);
      }
    });

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.utilisateursService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => this.utilisateurs.set(users),
        error: (error: Error) => this.errorMessage.set(error.message || 'Chargement des utilisateurs impossible.')
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  onRoleFilter(value: string): void {
    this.roleFilter.set(value as 'tous' | UserRole);
    this.currentPage.set(1);
  }

  onStatutFilter(value: string): void {
    this.statutFilter.set(value as 'tous' | Utilisateur['statut']);
    this.currentPage.set(1);
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({
      nom: '',
      prenom: '',
      email: '',
      role: 'secretaire',
      telephone: '',
      statut: 'actif',
      mot_de_passe: ''
    });
    this.showForm.set(true);
  }

  openEditForm(user: Utilisateur): void {
    this.editingId.set(user.id);
    this.form.setValue({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      telephone: user.telephone,
      statut: user.statut,
      mot_de_passe: user.mot_de_passe
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
      ? this.utilisateursService.update(id, payload)
      : this.utilisateursService.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.cancelForm();
        this.loadUsers();
      },
      error: (error: Error) => this.errorMessage.set(error.message || 'Sauvegarde impossible.')
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Supprimer cet utilisateur ?')) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.utilisateursService
      .delete(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.loadUsers(),
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
