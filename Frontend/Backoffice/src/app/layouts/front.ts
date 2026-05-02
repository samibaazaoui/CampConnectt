import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notification';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-front-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="front-app-container">
      <header class="front-navbar">
        <div class="nav-brand" routerLink="/">
          <i class="fa-solid fa-mountain-sun"></i>
          <span>CAMP.</span>
        </div>
        <nav class="nav-links">
          <a routerLink="/">Campsites</a>
          <a routerLink="/explore-events">Events & Activities</a>
          <a routerLink="/shop">Gear Shop</a>
          <a routerLink="/forum">Community Forum</a>
          <a routerLink="/chat">Live Chat</a>
        </nav>
        <div class="nav-actions">
          <!-- Notification Bell -->
          <div class="notif-wrapper" *ngIf="authService.isLoggedIn()">
            <button class="notif-bell" (click)="toggleNotifPanel()">
              <i class="fa-solid fa-bell"></i>
              <span class="notif-count" *ngIf="unreadCount() > 0">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
            </button>

            <div class="notif-panel animate-slide-down" *ngIf="showNotifPanel()" (click)="$event.stopPropagation()">
              <div class="notif-panel-header">
                <h4><i class="fa-solid fa-bell"></i> Notifications</h4>
                <span class="notif-panel-count">{{ unreadCount() }} unread</span>
              </div>
              <div class="notif-list">
                <div class="notif-item" *ngFor="let n of notifications()" [class.unread]="n.status === 'UNREAD'" (click)="markRead(n)">
                  <div class="notif-icon" [ngClass]="'type-' + (n.type?.toLowerCase() || 'system')">
                    <i class="fa-solid" [ngClass]="{
                      'fa-calendar-check': n.type === 'EVENT',
                      'fa-comments': n.type === 'FORUM',
                      'fa-box': n.type === 'ORDER',
                      'fa-truck': n.type === 'DELIVERY',
                      'fa-campground': n.type === 'RESERVATION',
                      'fa-bell': n.type === 'SYSTEM' || !n.type
                    }"></i>
                  </div>

                  <div class="notif-content">
                    <strong>{{ n.title }}</strong>
                    <p>{{ n.content }}</p>
                    <span class="notif-time">{{ n.createdAt | date:'short' }}</span>
                  </div>
                </div>
                <div *ngIf="notifications().length === 0" class="notif-empty">
                  <i class="fa-regular fa-bell-slash"></i>
                  <p>All clear — no notifications.</p>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="authService.isLoggedIn()" class="user-chip">
            <span class="user-indicator"></span> Validated
          </div>
          <a *ngIf="authService.isLoggedIn()" routerLink="/profile" class="btn-profile"><i class="fa-solid fa-user"></i> Profile</a>
          <a *ngIf="!authService.isLoggedIn()" routerLink="/login" class="btn-login">Login / Register</a>
          <a *ngIf="authService.isLoggedIn() && authService.isAdmin()" routerLink="/admin" class="btn-dashboard">Admin Dashboard</a>
          <button *ngIf="authService.isLoggedIn()" (click)="authService.logout()" class="btn-logout"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </header>
      
      <main class="front-main-content animate-fade-in">
        <router-outlet></router-outlet>
      </main>

      <footer class="front-footer">
        <p>© 2026 CAMP Wilderness Platform.<p>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background-color: #f8fafc !important; color: #0f172a !important; }
    .front-app-container { min-height: 100vh; background-color: #f8fafc; color: #0f172a; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }
    .front-navbar { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 4rem; background: white; border-bottom: 2px solid rgba(99, 102, 241, 0.1); box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05); position: sticky; top: 0; z-index: 100; }
    .nav-brand { display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem; font-weight: 900; color: #6366f1; cursor: pointer; letter-spacing: -0.05em; }
    .nav-links { display: flex; gap: 3rem; align-items: center; }
    .nav-links a { color: #64748b; text-decoration: none; font-weight: 700; font-size: 0.95rem; transition: all 0.2s; position: relative; }
    .nav-links a:hover { color: #6366f1; }
    .nav-actions { display: flex; gap: 1rem; align-items: center; }
    .btn-login { padding: 0.6rem 1.5rem; background: #6366f1; color: white; text-decoration: none; font-weight: 700; border-radius: 0.5rem; transition: all 0.2s; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
    .btn-login:hover { background: #4f46e5; transform: translateY(-2px); }
    .btn-profile { padding: 0.6rem 1.25rem; background: #f1f5f9; color: #0f172a; text-decoration: none; font-weight: 800; border-radius: 0.5rem; transition: all 0.2s; font-size: 0.9rem; }
    .btn-profile:hover { background: #e2e8f0; }
    .btn-dashboard { padding: 0.6rem 1.5rem; background: #0f172a; color: white; text-decoration: none; font-weight: 700; border-radius: 0.5rem; transition: all 0.2s; font-size: 0.9rem; }
    .btn-logout { background: transparent; border: 1px solid #e2e8f0; color: #64748b; width: 38px; height: 38px; border-radius: 0.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-logout:hover { background: #f1f5f9; color: #ef4444; border-color: #fca5a5; }
    .user-chip { background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 4rem; font-size: 0.8rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 0.5rem; }
    .user-indicator { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #4ade80; }
    .front-main-content { padding: 3rem 4rem; max-width: 1400px; margin: 0 auto; flex: 1; width: 100%; }
    .front-footer { background: white; padding: 2rem 4rem; border-top: 1px solid #e2e8f0; margin-top: auto; text-align: center; font-weight: 600; color: #94a3b8; font-size: 0.85rem; }

    /* Notification Bell */
    .notif-wrapper { position: relative; }
    .notif-bell { background: transparent; border: 1px solid #e2e8f0; color: #64748b; width: 38px; height: 38px; border-radius: 0.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; position: relative; transition: all 0.2s; }
    .notif-bell:hover { background: #f1f5f9; color: #6366f1; border-color: #c7d2fe; }
    .notif-count { position: absolute; top: -6px; right: -6px; background: #ef4444; color: white; font-size: 0.65rem; font-weight: 800; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(239,68,68,0.4); animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

    /* Notification Panel */
    .notif-panel { position: absolute; top: calc(100% + 0.75rem); right: 0; width: 380px; max-height: 460px; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,0.12); overflow: hidden; z-index: 500; }
    .animate-slide-down { animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .notif-panel-header { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .notif-panel-header h4 { margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
    .notif-panel-count { font-size: 0.75rem; font-weight: 700; color: #6366f1; background: rgba(99,102,241,0.1); padding: 0.25rem 0.75rem; border-radius: 2rem; }

    .notif-list { max-height: 380px; overflow-y: auto; }
    .notif-item { display: flex; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid #f8fafc; cursor: pointer; transition: background 0.15s; }
    .notif-item:hover { background: #f8fafc; }
    .notif-item.unread { background: rgba(99, 102, 241, 0.04); border-left: 3px solid #6366f1; }
    .notif-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0; }
    .type-event { background: rgba(16,185,129,0.1); color: #10b981; }
    .type-forum { background: rgba(99,102,241,0.1); color: #6366f1; }
    .type-order { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .type-delivery { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .type-reservation { background: rgba(168,85,247,0.1); color: #a855f7; }
    .type-system { background: rgba(100,116,139,0.1); color: #64748b; }
    .notif-content { flex: 1; min-width: 0; }
    .notif-content strong { display: block; font-size: 0.85rem; color: #0f172a; margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-content p { margin: 0; font-size: 0.8rem; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .notif-time { font-size: 0.7rem; color: #94a3b8; margin-top: 0.25rem; display: block; }
    .notif-empty { padding: 3rem; text-align: center; color: #94a3b8; }
    .notif-empty i { font-size: 2rem; margin-bottom: 0.75rem; display: block; color: #cbd5e1; }
  `]
})
export class FrontLayoutComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  notifications = signal<any[]>([]);
  unreadCount = signal<number>(0);
  showNotifPanel = signal<boolean>(false);

  private pollInterval: any = null;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.fetchNotifications();
      this.pollInterval = setInterval(() => this.fetchNotifications(), 15000);
    }
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  fetchNotifications() {
    const userStr = localStorage.getItem('camp_user');
    if (!userStr) return;
    const userId = JSON.parse(userStr).id;

    this.notificationService.findByUserId(userId).subscribe({
      next: (res: any) => {
        const data = res?.data || [];
        this.notifications.set(data);
        this.unreadCount.set(data.filter((n: any) => n.status === 'UNREAD').length);
      },
      error: () => {}
    });
  }

  toggleNotifPanel() {
    this.showNotifPanel.set(!this.showNotifPanel());
    if (this.showNotifPanel()) this.fetchNotifications();
  }

  markRead(notif: any) {
    if (notif.status === 'UNREAD') {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        this.fetchNotifications();
      });
    }
  }
}
