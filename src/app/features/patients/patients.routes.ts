import { Routes } from '@angular/router';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/patients-page.component').then((m) => m.PatientsPageComponent)
  }
];
