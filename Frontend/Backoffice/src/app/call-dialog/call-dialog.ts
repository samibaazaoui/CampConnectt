import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { CallService } from '../services/call';

export interface CallDialogData {
  callerId: number;
  callerName: string;
  currentUserId: number;
}

@Component({
  selector: 'app-call-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="call-dialog">
      <!-- Animated rings -->
      <div class="rings">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
        <div class="avatar-circle">
          <i class="fa-solid fa-user"></i>
        </div>
      </div>

      <div class="caller-info">
        <span class="incoming-label">Incoming Call</span>
        <h2 class="caller-name">{{ data.callerName }}</h2>
        <p class="caller-sub">Equipment Owner</p>
      </div>

      <div class="action-buttons">
        <!-- Reject 
        <div class="action-wrap">
          <button class="action-btn reject" (click)="reject()">
            <i class="fa-solid fa-phone-slash"></i>
          </button>
          <span class="action-label">Decline</span>
        </div>-->

        <!-- Accept -->
        <div class="action-wrap">
          <button type="button" class="action-btn accept" (click)="accept()">
            <i class="fa-solid fa-phone"></i>
          </button>
          <span class="action-label">Accept</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap');

    .call-dialog {
      font-family: 'Sora', sans-serif;
      background: linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
      color: white;
      padding: 2.5rem 2rem 2rem;
      border-radius: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.75rem;
      min-width: 300px;
      position: relative;
      overflow: hidden;
    }

    .call-dialog::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 60% 40%, rgba(99,102,241,0.15) 0%, transparent 60%);
      pointer-events: none;
    }

    /* Rings */
    .rings {
      position: relative;
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid rgba(99, 102, 241, 0.5);
      animation: pulse-ring 2s ease-out infinite;
    }
    .ring-1 { width: 100px; height: 100px; animation-delay: 0s; }
    .ring-2 { width: 130px; height: 130px; animation-delay: 0.5s; }
    .ring-3 { width: 160px; height: 160px; animation-delay: 1s; }

    @keyframes pulse-ring {
      0%   { transform: scale(0.85); opacity: 0.8; }
      50%  { opacity: 0.3; }
      100% { transform: scale(1.15); opacity: 0; }
    }

    .avatar-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      color: white;
      z-index: 1;
      box-shadow: 0 0 30px rgba(99,102,241,0.6);
    }

    /* Caller info */
    .caller-info {
      text-align: center;
    }
    .incoming-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #6366f1;
      font-weight: 600;
    }
    .caller-name {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0.3rem 0 0.2rem;
      color: #f8fafc;
    }
    .caller-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }

    /* Buttons */
    .action-buttons {
      display: flex;
      gap: 3rem;
      align-items: center;
    }
    .action-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .action-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      color: white;
    }
    .action-btn:hover { transform: scale(1.12); }

    .reject {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 4px 20px rgba(239,68,68,0.5);
    }
    .reject:hover { box-shadow: 0 6px 28px rgba(239,68,68,0.7); }

    .accept {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 4px 20px rgba(16,185,129,0.5);
      animation: glow-accept 1.5s ease-in-out infinite alternate;
    }
    .accept:hover { box-shadow: 0 6px 28px rgba(16,185,129,0.7); }

    @keyframes glow-accept {
      from { box-shadow: 0 4px 20px rgba(16,185,129,0.4); }
      to   { box-shadow: 0 4px 32px rgba(16,185,129,0.8); }
    }

    .action-label {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 500;
      letter-spacing: 0.05em;
    }
  `]
})
export class CallDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CallDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CallDialogData,
    private callService: CallService
  ) {}

  accept() {
   this.callService.startCall(
    this.data.callerId,
    this.data.currentUserId
  );

  this.dialogRef.close();

    // Optionally navigate to a call page
    alert('✅ Call accepted! Starting call with ' + this.data.callerName);
  }

 /* reject() {
    this.callService.rejectCall(
      this.data.callerId,
      this.data.currentUserId,
      ''
    );
    this.dialogRef.close('rejected');
  }*/
}