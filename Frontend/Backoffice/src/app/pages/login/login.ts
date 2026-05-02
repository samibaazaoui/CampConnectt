import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, #6366f1, #020617 40%);
    }

    .login-card {
      width: 420px;
      padding: 2.5rem;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header i {
      font-size: 2.5rem;
      color: var(--primary-color);
      margin-bottom: 1rem;
    }

    .login-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      transition: all 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--primary-color);
      background: rgba(255, 255, 255, 0.1);
    }

    .btn-login {
      width: 100%;
      padding: 0.875rem;
      border-radius: 0.75rem;
      background: var(--primary-color);
      color: white;
      font-weight: 600;
      margin-top: 1rem;
      transition: all 0.2s;
    }

    .btn-login:hover {
      background: var(--primary-hover);
      transform: translateY(-2px);
    }

    .error-msg {
      padding: 0.75rem;
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      border-radius: 0.75rem;
      margin-bottom: 1rem;
      text-align: center;
      font-size: 0.875rem;
    }

    .toggle-mode {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .toggle-mode a {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 700;
      transition: color 0.2s;
    }

    .toggle-mode a:hover {
      color: white;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  isRegisterMode = false;
  credentials = { email: '', password: '', fullName: '', confirmPassword: '', role: 'USER' };
  error: string | null = null;
  loading = false;

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.error = null;
    this.credentials = { email: '', password: '', fullName: '', confirmPassword: '', role: 'USER' };
  }

  onSubmit() {
    this.error = null;

    if (this.isRegisterMode) {
      if (this.credentials.password !== this.credentials.confirmPassword) {
        this.error = 'Passwords do not match';
        return;
      }
    }
    
    this.loading = true;

    if (this.isRegisterMode) {
      // Registration Branch
      const payload = {
        email: this.credentials.email,
        password: this.credentials.password,
        fullName: this.credentials.fullName,
        role: this.credentials.role
      };

      this.authService.register(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate(['/']);
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Registration failed. Email might already exist.';
          this.loading = false;
        }
      });
    } else {
      // Login Branch
      this.authService.login({ email: this.credentials.email, password: this.credentials.password }).subscribe({
        next: (res) => {
          if (res.success) {
            const role = res.data.user.role;
            if (role === 'ADMIN' || role === 'CAMPSITE_OWNER' || role === 'EQUIPMENT_OWNER') {
              this.router.navigate(['/admin/dashboard']);
            } else {
              this.router.navigate(['/']);
            }
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Invalid email or password';
          this.loading = false;
        }
      });
    }
  }
}
