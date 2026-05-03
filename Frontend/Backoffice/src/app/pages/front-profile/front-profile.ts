import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-front-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-container animate-fade-in">
      <div class="profile-header">
        <div class="user-avatar">{{ userName.charAt(0) }}</div>
        <div class="user-info">
          <h2>{{ userName }}</h2>
          <p>Camper Profile & History</p>
        </div>
      </div>

      <div class="content-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'reservations'" (click)="activeTab = 'reservations'">
          <i class="fa-solid fa-tent"></i> My Reservations
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'orders'" (click)="activeTab = 'orders'">
          <i class="fa-solid fa-box-open"></i> My Gear Orders
        </button>
      </div>

      <div class="tab-content" *ngIf="activeTab === 'reservations'">
        <div *ngIf="reservations().length === 0" class="empty-state">
          <i class="fa-solid fa-map-location-dot"></i>
          <h3>No Reservations Yet</h3>
          <p>You haven't booked any campsites. Head to the homepage to explore!</p>
        </div>
        
        <div class="list-grid" *ngIf="reservations().length > 0">
          <div class="history-card" *ngFor="let res of reservations()">
            <div class="card-header">
              <span class="status-badge" [ngClass]="'status-' + res.status.toLowerCase()">{{ res.status }}</span>
              <span class="date-range">{{ res.startDate | date:'MMM d' }} - {{ res.endDate | date:'MMM d, y' }}</span>
            </div>
            <div class="card-body">
              <h3>{{ res.campsiteName }}</h3>
              <p><i class="fa-solid fa-location-dot"></i> {{ res.campsiteLocation }}</p>
            </div>
            <div class="card-footer">
              <span class="booking-id">Booking #{{ res.id }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-content" *ngIf="activeTab === 'orders'">
        <div *ngIf="orders().length === 0" class="empty-state">
          <i class="fa-solid fa-cart-shopping"></i>
          <h3>No Equipment Orders</h3>
          <p>You haven't purchased any gear. Check out the shop to get geared up!</p>
        </div>
        
        <div class="list-grid" *ngIf="orders().length > 0">
          <div class="history-card" *ngFor="let order of orders()">
            <div class="card-header">
              <span class="status-badge" [ngClass]="'status-' + order.status.toLowerCase()">{{ order.status }}</span>
              <span class="date-range">{{ order.createdAt | date:'MMM d, y' }}</span>
            </div>
            <div class="card-body">
              <h3 style="margin-bottom: 0.5rem;">Order #{{ order.id }}</h3>
              <ul class="order-items">
                <li *ngFor="let item of order.items">
                  <span>{{ item.quantity }}x {{ item.equipmentName }}</span>
                  <strong>\${{ item.unitPrice * item.quantity | number:'1.2-2' }}</strong>
                </li>
              </ul>
            </div>
            <div class="card-footer" style="justify-content: space-between;">
              <span class="booking-id">Total</span>
              <strong style="color: #6366f1;">\${{ getOrderTotal(order) | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container { max-width: 1000px; margin: 3rem auto; padding: 0 1.5rem; }
    
    .profile-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 3rem; background: white; padding: 2rem; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .user-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; display: flex; justify-content: center; align-items: center; font-size: 2.5rem; font-weight: 800; text-transform: uppercase; }
    .user-info h2 { margin: 0 0 0.25rem; font-size: 2rem; color: #0f172a; font-weight: 800; }
    .user-info p { margin: 0; color: #64748b; font-size: 1.1rem; }

    .content-tabs { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
    .tab-btn { background: none; border: none; padding: 0.75rem 1.5rem; font-size: 1.1rem; font-weight: 700; color: #64748b; cursor: pointer; border-radius: 0.5rem; transition: 0.2s; display: flex; align-items: center; gap: 0.5rem; }
    .tab-btn:hover { background: #f8fafc; color: #0f172a; }
    .tab-btn.active { background: #6366f1; color: white; }

    .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 1rem; border: 1px dashed #cbd5e1; }
    .empty-state i { font-size: 4rem; color: #e2e8f0; margin-bottom: 1.5rem; }
    .empty-state h3 { font-size: 1.5rem; color: #334155; margin-bottom: 0.5rem; }
    .empty-state p { color: #64748b; }

    .list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .history-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s; }
    .history-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    
    .card-header { padding: 1.25rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-confirmed, .status-delivered { background: #d1fae5; color: #059669; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .status-approved { background: #e0e7ff; color: #4338ca; }
    .status-preparing { background: #fce7f3; color: #be185d; }
    .status-shipped { background: #ffedd5; color: #ea580c; }
    
    .date-range { font-size: 0.85rem; color: #64748b; font-weight: 600; }
    
    .card-body { padding: 1.25rem; flex: 1; }
    .card-body h3 { margin: 0 0 0.5rem; font-size: 1.25rem; color: #0f172a; font-weight: 700; }
    .card-body p { margin: 0; color: #64748b; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
    
    .order-items { list-style: none; padding: 0; margin: 0; }
    .order-items li { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem; color: #475569; }
    
    .card-footer { padding: 1rem 1.25rem; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; align-items: center; }
    .booking-id { font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
  `]
})
export class FrontProfilePage implements OnInit {
  private reservationService = inject(ReservationService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  activeTab: 'reservations' | 'orders' = 'reservations';
  
  userName = '';
  userId = 0;
  
  reservations = signal<any[]>([]);
  orders = signal<any[]>([]);

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      return;
    }
    const userStr = localStorage.getItem('camp_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.userName = user.fullName || user.email;
      this.userId = user.id;
      this.loadData();
    }
  }

  loadData() {
    this.reservationService.getByUserId(this.userId).subscribe((res: any) => {
      this.reservations.set(res?.data || []);
    });

    this.orderService.getByUserId(this.userId).subscribe((res: any) => {
      this.orders.set(res?.data || []);
    });
  }

  getOrderTotal(order: any): number {
    if (!order.items) return 0;
    return order.items.reduce((total: number, item: any) => total + (item.quantity * item.unitPrice), 0);
  }
}
