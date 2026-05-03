import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampsiteService } from '../../services/campsite';
import { EventService } from '../../services/event';
import { EquipmentService } from '../../services/equipment';
import { UserService } from '../../services/user';
import { ActivityService } from '../../services/activity';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styles: [`
    .dashboard-header {
      margin-bottom: 2.5rem;
    }

    .dashboard-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.5rem;
    }

    .dashboard-header p {
      color: var(--text-secondary);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      padding: 1.5rem;
      border-radius: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: transform 0.2s, background 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.08);
    }

    .icon-box {
      width: 56px;
      height: 56px;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-info .label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .stat-info .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }

    .blue { background: rgba(99, 102, 241, 0.1); color: #818cf8; }
    .green { background: rgba(34, 197, 94, 0.1); color: #4ade80; }
    .orange { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }
    .purple { background: rgba(168, 85, 247, 0.1); color: #c084fc; }

    .recent-activity {
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      border-radius: 1.5rem;
      padding: 2rem;
    }

    .recent-activity h2 {
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
      color: white;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .activity-item:last-child {
      border: none;
      padding-bottom: 0;
    }

    .activity-icon {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .activity-text {
      flex: 1;
      font-size: 0.9375rem;
    }

    .activity-time {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .action-card {
      cursor: pointer;
      border: 1px dashed var(--primary-glow);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent);
    }

    .action-card:hover {
      border-style: solid;
      border-color: var(--primary);
    }
  `]
})
export class DashboardComponent implements OnInit {
  private campsiteService = inject(CampsiteService);
  private eventService = inject(EventService);
  private equipmentService = inject(EquipmentService);
  private userService = inject(UserService);
  private activityService = inject(ActivityService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isAdmin = signal(this.authService.isAdmin());
  isCampsiteOwner = signal(this.authService.isCampsiteOwner());
  isEquipmentOwner = signal(this.authService.isEquipmentOwner());

  goToCampsites() { this.router.navigate(['/admin/campsites']); }
  goToEquipment() { this.router.navigate(['/admin/equipment']); }

  stats = signal([
    { label: 'Active Campsites', value: '...', icon: 'fa-location-dot', color: 'blue' },
    { label: 'Total Users', value: '...', icon: 'fa-users', color: 'green' },
    { label: 'Total Activities', value: '...', icon: 'fa-person-hiking', color: 'orange' },
    { label: 'Scheduled Events', value: '...', icon: 'fa-calendar-days', color: 'purple' }
  ]);

  activities = signal<any[]>([
    { text: 'Dashboard algorithms tracking real-time SQL telemetry', time: 'Just now', status: 'blue' }
  ]);

  ngOnInit() {
    this.loadRoleSpecificStats();
    this.loadRecentSystemLogs();
  }

  loadRoleSpecificStats() {
    if (this.isAdmin()) {
      // Global Stats for Admin
      this.campsiteService.findAll().subscribe((res: any) => {
        const count = res?.data?.totalElements ?? res?.data?.content?.length ?? res?.data?.length ?? 0;
        this.updateStat(0, count);
      });

      this.userService.findAll().subscribe((res: any) => {
        const count = res?.data?.totalElements ?? res?.data?.content?.length ?? res?.data?.length ?? 0;
        this.updateStat(1, count);
      });

      this.activityService.findAll().subscribe((res: any) => {
        const count = res?.data?.totalElements ?? res?.data?.content?.length ?? res?.data?.length ?? 0;
        this.updateStat(2, count);
      });

      this.eventService.findAll().subscribe((res: any) => {
        const count = res?.data?.totalElements ?? res?.data?.content?.length ?? res?.data?.length ?? 0;
        this.updateStat(3, count);
      });
    } else if (this.isCampsiteOwner()) {
      // Owner Specific Stats
      this.campsiteService.findOwnerCampsites().subscribe((res: any) => {
        const items = res?.data?.content || res?.data || [];
        this.updateStat(0, items.length);
        
        // Custom Pending Stat
        const pendingCount = items.filter((i: any) => i.approvalStatus === 'PENDING').length;
        this.stats.update(s => {
          const newStats = [...s];
          newStats[1] = { label: 'Pending Demands', value: String(pendingCount), icon: 'fa-clock-rotate-left', color: 'orange' };
          return newStats;
        });
      });
    } else if (this.isEquipmentOwner()) {
      this.equipmentService.findOwnerEquipment().subscribe((res: any) => {
        const items = res?.data?.content || res?.data || [];
        this.updateStat(3, items.length);
        
        // Custom Pending Stat
        const pendingCount = items.filter((i: any) => i.approvalStatus === 'PENDING').length;
        this.stats.update(s => {
          const newStats = [...s];
          newStats[1] = { label: 'Pending Listings', value: String(pendingCount), icon: 'fa-clock-rotate-left', color: 'orange' };
          return newStats;
        });
      });
    }
  }

  loadRecentSystemLogs() {
    if (!this.isAdmin()) {
      this.activities.set([{ text: 'Telemetry active. Monitoring your territorial assets.', time: 'Just now', status: 'blue' }]);
      return;
    }
    let logs: any[] = [];

    // Latest Registrations
    this.userService.findAll().subscribe((res: any) => {
      const data = res?.data?.content || res?.data || [];
      const recent = data.slice(-2).reverse().map((u: any) => ({
        text: `New user registration: ${u.fullName} joined the platform.`,
        time: 'Recent',
        status: 'green'
      }));
      logs = [...logs, ...recent];
      this.activities.set(logs);
    });

    // Latest Campsites added
    this.campsiteService.findAll().subscribe((res: any) => {
      const data = res?.data?.content || res?.data || [];
      const recent = data.slice(-2).reverse().map((c: any) => ({
        text: `New campsite declared: ${c.name} in ${c.location}.`,
        time: 'Recent',
        status: 'orange'
      }));
      logs = [...logs, ...recent];
      this.activities.set(logs);
    });

    // Latest Equipment added
    this.equipmentService.findAll().subscribe((res: any) => {
      const data = res?.data?.content || res?.data || [];
      const recent = data.slice(-2).reverse().map((eq: any) => ({
        text: `Inventory updated: ${eq.name} added to stock.`,
        time: 'Recent',
        status: 'purple'
      }));
      logs = [...logs, ...recent];
      this.activities.set(logs);
    });

    // Latest Events scheduled
    this.eventService.findAll().subscribe((res: any) => {
      const data = res?.data?.content || res?.data || [];
      const recent = data.slice(-2).reverse().map((e: any) => ({
        text: `New Event Scheduled: ${e.title}`,
        time: 'Recent',
        status: 'blue'
      }));
      logs = [...logs, ...recent];
      this.activities.set(logs);
    });

    // Latest Excursions (Activities)
    this.activityService.findAll().subscribe((res: any) => {
      const data = res?.data?.content || res?.data || [];
      const recent = data.slice(-2).reverse().map((a: any) => ({
        text: `Activity catalog expanded: ${a.name}`,
        time: 'Recent',
        status: 'orange'
      }));
      logs = [...logs, ...recent];
      this.activities.set(logs);
    });
  }

  updateStat(index: number, count: number) {
    this.stats.update((current: any[]) => {
      const newStats = [...current];
      newStats[index] = { ...newStats[index], value: String(count) };
      return newStats;
    });
  }
}
