import { Routes } from '@angular/router';

export const RENDEZ_VOUS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/rendez-vous-page.component').then((m) => m.RendezVousPageComponent)
  }
];
