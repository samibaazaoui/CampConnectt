import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService } from '../../services/event';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './events.html',
  styles: [`
    .events-board {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
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

    .event-card {
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .event-card:hover {
      transform: translateY(-8px);
      border-color: var(--primary);
      box-shadow: 0 10px 40px -10px var(--primary-glow);
    }

    .event-visual {
      height: 120px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, hsla(var(--p-h), var(--p-s), 64%, 0.1), transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .event-visual i {
      font-size: 2.5rem;
      color: var(--primary);
      opacity: 0.8;
    }

    .event-meta-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .date-pill {
      padding: 0.35rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .event-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: white;
      margin: 0;
    }

    .event-location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .event-footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.25rem;
      border-top: 1px solid var(--glass-border);
    }

    .attendees {
      font-size: 0.8125rem;
      color: var(--text-dim);
      font-weight: 600;
    }

    .event-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.03);
      color: var(--text-muted);
    }

    .btn-action:hover {
      background: var(--primary);
      color: white;
    }

    .btn-delete:hover { background: var(--danger); }

    .header-panel {
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
export class EventsComponent implements OnInit {
  private eventService = inject(EventService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  
  events = signal<any[]>([]);
  loading = signal<boolean>(false);
  showModal = signal<boolean>(false);
  editingId = signal<number | null>(null);

  // Attendees Modal
  showParticipants = signal<boolean>(false);
  participants = signal<any[]>([]);
  activeEventTitle = signal<string>('');

  eventForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    location: ['', [Validators.required]],
    startAt: ['', [Validators.required]],
    endAt: ['', [Validators.required]]
  });

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading.set(true);
    this.eventService.findAll().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.events.set(res.data.content || (Array.isArray(res.data) ? res.data : []));
        } else if (Array.isArray(res)) {
          this.events.set(res);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.loading.set(false);
      }
    });
  }

  openModal() {
    this.editingId.set(null);
    this.eventForm.reset();
    this.showModal.set(true);
  }

  openEditModal(item: any) {
    this.editingId.set(item.id);
    this.eventForm.patchValue({
      title: item.title,
      description: item.description,
      location: item.location,
      startAt: item.startAt ? this.formatDateForInput(item.startAt) : '',
      endAt: item.endAt ? this.formatDateForInput(item.endAt) : ''
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  formatDateForInput(dateArr: any): string {
    if (Array.isArray(dateArr)) {
      // Backend returns [2026, 4, 15, 12, 0]
      const [y, m, d, h = 0, min = 0] = dateArr;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
    return dateArr;
  }

  formatDate(dateArr: any): string {
    if (Array.isArray(dateArr)) {
      return `${dateArr[0]}-${String(dateArr[1]).padStart(2, '0')}-${String(dateArr[2]).padStart(2, '0')}`;
    }
    return dateArr;
  }

  onSubmit() {
    if (this.eventForm.valid) {
      const userStr = localStorage.getItem('camp_user');
      const userId = userStr ? JSON.parse(userStr).id : null;
      
      const payload = {
        ...this.eventForm.value,
        createdById: userId
      };
      
      const id = this.editingId();
      
      const request = id 
        ? this.eventService.update(id, payload)
        : this.eventService.create(payload);

      request.subscribe({
        next: () => {
          this.loadEvents();
          this.closeModal();
        },
        error: (err) => console.error('Error saving event:', err)
      });
    }
  }

  deleteEvent(id: number) {
    if (confirm('Permanently cancel this community event?')) {
      this.eventService.delete(id).subscribe(() => this.loadEvents());
    }
  }

  viewAttendees(ev: any) {
    this.activeEventTitle.set(ev.title);
    this.participants.set([]);
    this.http.get(`http://localhost:8080/api/event-participations/event/${ev.id}`).subscribe({
      next: (res: any) => {
        this.participants.set(res?.data || []);
        this.showParticipants.set(true);
      },
      error: (err) => console.error('Failed to load roster:', err)
    });
  }

  closeParticipants() {
    this.showParticipants.set(false);
  }
}

