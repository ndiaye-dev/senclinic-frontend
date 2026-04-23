import { Routes } from '@angular/router';

export const MEDECINS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/medecins-page.component').then((m) => m.MedecinsPageComponent)
  }
];
