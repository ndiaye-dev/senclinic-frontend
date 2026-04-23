import { Injectable } from '@angular/core';
import { DEMO_RENDEZ_VOUS } from '../data/demo-data';
import type { RendezVous } from '../models/rendez-vous.model';
import { MockCrudService } from './mock-crud.service';

@Injectable({ providedIn: 'root' })
export class RendezVousService extends MockCrudService<RendezVous> {
  constructor() {
    super(DEMO_RENDEZ_VOUS, 'Le rendez-vous');
  }
}
