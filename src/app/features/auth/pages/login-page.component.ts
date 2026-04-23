import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loadingState = false;
  errorMessage = '';

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    mot_de_passe: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly demoAccounts = [
    { role: 'Administrateur', email: 'admin@senclinic.sn', mot_de_passe: 'admin123' },
    { role: 'Medecin', email: 'medecin@senclinic.sn', mot_de_passe: 'medecin123' },
    { role: 'Secretaire', email: 'secretaire@senclinic.sn', mot_de_passe: 'secretaire123' }
  ];

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/tableau-de-bord']);
    }
  }

  useDemoAccount(email: string, motDePasse: string): void {
    this.form.patchValue({ email, mot_de_passe: motDePasse });
    this.errorMessage = '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loadingState = true;
    this.errorMessage = '';

    const formValue = this.form.getRawValue();

    this.authService
      .login(formValue.email, formValue.mot_de_passe)
      .pipe(finalize(() => (this.loadingState = false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/tableau-de-bord']);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        }
      });
  }
}
