import { Injectable } from '@angular/core';
import { DEMO_PATIENTS } from '../data/demo-data';
import type { Patient } from '../models/patient.model';
import { MockCrudService } from './mock-crud.service';

@Injectable({ providedIn: 'root' })
export class PatientsService extends MockCrudService<Patient> {
  constructor() {
    super(DEMO_PATIENTS, 'Le patient');
  }
}
