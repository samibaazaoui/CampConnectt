import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar';
import { NavbarComponent } from '../components/navbar/navbar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <app-navbar></app-navbar>
        <div class="content-body animate-fade-in">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {}
