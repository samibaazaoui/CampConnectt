import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  template: `
    <nav class="navbar animate-fade-in">
      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Global search for campsites, users, or bookings...">
      </div>
      
      <div class="nav-actions">
        <div class="notif-badge">
          <i class="fa-solid fa-bell"></i>
          <span class="dot"></span>
        </div>
        <div class="user-profile">
          <div class="avatar">AD</div>
          <span>Administrator</span>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--glass-border);
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(30, 41, 59, 0.4);
      padding: 0.85rem 1.5rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--glass-border);
      width: 440px;
      transition: all 0.3s;
    }

    .search-bar:focus-within {
      border-color: var(--primary);
      background: rgba(30, 41, 59, 0.6);
      box-shadow: 0 0 20px -10px var(--primary-glow);
    }

    .search-bar input {
      background: none;
      border: none;
      color: white;
      outline: none;
      width: 100%;
      font-size: 0.9375rem;
      font-weight: 500;
    }

    .search-bar i { color: var(--text-dim); font-size: 1rem; }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .notif-badge {
      position: relative;
      font-size: 1.5rem;
      color: var(--text-dim);
      transition: all 0.2s;
      cursor: pointer;
    }

    .notif-badge:hover { color: var(--primary); transform: scale(1.1); }

    .dot {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 10px;
      height: 10px;
      background: var(--danger);
      border-radius: 50%;
      border: 2px solid var(--bg-surface);
      box-shadow: 0 0 8px var(--danger);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 1.25rem 0.5rem 0.5rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: var(--radius-full);
      border: 1px solid var(--glass-border);
      font-size: 0.9375rem;
      font-weight: 700;
      color: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .user-profile:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: var(--glass-border);
    }

    .avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.8125rem;
      box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
    }
  `]
})
export class NavbarComponent { }
