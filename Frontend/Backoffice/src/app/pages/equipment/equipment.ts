import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { EquipmentService } from '../../services/equipment';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-equipment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './equipment.html',
  styles: [`
    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
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

    .form-input, .form-textarea {
      width: 100%;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      color: white;
      font-size: 0.9375rem;
      transition: all 0.2s;
    }
    
    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-input:focus, .form-textarea:focus {
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
    .equipment-card {
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .equipment-card:hover {
      transform: scale(1.02);
      border-color: var(--primary);
      background: rgba(255, 255, 255, 0.08);
    }

    .card-icon-container {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, hsla(var(--p-h), var(--p-s), 64%, 0.1), transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      font-size: 1.5rem;
      border: 1px solid var(--primary-glow);
      overflow: hidden;
    }

    .card-icon-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .stock-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-stock {
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
    }

    .status-low { color: var(--danger); font-weight: 800; }

    .item-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
    }

    .item-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
      min-height: 2.6rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--glass-border);
    }

    .unit-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      color: var(--text-dim);
      background: rgba(255,255,255,0.03);
    }

    .btn-action:hover { color: white; background: var(--primary); }
    .btn-delete:hover { background: var(--danger); }

    .header-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
    }

    .btn-new {
      background: var(--primary);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-md);
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-cancel:hover { background: var(--danger); color: white; }

    .status-badge {
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .status-badge.pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .status-badge.approved { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .status-badge.cancelled { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
  `]
})
export class EquipmentComponent implements OnInit {
  private equipmentService = inject(EquipmentService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  
  equipment = signal<any[]>([]);
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);
  uploadingImage = signal<boolean>(false);
  editingId = signal<number | null>(null);

  isAdmin = computed(() => this.authService.isAdmin());
  isOwner = computed(() => this.authService.isEquipmentOwner());
  
  equipmentForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    quantityInStock: [10, [Validators.required, Validators.min(0)]],
    unitPrice: [15, [Validators.required, Validators.min(0)]],
    imageUrl: ['']
  });

  ngOnInit() {
    this.loadEquipment();
  }

  loadEquipment() {
    this.loading.set(true);
    const obs = this.isAdmin() 
      ? this.equipmentService.findAllAdmin() 
      : this.equipmentService.findOwnerEquipment();

    obs.subscribe({
      next: (res) => {
        if (res && res.data) {
          this.equipment.set(res.data.content || (Array.isArray(res.data) ? res.data : []));
        } else if (Array.isArray(res)) {
          this.equipment.set(res);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading equipment:', err);
        this.loading.set(false);
      }
    });
  }

  approve(id: number) {
    this.equipmentService.approve(id).subscribe(() => this.loadEquipment());
  }

  cancel(id: number) {
    this.equipmentService.cancel(id).subscribe(() => this.loadEquipment());
  }

  openModal() {
    this.editingId.set(null);
    this.equipmentForm.reset({ quantityInStock: 10, unitPrice: 15, imageUrl: '' });
    this.showModal.set(true);
  }

  openEditModal(item: any) {
    this.editingId.set(item.id);
    this.equipmentForm.patchValue({
      name: item.name,
      description: item.description,
      quantityInStock: item.quantityInStock,
      unitPrice: item.unitPrice,
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
          this.equipmentForm.patchValue({ imageUrl: response.data });
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
    if (this.equipmentForm.valid) {
      const payload = this.equipmentForm.value;
      const id = this.editingId();
      
      const request = id
        ? this.equipmentService.update(id, payload)
        : this.equipmentService.create(payload);

      request.subscribe({
        next: () => {
          this.loadEquipment();
          this.closeModal();
        },
        error: (err) => console.error('Error saving equipment:', err)
      });
    }
  }

  deleteEquipment(id: number) {
    if (confirm('Delete this item from inventory?')) {
      this.equipmentService.delete(id).subscribe(() => this.loadEquipment());
    }
  }
}
