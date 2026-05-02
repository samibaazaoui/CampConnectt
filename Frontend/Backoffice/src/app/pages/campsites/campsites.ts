import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CampsiteService } from '../../services/campsite';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-campsites',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './campsites.html',
  styles: [`
    .campsite-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
      margin-top: 2.5rem;
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

    .form-input {
      width: 100%;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      color: white;
      font-size: 0.9375rem;
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary);
      background: rgba(30, 41, 59, 0.8);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
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

    /* Existing Card Styles */
    .campsite-card {
      position: relative;
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .campsite-card:hover {
      transform: translateY(-8px);
      border-color: var(--primary);
      box-shadow: 0 10px 40px -10px var(--primary-glow);
    }

    .card-visual {
      width: 100%;
      height: 200px;
      position: relative;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .card-visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .campsite-card:hover .card-visual img {
      transform: scale(1.1);
    }

    .card-visual i {
      font-size: 4rem;
      color: rgba(255, 255, 255, 0.05);
      transition: all 0.4s ease;
      position: absolute;
    }

    .campsite-card:hover .card-visual i {
      color: var(--primary-glow);
      transform: scale(1.1) rotate(-5deg);
    }

    .card-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-full);
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .card-body {
      padding: 1.5rem;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.5rem;
    }

    .card-location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.25rem;
      border-top: 1px solid var(--glass-border);
    }

    .price-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }

    .price-label {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-left: 0.25rem;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: var(--primary);
      color: white;
    }

    .btn-delete:hover {
      background: var(--danger);
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1rem;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
      padding: 0.8rem 1.8rem;
      border-radius: var(--radius-md);
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: var(--shadow-glow);
    }

    .btn-primary:hover {
      background: var(--primary-hover);
      transform: scale(1.02);
    }
    .btn-cancel:hover { background: var(--danger); }

    .card-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.4rem 0.8rem;
      border-radius: var(--radius-sm);
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .card-badge.pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
    .card-badge.approved { background: rgba(16, 185, 129, 0.2); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
    .card-badge.cancelled { background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
  `]
})
export class CampsitesComponent implements OnInit {
  private campsiteService = inject(CampsiteService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  
  campsites = signal<any[]>([]);
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);
  uploadingImage = signal<boolean>(false);
  editingId = signal<number | null>(null);

  isAdmin = computed(() => this.authService.isAdmin());
  isOwner = computed(() => this.authService.isCampsiteOwner());
  
  campsiteForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    location: ['', [Validators.required]],
    capacity: [10, [Validators.required, Validators.min(1)]],
    nightlyPrice: [50, [Validators.required, Validators.min(0)]],
    imageUrl: ['']
  });

  ngOnInit() {
    this.loadCampsites();
  }

  loadCampsites() {
    this.loading.set(true);
    const obs = this.isAdmin() 
      ? this.campsiteService.findAllAdmin() 
      : this.campsiteService.findOwnerCampsites();

    obs.subscribe({
      next: (res) => {
        if (res && res.data) {
          this.campsites.set(res.data.content || (Array.isArray(res.data) ? res.data : []));
        } else if (Array.isArray(res)) {
          this.campsites.set(res);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading campsites:', err);
        this.loading.set(false);
      }
    });
  }

  approve(id: number) {
    this.campsiteService.approve(id).subscribe(() => this.loadCampsites());
  }

  cancel(id: number) {
    this.campsiteService.cancel(id).subscribe(() => this.loadCampsites());
  }

  openModal() {
    this.editingId.set(null);
    this.campsiteForm.reset({ capacity: 10, nightlyPrice: 50, imageUrl: '' });
    this.showModal.set(true);
  }

  openEditModal(item: any) {
    this.editingId.set(item.id);
    this.campsiteForm.patchValue({
      name: item.name,
      location: item.location,
      capacity: item.capacity,
      nightlyPrice: item.nightlyPrice,
      imageUrl: item.imageUrl || ''
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingImage.set(true);
      const formData = new FormData();
      formData.append('file', file);

      this.http.post<any>('http://localhost:8080/api/upload/image', formData).subscribe({
        next: (response) => {
          this.campsiteForm.patchValue({ imageUrl: response.data });
          this.uploadingImage.set(false);
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.uploadingImage.set(false);
        }
      });
    }
  }

  onSubmit() {
    if (this.campsiteForm.valid) {
      const payload = this.campsiteForm.value;
      const id = this.editingId();
      
      const request = id 
        ? this.campsiteService.update(id, payload)
        : this.campsiteService.create(payload);

      request.subscribe({
        next: () => {
          this.loadCampsites();
          this.closeModal();
        },
        error: (err) => console.error('Error saving campsite:', err)
      });
    }
  }

  deleteCampsite(id: number) {
    if (confirm('Are you sure you want to delete this campsite?')) {
      this.campsiteService.delete(id).subscribe(() => {
        this.loadCampsites();
      });
    }
  }
}

