import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

interface MenuItem {
  label: string;
  path: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly sidebarOpen = signal(false);
  readonly currentUser = this.authService.currentUser;
  readonly now = signal(new Date());
  readonly globalSearch = signal('');

  readonly displayDate = computed(() =>
    new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    }).format(this.now())
  );

  readonly displayTime = computed(() =>
    new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(this.now())
  );

  readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return 'SC';
    }

    return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  });

  readonly roleLabel = computed(() => {
    const role = this.currentUser()?.role;

    if (role === 'administrateur') {
      return 'Administrateur';
    }

    if (role === 'medecin') {
      return 'Medecin';
    }

    if (role === 'secretaire') {
      return 'Secretaire';
    }

    return 'Utilisateur';
  });

  private readonly menuItems: MenuItem[] = [
    { label: 'Tableau de bord', path: '/tableau-de-bord' },
    { label: 'Patients', path: '/patients' },
    { label: 'Rendez-vous', path: '/rendez-vous' },
    { label: 'Consultations', path: '/consultations' },
    { label: 'Medecins', path: '/medecins' },
    { label: 'Gestion Utilisateurs', path: '/utilisateurs', roles: ['administrateur'] }
  ];

  readonly visibleMenuItems = computed(() => {
    const role = this.currentUser()?.role;

    return this.menuItems.filter((item) => {
      if (!item.roles || !role) {
        return !item.roles;
      }

      return item.roles.includes(role);
    });
  });

  constructor() {
    const timerId = window.setInterval(() => {
      this.now.set(new Date());
    }, 60000);

    this.destroyRef.onDestroy(() => window.clearInterval(timerId));
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  updateGlobalSearch(value: string): void {
    this.globalSearch.set(value);
  }

  goToSearchTarget(event: Event): void {
    event.preventDefault();

    const search = this.globalSearch().trim().toLowerCase();

    if (search.includes('rdv') || search.includes('rendez')) {
      this.router.navigate(['/rendez-vous']);
      return;
    }

    if (search.includes('consult')) {
      this.router.navigate(['/consultations']);
      return;
    }

    if (search.includes('medec')) {
      this.router.navigate(['/medecins']);
      return;
    }

    if (search.includes('utilisateur') || search.includes('user')) {
      this.router.navigate(['/utilisateurs']);
      return;
    }

    if (search.includes('tableau') || search.includes('dashboard')) {
      this.router.navigate(['/tableau-de-bord']);
      return;
    }

    this.router.navigate(['/patients']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
