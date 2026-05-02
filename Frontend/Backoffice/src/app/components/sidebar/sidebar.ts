import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styles: [`
    .sidebar {
      width: 280px;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(20px);
      border-right: 1px solid var(--glass-border);
      display: flex;
      flex-direction: column;
      padding: 2.25rem 1.5rem;
      position: sticky;
      top: 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 3.5rem;
      padding: 0 0.5rem;
    }

    .brand i {
      font-size: 1.75rem;
      color: var(--primary);
      filter: drop-shadow(0 0 8px var(--primary-glow));
    }

    .brand-text {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(to right, white, var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.9375rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
      transform: translateX(4px);
    }

    .nav-item.active {
      background: hsla(var(--p-h), var(--p-s), 64%, 0.1);
      color: var(--primary);
      border-color: var(--primary-glow);
      box-shadow: inset 0 0 20px -10px var(--primary-glow);
    }

    .nav-item i {
      font-size: 1.125rem;
      transition: inherit;
    }

    .nav-item.active i {
      transform: scale(1.1);
      filter: drop-shadow(0 0 5px var(--primary-glow));
    }

    .logout-btn {
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      color: var(--danger);
      border-radius: var(--radius-md);
      font-weight: 700;
      opacity: 0.8;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      opacity: 1;
      background: rgba(244, 63, 94, 0.08);
      transform: translateY(-2px);
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);

  isAdmin = computed(() => this.authService.isAdmin());
  isCampsiteOwner = computed(() => this.authService.isCampsiteOwner());
  isEquipmentOwner = computed(() => this.authService.isEquipmentOwner());

  isLoggedIn = computed(() => this.authService.isLoggedIn());

  logout() {
    this.authService.logout();
  }
}
