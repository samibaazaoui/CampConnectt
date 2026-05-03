import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CampsiteService } from '../../services/campsite';
import { ReservationService } from '../../services/reservation';
import { FeedbackService } from '../../services/feedback';
import { AuthService } from '../../services/auth';
import { MatDialog } from '@angular/material/dialog';
import { CallService } from '../../services/call';
import { Subscription } from 'rxjs';
import { CallDialogComponent } from '../../call-dialog/call-dialog';

@Component({
  selector: 'app-front-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Booking Modal -->
    <div class="modal-overlay" *ngIf="activeCamp()" (click)="closeModal()" style="z-index: 1050;">
      <div class="modal-container animate-slide-up" style="max-width: 440px;" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Secure Booking</h2>
          <button (click)="closeModal()" style="color: var(--text-dim);"><i class="fa-solid fa-xmark"></i></button>
        </div>
        
        <div *ngIf="successMsg()" style="padding: 3rem 2rem; text-align: center; color: #10b981;">
          <i class="fa-solid fa-circle-check fa-3x" style="margin-bottom: 1rem;"></i>
          <h3 style="margin: 0; font-size: 1.25rem;">{{ successMsg() }}</h3>
        </div>

        <form [formGroup]="reservationForm" (ngSubmit)="submitReservation()" *ngIf="!successMsg()">
          <div class="modal-body" style="padding: 1.5rem;">
            <p style="margin-bottom: 1.5rem; color: #64748b; font-size: 0.95rem; line-height: 1.5;">
                You are about to book the <strong>{{ activeCamp()?.name }}</strong> pitch at a rate of <strong>\${{ activeCamp()?.nightlyPrice }}/night</strong>.
            </p>

            <div class="form-group" style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 700; font-size: 0.85rem; color: #475569;">Check-in Date</label>
              <input type="date" formControlName="startDate" style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; outline: none; font-family: inherit; font-size: 0.95rem;">
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 700; font-size: 0.85rem; color: #475569;">Check-out Date</label>
              <input type="date" formControlName="endDate" style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; outline: none; font-family: inherit; font-size: 0.95rem;">
            </div>

            <div class="cost-calculator" *ngIf="reservationForm.valid && estimatedCost() > 0" style="padding: 1rem; background: rgba(99, 102, 241, 0.05); border-radius: 0.5rem; border: 1px dashed rgba(99, 102, 241, 0.4); text-align: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.85rem; color: #64748b;font-weight: 600; text-transform: uppercase;">Estimated Total</span>
              <div style="font-size: 1.5rem; font-weight: 900; color: #6366f1;">\${{ estimatedCost() }}</div>
            </div>
          </div>
          
          <div class="modal-footer" style="padding: 1.25rem 1.5rem; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.85rem; color: #94a3b8;"><i class="fa-solid fa-shield-halved"></i> Verified System</span>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <button type="button" (click)="closeModal()" style="background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer;">Cancel</button>
              <button type="submit" [disabled]="reservationForm.invalid || loadingSubmit()" style="padding: 0.75rem 1.5rem; background: #6366f1; color: white; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer; transition: 0.2s;" [style.opacity]="reservationForm.invalid ? '0.5' : '1'">
                <span *ngIf="!loadingSubmit()">Confirm Dates</span>
                <span *ngIf="loadingSubmit()"><i class="fa-solid fa-circle-notch fa-spin"></i> Processing</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Feedback Modal -->
    <div class="modal-overlay" *ngIf="feedbackCamp()" (click)="closeFeedbackModal()" style="z-index: 1060;">
      <div class="modal-container animate-slide-up" style="max-width: 520px;" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title"><i class="fa-solid fa-star" style="color: #f59e0b; margin-right: 0.5rem;"></i>Reviews — {{ feedbackCamp()?.name }}</h2>
          <button (click)="closeFeedbackModal()" style="color: #64748b; background: none; border: none; font-size: 1.1rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;">
          <!-- Submit Review Form -->
          <div *ngIf="authService.isLoggedIn()" class="review-form-card">
            <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #334155; font-weight: 700;">Leave a Review</h4>
            <div class="star-selector">
              <span *ngFor="let s of [1,2,3,4,5]" class="star-btn" [class.active]="s <= selectedRating()" (click)="selectedRating.set(s)">
                <i class="fa-solid fa-star"></i>
              </span>
            </div>
            <textarea [(ngModel)]="feedbackComment" placeholder="Share your experience..." class="review-textarea"></textarea>
            <button class="btn-submit-review" (click)="submitFeedback()" [disabled]="selectedRating() === 0">
              <i class="fa-solid fa-paper-plane"></i> Submit Review
            </button>
          </div>
          <div *ngIf="!authService.isLoggedIn()" style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem; margin-bottom: 1rem; text-align: center; color: #64748b; font-size: 0.9rem;">
            <i class="fa-solid fa-lock" style="margin-right: 0.5rem;"></i> Log in to leave a review.
          </div>

          <!-- Reviews List -->
          <div class="reviews-list">
            <div *ngFor="let r of campFeedbacks()" class="review-item">
              <div class="review-header">
                <div class="review-author">
                  <div class="author-avatar">{{ r.userName?.charAt(0) || '?' }}</div>
                  <div>
                    <strong>{{ r.userName }}</strong>
                    <span class="review-date">{{ r.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>
                <div class="review-stars">
                  <i *ngFor="let s of [1,2,3,4,5]" class="fa-solid fa-star" [style.color]="s <= r.rating ? '#f59e0b' : '#e2e8f0'"></i>
                </div>
              </div>
              <p class="review-text">{{ r.comment }}</p>
            </div>
            <div *ngIf="campFeedbacks().length === 0" style="text-align: center; padding: 2rem; color: #94a3b8;">
              <i class="fa-regular fa-comment-dots" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
              No reviews yet. Be the first!
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="hero-section">
      <h1 class="hero-title">Discover the Wilderness.</h1>
      <p class="hero-subtitle">Book your next campsite, join community events, and participate in excursions securely from one unified platform.</p>
    </div>

    <!-- Campsites Section -->
    <section class="section-block">
      <div class="section-header">
        <h2 class="section-title">Available Campsites</h2>
        <p class="section-desc">Reserve your spot at one of our premium locations.</p>
      </div>

      <div class="card-grid">
        <div *ngFor="let camp of campsites()" class="card">
          <div class="card-img-placeholder" [style.background-image]="camp.imageUrl ? 'url(' + camp.imageUrl + ')' : ''">
            <i *ngIf="!camp.imageUrl" class="fa-solid fa-mountain-sun"></i>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="location"><i class="fa-solid fa-map-pin"></i> {{ camp.location }}</span>
              <span class="price">\${{ camp.nightlyPrice }}/nt</span>
            </div>
            <h3>{{ camp.name }}</h3>
            <p>Capacity: up to {{ camp.capacity }} guests.</p>
            <div class="card-actions">
              <button class="btn-action" (click)="openBookingModal(camp)">Book Reservation</button>
              <button class="btn-reviews" (click)="openFeedbackModal(camp)">
                <i class="fa-solid fa-star"></i> Reviews
              </button>
            </div>
          </div>
        </div>
        <div *ngIf="campsites().length === 0" style="grid-column: 1/-1; text-align:center; padding: 3rem; color: #94a3b8;">
          No campsites available right now.
        </div>
      </div>
    </section>
  `,
  styles: [`
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; padding: 1rem; }
    .modal-container { background: white; border-radius: 1rem; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .hero-section { text-align: center; padding: 4rem 2rem 6rem; }
    .hero-title { font-size: 3.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.05em; margin-bottom: 1rem; }
    .hero-subtitle { font-size: 1.25rem; color: #64748b; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    .section-block { margin-bottom: 5rem; }
    .section-header { margin-bottom: 2rem; }
    .section-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .section-desc { color: #64748b; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
    .card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .card-img-placeholder { height: 200px; background-color: #f1f5f9; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #cbd5e1; }
    .card-body { padding: 1.5rem; }
    .card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .location { font-size: 0.875rem; color: #64748b; display: flex; gap: 0.25rem; align-items: center; }
    .price { font-weight: 800; color: #6366f1; }
    .card-body h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #0f172a; }
    .card-body p { color: #64748b; font-size: 0.875rem; margin-bottom: 1.25rem; }

    .card-actions { display: flex; gap: 0.75rem; }
    .btn-action { flex: 1; padding: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-weight: 700; color: #0f172a; cursor: pointer; transition: all 0.2s; }
    .btn-action:hover { background: #6366f1; color: white; border-color: #6366f1; }
    .btn-reviews { padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.5rem; font-weight: 700; color: #92400e; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; }
    .btn-reviews:hover { background: #fef3c7; border-color: #f59e0b; }

    /* Feedback Modal Styles */
    .review-form-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 1.5rem; }
    .star-selector { display: flex; gap: 0.35rem; margin-bottom: 0.75rem; }
    .star-btn { font-size: 1.25rem; color: #e2e8f0; cursor: pointer; transition: color 0.15s, transform 0.15s; }
    .star-btn:hover, .star-btn.active { color: #f59e0b; transform: scale(1.15); }
    .review-textarea { width: 100%; min-height: 70px; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; resize: vertical; font-family: inherit; font-size: 0.9rem; outline: none; margin-bottom: 0.75rem; }
    .review-textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
    .btn-submit-review { padding: 0.6rem 1.25rem; background: #6366f1; color: white; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; }
    .btn-submit-review:hover { background: #4f46e5; }
    .btn-submit-review:disabled { opacity: 0.5; cursor: not-allowed; }

    .reviews-list { display: flex; flex-direction: column; gap: 1rem; }
    .review-item { background: white; border: 1px solid #f1f5f9; border-radius: 0.75rem; padding: 1rem 1.25rem; }
    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .review-author { display: flex; align-items: center; gap: 0.75rem; }
    .author-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; }
    .review-author strong { font-size: 0.9rem; color: #0f172a; display: block; }
    .review-date { font-size: 0.75rem; color: #94a3b8; }
    .review-stars i { font-size: 0.7rem; }
    .review-text { margin: 0; font-size: 0.875rem; color: #475569; line-height: 1.5; }
  `]
})
export class FrontHomePage implements OnInit,OnDestroy {
  private campsiteService = inject(CampsiteService);
  private reservationService = inject(ReservationService);
  private feedbackService = inject(FeedbackService);
  authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);   
  private callService = inject(CallService);  
  private callSub?: Subscription;                      // ← NEW


  
  campsites = signal<any[]>([]);
  activeCamp = signal<any | null>(null);
  loadingSubmit = signal<boolean>(false);
  successMsg = signal<string>('');

  // Feedback
  feedbackCamp = signal<any | null>(null);
  campFeedbacks = signal<any[]>([]);
  selectedRating = signal<number>(0);
  feedbackComment = '';
  private currentUser: any;
  private signalSub?: Subscription;

  reservationForm = new FormGroup({
    startDate: new FormControl('', Validators.required),
    endDate: new FormControl('', Validators.required)
  });

ngOnInit() {

  // 🏕️ load camps
  this.campsiteService.findAll().subscribe((res: any) => {
    this.campsites.set(res?.data?.content || res?.data || []);
  });

  try {
    const userStr = localStorage.getItem('camp_user');
    if (!userStr) return;

    this.currentUser = JSON.parse(userStr);

    // 🔌 connect مرة واحدة فقط
    this.callService.connect(this.currentUser.id);

    // =========================
    // 📞 INCOMING CALL
    // =========================
    this.callSub = this.callService.incomingCall$.subscribe((req) => {

      if (req.type === 'CALL') {

        const dialogRef = this.dialog.open(CallDialogComponent, {
          data: {
            callerId: req.callerId,
            callerName: req.callerName,
            currentUserId: this.currentUser.id
          },
          panelClass: 'call-dialog-panel',
          disableClose: true,
        });

        dialogRef.afterClosed().subscribe(result => {

          if (result === 'accepted') {
            console.log('✅ accepted');

            // 🎧 START AUDIO
            this.callService.startCall(
              req.callerId,
              this.currentUser.id
            );
          }

          if (result === 'rejected') {
            console.log('❌ rejected');
          }
        });
      }
    });

    // =========================
    // 📡 SIGNAL (WebRTC)
    // =========================
    this.signalSub = this.callService.signal$.subscribe(signal => {
      this.callService.handleSignal(
        signal,
        this.currentUser.id
      );
    });

  } catch (e) {
    console.error('Call service error:', e);
  }
}
ngOnDestroy(): void {
  this.callSub?.unsubscribe();
  this.signalSub?.unsubscribe();
 // this.callService.disconnect();
}

  openBookingModal(camp: any) {
    if (!this.authService.isLoggedIn()) {
      alert('You must be logged in to make a reservation!');
      this.router.navigate(['/login']);
      return;
    }
    this.activeCamp.set(camp);
    this.reservationForm.reset();
    this.successMsg.set('');
  }

  closeModal() {
    this.activeCamp.set(null);
  }

  estimatedCost(): number {
    const start = this.reservationForm.value.startDate;
    const end = this.reservationForm.value.endDate;
    const camp = this.activeCamp();
    if (!start || !end || !camp) return 0;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 0;
    return diffDays * camp.nightlyPrice;
  }

  submitReservation() {
    if (this.reservationForm.invalid) return;

    const userStr = localStorage.getItem('camp_user');
    if (!userStr) return;
    const userId = JSON.parse(userStr).id;

    const payload = {
      userId: userId,
      campsiteId: this.activeCamp()?.id,
      startDate: this.reservationForm.value.startDate,
      endDate: this.reservationForm.value.endDate
    };

    this.loadingSubmit.set(true);
    this.reservationService.create(payload).subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        this.successMsg.set('Reservation successfully secured!');
        setTimeout(() => this.closeModal(), 2000);
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        alert('Failed to process reservation. Please verify your selected dates.');
        console.error(err);
      }
    });
  }

  // ——— Feedback / Reviews ———

  openFeedbackModal(camp: any) {
    this.feedbackCamp.set(camp);
    this.selectedRating.set(0);
    this.feedbackComment = '';
    this.loadCampFeedbacks(camp.id);
  }

  closeFeedbackModal() {
    this.feedbackCamp.set(null);
  }

  loadCampFeedbacks(campsiteId: number) {
    this.feedbackService.findByCampsite(campsiteId).subscribe({
      next: (res: any) => {
        this.campFeedbacks.set(res?.data || []);
      },
      error: () => this.campFeedbacks.set([])
    });
  }

  submitFeedback() {
    const userStr = localStorage.getItem('camp_user');
    if (!userStr || this.selectedRating() === 0) return;
    const userId = JSON.parse(userStr).id;

    const payload = {
      userId,
      campsiteId: this.feedbackCamp()?.id,
      rating: this.selectedRating(),
      comment: this.feedbackComment
    };

    this.feedbackService.create(payload).subscribe({
      next: () => {
        this.loadCampFeedbacks(this.feedbackCamp()?.id);
        this.selectedRating.set(0);
        this.feedbackComment = '';
      },
      error: (err) => {
        console.error('Error submitting feedback:', err);
        alert('Failed to submit review.');
      }
    });
  }
}
