import { Injectable } from '@angular/core';
import { DEMO_MEDECINS } from '../data/demo-data';
import type { Medecin } from '../models/medecin.model';
import { MockCrudService } from './mock-crud.service';

@Injectable({ providedIn: 'root' })
export class MedecinsService extends MockCrudService<Medecin> {
  constructor() {
    super(DEMO_MEDECINS, 'Le medecin');
  }
}
