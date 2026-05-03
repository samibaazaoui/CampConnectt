import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styles: [`
    .user-directory {
      margin-top: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.85);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .modal-container {
      background: var(--bg-surface);
      width: 100%;
      max-width: 540px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--glass-border);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }

    .modal-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--glass-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.02);
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.02em;
    }

    .modal-body {
      padding: 2rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-dim);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-input, .form-textarea, .form-select {
      width: 100%;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      color: white;
      font-size: 0.9375rem;
      transition: all 0.2s;
    }
    
    .form-select option { margin: 40px; background: var(--bg-surface); color: white; }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--primary);
      background: rgba(30, 41, 59, 0.8);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }

    .modal-footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid var(--glass-border);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.02);
    }

    .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-secondary:hover { color: white; background: rgba(255, 255, 255, 0.05); }

    .btn-submit {
      background: var(--primary);
      color: white;
      padding: 0.75rem 2rem;
      border-radius: var(--radius-md);
      font-weight: 700;
      box-shadow: var(--shadow-glow);
    }

    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .user-row {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      gap: 2rem;
      padding: 1.25rem 2rem;
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      transition: all 0.3s ease;
    }

    .user-row:hover {
      transform: translateX(10px);
      border-color: var(--primary);
      background: rgba(255, 255, 255, 0.08);
    }

    .user-identity {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1rem;
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .user-meta h4 {
      font-size: 1rem;
      color: white;
      margin-bottom: 0.125rem;
    }

    .user-meta span {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .role-capsule {
      padding: 0.4rem 1rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
    }

    .role-admin {
      color: var(--primary);
      border-color: var(--primary-glow);
      background: hsla(var(--p-h), var(--p-s), 64%, 0.1);
    }

    .row-actions {
      display: flex;
      gap: 0.75rem;
    }

    .action-circle {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.03);
      color: var(--text-dim);
      transition: all 0.2s;
    }

    .action-circle:hover {
      background: var(--primary);
      color: white;
    }

    .btn-del:hover { background: var(--danger); }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1rem;
    }
  `]
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  
  users = signal<any[]>([]);
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);
  editingId = signal<number | null>(null);

  userForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['USER', [Validators.required]]
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.findAll().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.users.set(Array.isArray(res.data) ? res.data : (res.data.content || []));
        } else if (Array.isArray(res)) {
          this.users.set(res);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading.set(false);
      }
    });
  }

  openEditModal(item: any) {
    this.editingId.set(item.id);
    this.userForm.patchValue({
      fullName: item.fullName,
      email: item.email,
      role: item.role,
      password: '' // Keep empty to prevent overriding accidentally
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.userForm.valid) {
      const payload = this.userForm.value;
      const id = this.editingId();
      
      // We only allow updates via this form in Backoffice since Creation happens on front page
      if (id) {
        this.userService.update(id, payload).subscribe({
          next: () => {
            this.loadUsers();
            this.closeModal();
          },
          error: (err) => console.error('Error updating user:', err)
        });
      }
    }
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  deleteUser(id: number) {
    if (confirm('Delete this user account permanently?')) {
      this.userService.delete(id).subscribe(() => this.loadUsers());
    }
  }
}

