import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../../services/event';
import { ActivityService } from '../../services/activity';
import { EventParticipationService } from '../../services/event-participation';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-front-events',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hero-section">
      <h1 class="hero-title">Community Events & Excursions.</h1>
      <p class="hero-subtitle">Participate in organized gatherings, hikes, and exclusive camping activities alongside fellow explorers.</p>
    </div>

    <section class="section-block">
      <div class="events-list">
        <div *ngFor="let ev of events()" class="event-card">
          <div class="event-header">
            <div class="date-badge">
              <span class="month">{{ (ev.startAt | date:'MMM') || 'TBA' }}</span>
              <span class="day">{{ (ev.startAt | date:'dd') || '-' }}</span>
            </div>
            <div class="header-info">
              <h3>{{ ev.title }}</h3>
              <p class="location"><i class="fa-solid fa-map-pin"></i> {{ ev.location }}</p>
            </div>
          </div>
          
          <div class="event-body">
            <p>{{ ev.description }}</p>
            
            <div class="activities-board" *ngIf="getActivitiesForEvent(ev.id).length > 0">
              <h4><i class="fa-solid fa-person-hiking"></i> Featured Excursions</h4>
              <div class="activity-chips">
                <div *ngFor="let act of getActivitiesForEvent(ev.id)" class="activity-chip">
                  <span class="act-name">{{ act.name }}</span>
                  <span class="act-desc">{{ act.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="event-footer" style="display: flex; justify-content: space-between; align-items: center;">
             <span *ngIf="isJoined(ev.id)" style="color: #10b981; font-weight: 700; font-size: 0.95rem;">
               <i class="fa-solid fa-circle-check"></i> Already Registered
             </span>
             <span *ngIf="successMsg() && activeEventId() === ev.id" style="color: #6366f1; font-weight: 700; font-size: 0.95rem;">
               <i class="fa-solid fa-circle-check"></i> {{ successMsg() }}
             </span>
             <span *ngIf="!isJoined(ev.id) && !(successMsg() && activeEventId() === ev.id)"></span>
             
             <button class="btn-action" 
                *ngIf="!isJoined(ev.id)"
                (click)="registerForEvent(ev)"
                [disabled]="loadingSubmit() && activeEventId() === ev.id"
                [style.opacity]="(loadingSubmit() && activeEventId() === ev.id) ? '0.6' : '1'">
                <span *ngIf="loadingSubmit() && activeEventId() === ev.id"><i class="fa-solid fa-circle-notch fa-spin"></i> Processing...</span>
                <span *ngIf="!(loadingSubmit() && activeEventId() === ev.id)">Join Event Roster</span>
             </button>

             <button class="btn-action" 
                *ngIf="isJoined(ev.id)"
                disabled
                style="background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none;">
                Roster Confirmed
             </button>
          </div>
        </div>
        
        <div *ngIf="events().length === 0" style="text-align:center; padding: 3rem; color: #94a3b8;">
          <i class="fa-solid fa-calendar-xmark fa-3x" style="color: #cbd5e1; margin-bottom: 1rem;"></i>
          <p>No events are currently scheduled right now.</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      text-align: center;
      padding: 4rem 2rem 4rem;
    }
    .hero-title {
      font-size: 3.5rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.05em;
      margin-bottom: 1rem;
    }
    .hero-subtitle {
      font-size: 1.25rem;
      color: #64748b;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }
    .section-block {
      max-width: 900px;
      margin: 0 auto 5rem;
    }
    .events-list {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .event-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .event-card:hover {
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .event-header {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .date-badge {
      background: #6366f1;
      color: white;
      border-radius: 0.75rem;
      padding: 0.75rem;
      min-width: 70px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .date-badge .month {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      opacity: 0.9;
    }
    .date-badge .day {
      font-size: 1.5rem;
      font-weight: 900;
    }
    .header-info h3 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .header-info .location {
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .event-body {
      padding: 1.5rem;
    }
    .event-body p {
      color: #475569;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      font-size: 1.05rem;
    }
    .activities-board {
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }
    .activities-board h4 {
      margin-bottom: 1rem;
      color: #334155;
      font-size: 0.95rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .activity-chips {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .activity-chip {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 1rem;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      border-left: 4px solid #f59e0b;
    }
    .act-name {
      font-weight: 800;
      color: #0f172a;
      font-size: 0.95rem;
    }
    .act-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 0.4rem;
      line-height: 1.4;
    }
    .event-footer {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: white;
      display: flex;
      justify-content: flex-end;
    }
    .btn-action {
      padding: 0.75rem 2.5rem;
      background: #10b981;
      border: none;
      border-radius: 0.5rem;
      font-weight: 700;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      font-size: 1rem;
    }
    .btn-action:hover {
      background: #059669;
      transform: translateY(-2px);
    }
  `]
})
export class FrontEventsPage implements OnInit {
  private eventService = inject(EventService);
  private activityService = inject(ActivityService);
  private participationService = inject(EventParticipationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  events = signal<any[]>([]);
  activities = signal<any[]>([]);

  loadingSubmit = signal<boolean>(false);
  successMsg = signal<string>('');
  activeEventId = signal<number | null>(null);

  ngOnInit() {
    this.eventService.findAll().subscribe((res: any) => {
      const evs = res?.data?.content || res?.data || [];
      this.events.set(evs);
      this.checkParticipations(evs);
    });

    this.activityService.findAll().subscribe((res: any) => {
      this.activities.set(res?.data?.content || res?.data || []);
    });
  }

  joinedEvents = signal<Set<number>>(new Set());

  checkParticipations(evs: any[]) {
    if (!this.authService.isLoggedIn()) return;
    const userStr = localStorage.getItem('camp_user');
    if (!userStr) return;
    const userId = JSON.parse(userStr).id;

    evs.forEach(ev => {
      this.participationService.isJoined(ev.id, userId).subscribe((res: any) => {
        if (res.data === true) {
          this.joinedEvents.update(set => {
            set.add(ev.id);
            return new Set(set);
          });
        }
      });
    });
  }

  isJoined(eventId: number): boolean {
    return this.joinedEvents().has(eventId);
  }

  getActivitiesForEvent(eventId: number): any[] {
    return this.activities().filter(a => a.eventId === eventId);
  }

  registerForEvent(ev: any) {
    if (!this.authService.isLoggedIn()) {
      alert('You must be logged in to participate in an event!');
      this.router.navigate(['/login']);
      return;
    }

    const userStr = localStorage.getItem('camp_user');
    if (!userStr) return;
    const userId = JSON.parse(userStr).id;

    const payload = {
      eventId: ev.id,
      userId: userId
    };

    this.activeEventId.set(ev.id);
    this.loadingSubmit.set(true);
    this.successMsg.set('');

    this.participationService.create(payload).subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.successMsg.set('Successfully joined!');
        this.joinedEvents.update(set => {
          set.add(ev.id);
          return new Set(set);
        });
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert('Failed to join event. You might already be registered.');
        console.error(err);
      }
    });
  }
}
