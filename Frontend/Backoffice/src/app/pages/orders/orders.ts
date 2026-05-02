import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header-box animate-fade-in">
      <div>
        <h1 style="font-size: 2.25rem; color: white; margin-bottom: 0.5rem;">Equipment Orders</h1>
        <p style="color: var(--text-muted); font-size: 1rem;">Manage and process customer equipment orders.</p>
      </div>
    </div>

    <div class="registry-wrapper animate-slide-up">
      <div *ngIf="loading()" style="padding: 6rem; text-align: center;">
        <i class="fa-solid fa-compass fa-spin" style="font-size: 3rem; color: var(--primary); margin-bottom: 1.5rem; display: block;"></i>
        <p style="color: var(--text-muted); font-weight: 500;">Loading orders...</p>
      </div>

      <table *ngIf="!loading()">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of orders()">
            <td><span class="id-tag">#{{ order.id }}</span></td>
            <td>
              <div class="user-cell">
                <span class="user-name">{{ order.userName }}</span>
                <span class="user-sub">Customer</span>
              </div>
            </td>
            <td>
              <div class="items-list">
                <div *ngFor="let item of order.items" class="item-chip">
                  {{ item.equipmentName }} × {{ item.quantity }}
                </div>
              </div>
            </td>
            <td>
              <span class="total-price">\${{ calculateTotal(order.items) }}</span>
            </td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td>
              <span class="status-badge" [ngClass]="'status-' + (order.status?.toLowerCase() || 'pending')">
                {{ order.status || 'PENDING' }}
              </span>
            </td>
            <td>
              <div class="status-actions">
                <select class="status-select" [value]="order.status" (change)="updateStatus(order.id, $event)">
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </td>
          </tr>
          <tr *ngIf="orders().length === 0 && !loading()">
            <td colspan="7" style="text-align: center; padding: 6rem; opacity: 0.5;">
              <i class="fa-solid fa-box-open" style="font-size: 4rem; margin-bottom: 1.5rem; display: block;"></i>
              <p style="font-size: 1.125rem;">No orders have been placed yet.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .header-box { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .registry-wrapper { background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); overflow: hidden; backdrop-filter: blur(12px); }
    table { width: 100%; border-collapse: separate; border-spacing: 0; }
    th { text-align: left; padding: 1.25rem 1.5rem; background: rgba(255, 255, 255, 0.03); color: var(--text-muted); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid var(--glass-border); }
    td { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.03); color: var(--text-main); font-size: 0.9375rem; vertical-align: middle; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }
    .id-tag { font-family: 'Outfit', sans-serif; font-weight: 700; color: var(--primary); opacity: 0.8; }
    .user-cell { display: flex; flex-direction: column; gap: 0.125rem; }
    .user-name { font-weight: 700; color: white; }
    .user-sub { font-size: 0.75rem; color: var(--text-dim); }
    .total-price { font-weight: 800; color: var(--primary); font-size: 1rem; }

    .items-list { display: flex; flex-direction: column; gap: 0.25rem; }
    .item-chip { font-size: 0.8rem; color: var(--text-muted); padding: 0.2rem 0.5rem; background: rgba(255,255,255,0.03); border-radius: 0.25rem; border-left: 2px solid var(--primary); }

    .status-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.85rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
    .status-pending { background: hsla(35, 90%, 50%, 0.1); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2); }
    .status-approved { background: hsla(210, 80%, 50%, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
    .status-preparing { background: hsla(270, 80%, 60%, 0.1); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.2); }
    .status-shipped { background: hsla(200, 80%, 50%, 0.1); color: #06b6d4; border: 1px solid rgba(6, 182, 212, 0.2); }
    .status-delivered { background: hsla(160, 80%, 40%, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
    .status-cancelled { background: hsla(0, 80%, 60%, 0.1); color: var(--danger); border: 1px solid rgba(244, 63, 94, 0.2); }

    .status-actions { display: flex; gap: 0.5rem; }
    .status-select {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm);
      color: white;
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .status-select:hover { border-color: var(--primary); }
    .status-select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
    .status-select option { background: #1e293b; color: white; }
  `]
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<any[]>([]);
  loading = signal<boolean>(false);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.orderService.findAll().subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.orders.set(data?.content || data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading.set(false);
      }
    });
  }

  updateStatus(orderId: number, event: any) {
    const status = event.target.value;
    this.orderService.updateStatus(orderId, status).subscribe({
      next: () => this.loadOrders(),
      error: (err) => {
        console.error('Error updating status:', err);
        alert('Failed to update order status.');
      }
    });
  }

  calculateTotal(items: any[]): number {
    if (!items) return 0;
    return items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
  }

  formatDate(dateArr: any): string {
    if (Array.isArray(dateArr)) {
      return `${dateArr[0]}-${String(dateArr[1]).padStart(2, '0')}-${String(dateArr[2]).padStart(2, '0')}`;
    }
    return dateArr;
  }
}
