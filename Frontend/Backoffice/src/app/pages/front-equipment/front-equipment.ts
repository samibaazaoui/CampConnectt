import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EquipmentService } from '../../services/equipment';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';

interface CartItem {
  equipment: any;
  quantity: number;
}

@Component({
  selector: 'app-front-equipment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hero-section">
      <h1 class="hero-title">Gear Up for Adventure.</h1>
      <p class="hero-subtitle">Browse premium camping equipment and get it delivered straight to your doorstep before your next trip.</p>
    </div>

    <!-- Cart Floating Badge -->
    <div class="cart-fab" *ngIf="cart().length > 0" (click)="showCart.set(!showCart())">
      <i class="fa-solid fa-cart-shopping"></i>
      <span class="cart-badge">{{ cartItemCount() }}</span>
    </div>

    <!-- Cart Slide-out Panel -->
    <div class="cart-overlay" *ngIf="showCart()" (click)="showCart.set(false)">
      <div class="cart-panel animate-slide-left" (click)="$event.stopPropagation()">
        <div class="cart-header">
          <h3><i class="fa-solid fa-cart-shopping"></i> Your Cart</h3>
          <button class="btn-close" (click)="showCart.set(false)"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="cart-items">
          <div class="cart-item" *ngFor="let item of cart()">
            <div class="cart-item-info">
              <h4>{{ item.equipment.name }}</h4>
              <p>\${{ item.equipment.unitPrice }} × {{ item.quantity }}</p>
            </div>
            <div class="cart-item-actions">
              <span class="item-total">\${{ item.equipment.unitPrice * item.quantity }}</span>
              <div class="qty-controls">
                <button (click)="updateQty(item.equipment.id, -1)"><i class="fa-solid fa-minus"></i></button>
                <span>{{ item.quantity }}</span>
                <button (click)="updateQty(item.equipment.id, 1)"><i class="fa-solid fa-plus"></i></button>
              </div>
              <button class="btn-remove" (click)="removeFromCart(item.equipment.id)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>

        <div class="cart-footer">
          <div class="cart-total">
            <span>Total</span>
            <strong>\${{ cartTotal() }}</strong>
          </div>
          <button class="btn-checkout" (click)="placeOrder()" [disabled]="orderLoading()">
            <span *ngIf="!orderLoading()"><i class="fa-solid fa-lock"></i> Place Order</span>
            <span *ngIf="orderLoading()"><i class="fa-solid fa-circle-notch fa-spin"></i> Processing...</span>
          </button>
        </div>

        <div class="cart-success" *ngIf="orderSuccess()">
          <i class="fa-solid fa-circle-check"></i>
          <p>Order placed successfully!</p>
        </div>
      </div>
    </div>

    <!-- Equipment Grid -->
    <section class="section-block">
      <div class="section-header">
        <h2 class="section-title">Available Gear</h2>
        <p class="section-desc">High-quality equipment for every kind of outdoor experience.</p>
      </div>

      <div class="card-grid">
        <div *ngFor="let eq of equipment()" class="card">
          <div class="card-img-placeholder" [style.background-image]="eq.imageUrl ? 'url(' + eq.imageUrl + ')' : ''">
            <i *ngIf="!eq.imageUrl" class="fa-solid fa-campground"></i>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="category"><i class="fa-solid fa-tag"></i> {{ eq.category || 'Gear' }}</span>
              <span class="price">\${{ eq.unitPrice }}</span>
            </div>
            <h3>{{ eq.name }}</h3>
            <p class="eq-desc">{{ eq.description || 'Premium camping equipment built for durability.' }}</p>
            <div class="stock-info">
              <span [style.color]="eq.quantityInStock > 0 ? '#10b981' : '#ef4444'">
                <i class="fa-solid" [ngClass]="eq.quantityInStock > 0 ? 'fa-check-circle' : 'fa-times-circle'"></i>
                {{ eq.quantityInStock > 0 ? eq.quantityInStock + ' in stock' : 'Out of stock' }}
              </span>
            </div>
            <button class="btn-action" (click)="addToCart(eq)" [disabled]="eq.quantityInStock <= 0">
              <i class="fa-solid fa-cart-plus"></i> Add to Cart
            </button>
          </div>
        </div>
        <div *ngIf="equipment().length === 0" style="grid-column: 1/-1; text-align:center; padding: 3rem; color: #94a3b8;">
          No equipment available at this time.
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section { text-align: center; padding: 4rem 2rem 4rem; }
    .hero-title { font-size: 3.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.05em; margin-bottom: 1rem; }
    .hero-subtitle { font-size: 1.25rem; color: #64748b; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    .section-block { margin-bottom: 5rem; }
    .section-header { margin-bottom: 2rem; }
    .section-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .section-desc { color: #64748b; }

    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
    .card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .card-img-placeholder { height: 180px; background-color: #f1f5f9; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; font-size: 3.5rem; color: #818cf8; }
    .card-body { padding: 1.5rem; }
    .card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .category { font-size: 0.8rem; color: #64748b; display: flex; gap: 0.35rem; align-items: center; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .price { font-weight: 900; color: #6366f1; font-size: 1.25rem; }
    .card-body h3 { font-size: 1.2rem; font-weight: 800; margin-bottom: 0.5rem; color: #0f172a; }
    .eq-desc { color: #64748b; font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.5; }
    .stock-info { margin-bottom: 1rem; font-size: 0.85rem; font-weight: 600; }
    .btn-action { width: 100%; padding: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-weight: 700; color: #0f172a; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .btn-action:hover:not(:disabled) { background: #6366f1; color: white; border-color: #6366f1; }
    .btn-action:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Cart Floating Action Button */
    .cart-fab { position: fixed; bottom: 2rem; right: 2rem; width: 60px; height: 60px; background: #6366f1; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; cursor: pointer; box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4); z-index: 200; transition: transform 0.2s; }
    .cart-fab:hover { transform: scale(1.1); }
    .cart-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; font-size: 0.7rem; font-weight: 800; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

    /* Cart Overlay & Panel */
    .cart-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; justify-content: flex-end; }
    .cart-panel { width: 420px; max-width: 100vw; height: 100vh; background: white; display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(0,0,0,0.15); }
    .animate-slide-left { animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }

    .cart-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .cart-header h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.75rem; }
    .btn-close { background: none; border: none; color: #64748b; font-size: 1.25rem; cursor: pointer; }

    .cart-items { flex: 1; overflow-y: auto; padding: 1rem; }
    .cart-item { padding: 1rem; border: 1px solid #f1f5f9; border-radius: 0.75rem; margin-bottom: 0.75rem; background: #fafbfc; }
    .cart-item-info h4 { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 700; color: #0f172a; }
    .cart-item-info p { margin: 0; font-size: 0.85rem; color: #64748b; }
    .cart-item-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 0.75rem; }
    .item-total { font-weight: 800; color: #6366f1; font-size: 1rem; }
    .qty-controls { display: flex; align-items: center; gap: 0.75rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.25rem 0.5rem; }
    .qty-controls button { background: none; border: none; color: #6366f1; cursor: pointer; font-size: 0.8rem; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .qty-controls span { font-weight: 700; min-width: 20px; text-align: center; }
    .btn-remove { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; opacity: 0.6; transition: opacity 0.2s; }
    .btn-remove:hover { opacity: 1; }

    .cart-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; }
    .cart-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 1.1rem; color: #0f172a; }
    .cart-total strong { font-size: 1.5rem; color: #6366f1; }
    .btn-checkout { width: 100%; padding: 1rem; background: #6366f1; color: white; border: none; border-radius: 0.75rem; font-weight: 800; font-size: 1rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .btn-checkout:hover:not(:disabled) { background: #4f46e5; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3); }
    .btn-checkout:disabled { opacity: 0.6; cursor: not-allowed; }

    .cart-success { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #10b981; font-size: 1.25rem; font-weight: 700; }
    .cart-success i { font-size: 3rem; }
  `]
})
export class FrontEquipmentPage implements OnInit {
  private equipmentService = inject(EquipmentService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  equipment = signal<any[]>([]);
  cart = signal<CartItem[]>([]);
  showCart = signal<boolean>(false);
  orderLoading = signal<boolean>(false);
  orderSuccess = signal<boolean>(false);

  cartItemCount = computed(() => this.cart().reduce((sum, i) => sum + i.quantity, 0));
  cartTotal = computed(() => this.cart().reduce((sum, i) => sum + (i.equipment.unitPrice * i.quantity), 0));

  ngOnInit() {
    this.equipmentService.findAll().subscribe((res: any) => {
      this.equipment.set(res?.data?.content || res?.data || []);
    });
  }

  addToCart(eq: any) {
    if (!this.authService.isLoggedIn()) {
      alert('You must be logged in to order equipment!');
      this.router.navigate(['/login']);
      return;
    }

    const current = this.cart();
    const existing = current.find(i => i.equipment.id === eq.id);

    if (existing) {
      this.cart.set(current.map(i =>
        i.equipment.id === eq.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      this.cart.set([...current, { equipment: eq, quantity: 1 }]);
    }
  }

  updateQty(eqId: number, delta: number) {
    const current = this.cart();
    this.cart.set(current.map(i => {
      if (i.equipment.id === eqId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  }

  removeFromCart(eqId: number) {
    this.cart.set(this.cart().filter(i => i.equipment.id !== eqId));
    if (this.cart().length === 0) this.showCart.set(false);
  }

  placeOrder() {
    const userStr = localStorage.getItem('camp_user');
    if (!userStr) return;
    const userId = JSON.parse(userStr).id;

    const payload = {
      userId: userId,
      items: this.cart().map(i => ({
        equipmentId: i.equipment.id,
        quantity: i.quantity
      }))
    };

    this.orderLoading.set(true);
    this.orderService.create(payload).subscribe({
      next: () => {
        this.orderLoading.set(false);
        this.orderSuccess.set(true);
        setTimeout(() => {
          this.orderSuccess.set(false);
          this.showCart.set(false);
          this.cart.set([]);
        }, 2500);
      },
      error: (err) => {
        this.orderLoading.set(false);
        const errorMsg = err?.error?.message || 'Failed to place order. Please check availability and try again.';
        alert(errorMsg);
        console.error(err);
      }
    });
  }
}
