import { Injectable } from '@angular/core';
import { DEMO_CONSULTATIONS } from '../data/demo-data';
import type { Consultation } from '../models/consultation.model';
import { MockCrudService } from './mock-crud.service';

@Injectable({ providedIn: 'root' })
export class ConsultationsService extends MockCrudService<Consultation> {
  constructor() {
    super(DEMO_CONSULTATIONS, 'La consultation');
  }
}
