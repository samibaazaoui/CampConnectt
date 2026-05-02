import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivityService } from '../../services/activity';
import { EventService } from '../../services/event';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './activities.html',
  styles: [`
    .activities-grid {
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

    .activity-card {
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
      display: flex;
      flex-direction: column;
    }

    .activity-card:hover {
      transform: translateY(-8px);
      border-color: var(--primary);
      box-shadow: 0 10px 40px -10px var(--primary-glow);
    }

    .activity-visual {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
      position: relative;
    }

    .visual-icon {
      font-size: 3rem;
      color: var(--primary);
      filter: drop-shadow(0 0 10px var(--primary-glow));
    }

    .activity-body {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .activity-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.5rem;
    }

    .activity-description {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 1.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .activity-meta {
      display: flex;
      gap: 1rem;
      margin-top: auto;
      padding-top: 1.25rem;
      border-top: 1px solid var(--glass-border);
      align-items: center;
      justify-content: space-between;
    }

    .activity-price {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--primary);
    }

    .activity-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.03);
      color: var(--text-dim);
    }

    .action-btn:hover { background: var(--primary); color: white; }
    .btn-rem:hover { background: var(--danger); }

    .header-group {
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
  `]
})
export class ActivitiesComponent implements OnInit {
  private activityService = inject(ActivityService);
  private fb = inject(FormBuilder);
  
  activities = signal<any[]>([]);
  eventsSet = signal<any[]>([]);
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);
  editingId = signal<number | null>(null);

  activityForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    eventId: [null, [Validators.required]]
  });

  private eventService = inject(EventService);

  ngOnInit() {
    this.loadActivities();
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.findAll().subscribe({
      next: (res) => {
        const evs = res?.data?.content || (Array.isArray(res?.data) ? res?.data : []);
        this.eventsSet.set(evs);
      }
    });
  }

  loadActivities() {
    this.loading.set(true);
    this.activityService.findAll().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.activities.set(res.data.content || (Array.isArray(res.data) ? res.data : []));
        } else if (Array.isArray(res)) {
          this.activities.set(res);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading activities:', err);
        this.loading.set(false);
      }
    });
  }

  openModal() {
    this.editingId.set(null);
    this.activityForm.reset();
    this.showModal.set(true);
  }

  openEditModal(item: any) {
    this.editingId.set(item.id);
    this.activityForm.patchValue({
      name: item.name,
      description: item.description,
      eventId: item.eventId
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.activityForm.valid) {
      const payload = this.activityForm.value;
      const id = this.editingId();
      
      const request = id 
        ? this.activityService.update(id, payload)
        : this.activityService.create(payload);

      request.subscribe({
        next: () => {
          this.loadActivities();
          this.closeModal();
        },
        error: (err) => console.error('Error saving activity:', err)
      });
    }
  }

  deleteActivity(id: number) {
    if (confirm('Permanently remove this activity from the catalog?')) {
      this.activityService.delete(id).subscribe(() => this.loadActivities());
    }
  }
}
