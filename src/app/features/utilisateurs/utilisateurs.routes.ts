import { Routes } from '@angular/router';

export const UTILISATEURS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/utilisateurs-page.component').then((m) => m.UtilisateursPageComponent)
  }
];
