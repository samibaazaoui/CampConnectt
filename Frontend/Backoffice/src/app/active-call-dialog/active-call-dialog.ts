import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-active-call-dialog',
  imports: [MatDialogModule, MatIconModule],

  template: `
    <div class="call-wrapper">

      <!-- Glow background -->
      <div class="bg-glow"></div>

      <!-- Avatar -->
      <div class="avatar">
        {{ data?.name?.charAt(0) || 'U' }}
      </div>

      <!-- Name -->
      <h2 class="name">{{ data?.name || 'Calling...' }}</h2>

      <!-- Timer -->
      <div class="timer">
        {{ formatTime() }}
      </div>

      <!-- End Call Button -->
      <button class="end-btn" (click)="endCall()">
        End
      </button>

    </div>
  `,
  styles: [`
    .call-wrapper {
      position: relative;
      padding: 40px 30px;
      border-radius: 20px;
      text-align: center;
      overflow: hidden;
      background: linear-gradient(145deg, #0f172a, #020617);
      color: white;
      min-width: 300px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }

    .bg-glow {
      position: absolute;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%);
      top: -100px;
      left: -100px;
      animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
      0% { transform: translate(0,0); }
      50% { transform: translate(40px,40px); }
      100% { transform: translate(0,0); }
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: bold;
      margin: auto;
      box-shadow: 0 0 30px rgba(99,102,241,0.8);
      margin-bottom: 15px;
    }

    .name {
      margin: 10px 0;
      font-size: 20px;
      font-weight: 600;
    }

    .timer {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 2px;
      margin-bottom: 25px;
      color: #22c55e;
    }

    .end-btn {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: auto;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 10px 30px rgba(239,68,68,0.6);
    }

    .end-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 15px 40px rgba(239,68,68,0.8);
    }

    mat-icon {
      color: white;
      font-size: 28px;
    }
  `]
})
export class ActiveCallDialogComponent implements OnInit, OnDestroy {

  seconds = 0;
  interval: any;

  constructor(
    private dialogRef: MatDialogRef<ActiveCallDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cdr: ChangeDetectorRef

  ) {}

  ngOnInit() {
  this.interval = setInterval(() => {
    this.seconds++;
    this.cdr.detectChanges(); 
  }, 1000);
}

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  formatTime(): string {
    const m = Math.floor(this.seconds / 60);
    const s = this.seconds % 60;
    return `${m}:${s < 10 ? '0'+s : s}`;
  }

  endCall() {
    this.dialogRef.close('ended');
  }
}