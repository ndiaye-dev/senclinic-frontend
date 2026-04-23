import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import type { UserRole } from './core/models/auth.model';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tableau-de-bord'
      },
      {
        path: 'tableau-de-bord',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
      },
      {
        path: 'patients',
        loadChildren: () => import('./features/patients/patients.routes').then((m) => m.PATIENTS_ROUTES)
      },
      {
        path: 'rendez-vous',
        loadChildren: () => import('./features/rendez-vous/rendez-vous.routes').then((m) => m.RENDEZ_VOUS_ROUTES)
      },
      {
        path: 'consultations',
        loadChildren: () => import('./features/consultations/consultations.routes').then((m) => m.CONSULTATIONS_ROUTES)
      },
      {
        path: 'medecins',
        loadChildren: () => import('./features/medecins/medecins.routes').then((m) => m.MEDECINS_ROUTES)
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard],
        data: { roles: ['administrateur'] as UserRole[] },
        loadChildren: () => import('./features/utilisateurs/utilisateurs.routes').then((m) => m.UTILISATEURS_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
