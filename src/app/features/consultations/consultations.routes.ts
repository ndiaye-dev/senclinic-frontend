import { Routes } from '@angular/router';

export const CONSULTATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/consultations-page.component').then((m) => m.ConsultationsPageComponent)
  }
];
