import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservations.html',
  styles: [`
    .registry-wrapper {
      margin-top: 2.5rem;
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      backdrop-filter: blur(12px);
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    th {
      text-align: left;
      padding: 1.25rem 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border-bottom: 1px solid var(--glass-border);
    }

    td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      color: var(--text-main);
      font-size: 0.9375rem;
      vertical-align: middle;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .status-confirmed { background: hsla(160, 80%, 40%, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
    .status-pending { background: hsla(35, 90%, 50%, 0.1); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2); }
    .status-cancelled { background: hsla(0, 80%, 60%, 0.1); color: var(--danger); border: 1px solid rgba(244, 63, 94, 0.2); }

    .id-tag {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      color: var(--primary);
      opacity: 0.8;
    }

    .user-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .user-name { font-weight: 700; color: white; }
    .user-sub { font-size: 0.75rem; color: var(--text-dim); }

    .action-panel {
      display: flex;
      gap: 0.5rem;
    }

    .btn-reg {
      padding: 0.4rem 0.8rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 700;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-muted);
    }

    .btn-reg:hover:not(:disabled) {
      background: var(--primary);
      color: white;
      transform: translateY(-2px);
    }

    .btn-canx:hover:not(:disabled) { background: var(--danger); }

    .header-registry {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1rem;
    }
  `]
})
export class ReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);
  
  reservations = signal<any[]>([]);
  loading = signal<boolean>(false);

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations() {
    this.loading.set(true);
    this.reservationService.findAll().subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.reservations.set(data?.content || data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading reservations:', err);
        this.loading.set(false);
      }
    });
  }

  updateStatus(id: number, status: string) {
    this.reservationService.updateStatus(id, status).subscribe(() => {
      this.loadReservations();
    });
  }

  formatDate(dateArr: any): string {
    if (Array.isArray(dateArr)) {
      return `${dateArr[0]}-${String(dateArr[1]).padStart(2, '0')}-${String(dateArr[2]).padStart(2, '0')}`;
    }
    return dateArr;
  }
}
