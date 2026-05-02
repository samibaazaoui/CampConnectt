import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { OrderService } from '../services/order';
import { CallService } from '../services/call';
import { AuthService } from '../services/auth';
import { CallDialogComponent } from '../call-dialog/call-dialog';
import { ActiveCallDialogComponent } from '../active-call-dialog/active-call-dialog';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css'],
})
export class CustomersComponenet implements OnInit, OnDestroy {

  customers: any[] = [];
  loading = true;

  callStates: Record<number, string> = {};

  private subs: Subscription[] = [];
  private currentUser: any;

  constructor(
    private orderService: OrderService,
    private callService: CallService,
    private authService: AuthService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    if (!this.authService.isLoggedIn()) {
      this.loading = false;
      return;
    }

    const userStr = localStorage.getItem('camp_user');
    if (!userStr) return;

    this.currentUser = JSON.parse(userStr);

    this.callService.connect(this.currentUser.id);

    this.loadCustomers();

    this.subs.push(
      this.callService.incomingCall$.subscribe(call => {

        if (call.type === 'CALL') {

          const dialogRef = this.dialog.open(CallDialogComponent, {
            data: {
              callerId: call.callerId,
              callerName: call.callerName,
              currentUserId: this.currentUser.id
            },
            disableClose: true
          });

          dialogRef.afterClosed().subscribe(result => {

            if (result === 'accepted') {
              this.callStates[call.callerId] = 'accepted';
            }

            if (result === 'rejected') {
              this.callStates[call.callerId] = 'rejected';

              setTimeout(() => {
                this.callStates[call.callerId] = 'idle';
              }, 3000);
            }
          });
        }
      })
    );

    this.subs.push(
      this.callService.signal$.subscribe(signal => {
        this.callService.handleSignal(signal, this.currentUser.id);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    //this.callService.disconnect();
  }

  
  loadCustomers() {

    this.orderService.getMyCustomers().subscribe({
      next: (data) => {

        this.customers = data ?? [];

        this.customers.forEach((u: any) => {
          this.callStates[u.id] = 'idle';
        });

        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  async callUser(user: any) {

  this.callStates[user.id] = 'calling';

  this.callService.call(
    this.currentUser.id,
    user.id,
    this.currentUser.fullName
  );

  await this.callService.startCall(
    this.currentUser.id,
    user.id
  );
 const dialogRef = this.dialog.open(ActiveCallDialogComponent, {
  data: { name: user.fullName },
  panelClass: 'call-panel',
  disableClose: true
});

dialogRef.afterClosed().subscribe(res => {
  if (res === 'ended') {
    this.callService.endCall();
    this.callStates[user.id] = 'idle';
  }
});
}
  getCallState(userId: number): string {
    return this.callStates[userId] || 'idle';
  }

  getCustomerName(userId: number): string {
    return this.customers.find(c => c.id === userId)?.fullName || 'User';
  }

  trackById(index: number, item: any) {
    return item.id;
  }
}