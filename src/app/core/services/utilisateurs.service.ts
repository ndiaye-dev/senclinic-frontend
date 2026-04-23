import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { DEMO_UTILISATEURS } from '../data/demo-data';
import type { Utilisateur } from '../models/utilisateur.model';
import { MockCrudService } from './mock-crud.service';

@Injectable({ providedIn: 'root' })
export class UtilisateursService extends MockCrudService<Utilisateur> {
  constructor() {
    super(DEMO_UTILISATEURS, `L'utilisateur`);
  }

  findByCredentials(email: string, motDePasse: string): Observable<Utilisateur | null> {
    const foundUser = this
      .getSnapshot()
      .find((user) => user.email.toLowerCase() === email.toLowerCase() && user.mot_de_passe === motDePasse);

    return of(foundUser ? { ...foundUser } : null).pipe(delay(200));
  }
}
