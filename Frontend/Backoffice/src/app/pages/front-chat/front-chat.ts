// src/app/pages/front-chat/front-chat.page.ts
import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// WebRTC Configuration
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

@Component({
  selector: 'app-front-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      
      <!-- Sidebar -->
      <div class="rooms-sidebar">
        <div class="sidebar-header">
          <h2><i class="fa-solid fa-comments"></i> Chat</h2>
          <button class="btn-icon" (click)="showCreateRoom = !showCreateRoom" title="Create Room">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>

        <div class="create-room-box" *ngIf="showCreateRoom">
          <input type="text" [(ngModel)]="newRoomName" placeholder="Room name..." 
                 class="room-input" (keyup.enter)="createRoom()">
          <button class="btn-create" (click)="createRoom()" [disabled]="!newRoomName.trim()">
            Create
          </button>
        </div>

        <div class="rooms-list">
          <div *ngFor="let room of rooms()" 
               class="room-item" 
               [class.active]="activeRoom()?.id === room.id"
               (click)="selectRoom(room)">
            <div class="room-avatar">#</div>
            <div class="room-info">
              <strong>{{ room.name }}</strong>
            </div>
            <button class="btn-join" *ngIf="!isUserInRoom(room)" 
                    (click)="joinRoom(room, $event)">Join</button>
          </div>
          <div *ngIf="rooms().length === 0" class="empty-state">
            No rooms available. Create one!
          </div>
        </div>
      </div>

      <!-- Chat Area -->
      <div class="chat-area">
        
        <!-- Header -->
        <div *ngIf="activeRoom()" class="chat-header">
          <div class="header-info">
            <h3># {{ activeRoom().name }}</h3>
            <span class="participant-count">
              <i class="fa-solid fa-users"></i> {{ participants().length }} participants
            </span>
          </div>
          <div class="header-actions">
            <!-- Video Call Button -->
            <button *ngIf="isUserInRoom(activeRoom())" 
                    class="btn-video-call" 
                    [class.active]="callState !== 'idle'"
                    [class.connecting]="callState === 'connecting'"
                    (click)="toggleVideoCall()"
                    [disabled]="callState === 'connecting'"
                    [title]="getCallButtonTitle()">
              <i [class]="getCallButtonIcon()"></i>
              <span class="btn-text">{{ getCallButtonText() }}</span>
            </button>
            <button *ngIf="isUserInRoom(activeRoom())" 
                    class="btn-leave" (click)="leaveRoom()">
              Leave
            </button>
          </div>
        </div>

        <!-- Video Area -->
        <div class="video-area" *ngIf="callState !== 'idle' && isUserInRoom(activeRoom())">
          <div class="video-grid">
            <!-- Local Video -->
            <div class="video-box local-video">
              <video #localVideo autoplay muted playsinline></video>
              <div class="video-badge">You</div>
              <div class="video-controls-mini">
                <button class="vid-btn" (click)="toggleLocalVideo()" 
                        [class.disabled]="!localVideoEnabled" title="Toggle Camera">
                  <i [class]="localVideoEnabled ? 'fa-solid fa-video' : 'fa-solid fa-video-slash'"></i>
                </button>
                <button class="vid-btn" (click)="toggleLocalAudio()" 
                        [class.disabled]="!localAudioEnabled" title="Toggle Microphone">
                  <i [class]="localAudioEnabled ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash'"></i>
                </button>
              </div>
            </div>
            
            <!-- Remote Video -->
            <div class="video-box remote-video">
              <video #remoteVideo autoplay playsinline></video>
              <div class="video-badge">Caller</div>
              <div class="call-status" *ngIf="callState === 'connecting'">
                <i class="fa-solid fa-spinner fa-spin"></i> Connecting...
              </div>
            </div>
          </div>
          
          <!-- End Call Button -->
          <button class="btn-end-call" (click)="endVideoCall()">
            <i class="fa-solid fa-phone-slash"></i> End Call
          </button>
        </div>

        <!-- Messages Container -->
        <div class="messages-container" #scrollMe>
          <div *ngIf="!activeRoom()" class="empty-chat">
            <i class="fa-regular fa-comments"></i>
            <h3>Welcome to CAMP Chat</h3>
            <p>Select a room from the sidebar to start chatting</p>
          </div>

          <div *ngIf="activeRoom() && !isUserInRoom(activeRoom())" class="join-prompt">
            <i class="fa-solid fa-lock"></i>
            <h4>Join this room</h4>
            <p>You must join this room to view and send messages</p>
            <button class="btn-join-large" (click)="joinRoom(activeRoom(), $event)">
              <i class="fa-solid fa-door-open"></i> Join Room
            </button>
          </div>

          <ng-container *ngIf="activeRoom() && isUserInRoom(activeRoom())">
            <div *ngFor="let msg of messages()" 
                 class="message-wrapper" 
                 [class.mine]="msg.senderId === currentUserId">
              
              <div class="message-avatar" *ngIf="msg.senderId !== currentUserId">
                {{ msg.senderName?.charAt(0) || '?' }}
              </div>
              
              <div class="message-content">
                <div class="message-meta">
                  <span class="sender-name" *ngIf="!msg.isIncognito">
                    {{ msg.senderName }}
                  </span>
                  <span class="sender-name incognito" *ngIf="msg.isIncognito">
                    🎭 Anonymous
                  </span>
                  <span class="time">{{ msg.sentAt | date:'HH:mm' }}</span>
                </div>
                <div class="message-bubble">{{ msg.content }}</div>
              </div>
            </div>
            
            <div *ngIf="messages().length === 0" class="empty-messages">
              <i class="fa-regular fa-comment-dots"></i>
              <p>No messages yet. Say hello! 👋</p>
            </div>
          </ng-container>
        </div>

        <!-- Message Input -->
        <div class="chat-input-area" *ngIf="activeRoom() && isUserInRoom(activeRoom())">
          <div class="input-wrapper">
            <button class="btn-incognito" [class.active]="isIncognito()" 
                    (click)="isIncognito.set(!isIncognito())" title="Incognito Mode">
              <i class="fa-solid fa-user-secret"></i>
            </button>
            <input type="text" [(ngModel)]="newMessage" placeholder="Type a message..." 
                   class="message-input" (keyup.enter)="sendMessage()">
            <button class="btn-send" (click)="sendMessage()" [disabled]="!newMessage.trim()">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
          <div class="incognito-hint" *ngIf="isIncognito()">
            <i class="fa-solid fa-circle-info"></i> Message will be sent anonymously
          </div>
        </div>

      </div>

      <!-- Incoming Call Modal -->
      <div class="modal-overlay" *ngIf="showIncomingCall" (click)="rejectIncomingCall()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="call-animation">
            <i class="fa-solid fa-phone-volume"></i>
          </div>
          <h3>📞 Incoming Video Call</h3>
          <p><strong>{{ incomingCallerName }}</strong> is calling you in <em>#{{ activeRoom()?.name }}</em></p>
          <div class="modal-actions">
            <button class="btn-accept" (click)="acceptIncomingCall()">
              <i class="fa-solid fa-phone"></i> Accept
            </button>
            <button class="btn-decline" (click)="rejectIncomingCall()">
              <i class="fa-solid fa-phone-slash"></i> Decline
            </button>
          </div>
        </div>
      </div>

      <!-- ✅ COOLDOWN MODAL (NOUVEAU - UX Friendly) -->
      <div class="modal-overlay" *ngIf="showCooldownModal()" (click)="closeCooldownModal()">
        <div class="modal-content cooldown-modal" (click)="$event.stopPropagation()">
          <div class="modal-icon cooldown-icon">
            <i class="fa-solid fa-clock"></i>
          </div>
          <h3>Slow Down, Chatter! ⏱️</h3>
          <p>{{ cooldownModalMessage() }}</p>
          <div class="cooldown-timer" *ngIf="cooldownSecondsLeft() > 0">
            <div class="timer-bar">
              <div class="timer-progress" [style.width.%]="getCooldownProgress()"></div>
            </div>
            <span class="timer-text">{{ cooldownSecondsLeft() }}s remaining</span>
          </div>
          <button class="btn-action" (click)="closeCooldownModal()" style="margin-top: 1rem;">
            Got it, I'll wait
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .chat-container { display: flex; height: calc(100vh - 100px); background: #f8fafc; border-radius: 1rem; overflow: hidden; }
    
    .rooms-sidebar { width: 280px; background: white; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .sidebar-header h2 { margin: 0; font-size: 1.2rem; color: #6366f1; display: flex; align-items: center; gap: 0.5rem; }
    .btn-icon { background: none; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; padding: 0.3rem; border-radius: 0.5rem; transition: 0.2s; }
    .btn-icon:hover { background: #f1f5f9; color: #6366f1; }
    
    .create-room-box { padding: 0.75rem 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 0.5rem; }
    .room-input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; outline: none; font-size: 0.9rem; }
    .room-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .btn-create { background: #6366f1; color: white; border: none; padding: 0 1rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-create:hover:not(:disabled) { background: #4f46e5; }
    .btn-create:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .rooms-list { flex: 1; overflow-y: auto; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.3rem; }
    .room-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.8rem; border-radius: 0.5rem; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
    .room-item:hover { background: #f1f5f9; border-color: #e2e8f0; }
    .room-item.active { background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1)); border-left: 3px solid #6366f1; border-color: rgba(99,102,241,0.2); }
    .room-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 0.4rem; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; }
    .room-info { flex: 1; min-width: 0; }
    .room-info strong { font-size: 0.9rem; color: #0f172a; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .btn-join { background: #10b981; color: white; border: none; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .btn-join:hover { background: #059669; }
    .empty-state { text-align: center; color: #94a3b8; padding: 1.5rem; font-size: 0.85rem; }
    
    .chat-area { flex: 1; display: flex; flex-direction: column; background: white; }
    
    .chat-header { padding: 0.8rem 1.2rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to right, #f8fafc, #ffffff); }
    .header-info h3 { margin: 0 0 0.2rem; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
    .participant-count { font-size: 0.8rem; color: #64748b; font-weight: 500; }
    .header-actions { display: flex; gap: 0.5rem; align-items: center; }
    
    .btn-video-call { padding: 0.5rem 1rem; background: white; border: 1px solid #e2e8f0; color: #64748b; border-radius: 0.5rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; transition: all 0.2s; font-weight: 500; }
    .btn-video-call:hover:not(:disabled) { background: #f1f5f9; color: #6366f1; border-color: #cbd5e1; transform: translateY(-1px); }
    .btn-video-call.active { background: linear-gradient(135deg, #10b981, #059669); color: white; border-color: #10b981; }
    .btn-video-call.connecting { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #78350f; border-color: #f59e0b; animation: pulse 1.5s infinite; }
    .btn-video-call:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-text { display: none; }
    @media(min-width: 768px) { .btn-text { display: inline; } }
    
    .btn-leave { padding: 0.4rem 0.9rem; background: linear-gradient(135deg, #fef2f2, #fee2e2); color: #ef4444; border: 1px solid #fecaca; border-radius: 0.5rem; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: 0.2s; }
    .btn-leave:hover { background: linear-gradient(135deg, #fee2e2, #fecaca); transform: translateY(-1px); }
    
    /* Video Area */
    .video-area { padding: 0.8rem 1.2rem; background: linear-gradient(135deg, #0f172a, #1e293b); border-bottom: 1px solid #334155; }
    .video-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; height: 220px; }
    .video-box { position: relative; background: #1e293b; border-radius: 0.75rem; overflow: hidden; border: 2px solid #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
    .video-box video { width: 100%; height: 100%; object-fit: cover; background: #0f172a; }
    .video-badge { position: absolute; bottom: 0.5rem; left: 0.5rem; background: rgba(0,0,0,0.7); color: white; padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; backdrop-filter: blur(4px); }
    .remote-video { border-color: #10b981; box-shadow: 0 0 20px rgba(16,185,129,0.2); }
    
    .video-controls-mini { position: absolute; bottom: 0.5rem; right: 0.5rem; display: flex; gap: 0.3rem; }
    .vid-btn { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.15); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; transition: 0.2s; backdrop-filter: blur(4px); }
    .vid-btn:hover:not(.disabled) { background: rgba(255,255,255,0.25); transform: scale(1.1); }
    .vid-btn.disabled { background: rgba(239,68,68,0.4); color: #fca5a5; cursor: not-allowed; }
    
    .call-status { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fbbf24; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; background: rgba(0,0,0,0.7); padding: 0.4rem 1rem; border-radius: 2rem; backdrop-filter: blur(4px); }
    
    .btn-end-call { margin-top: 0.8rem; width: 100%; padding: 0.7rem; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(239,68,68,0.3); }
    .btn-end-call:hover { background: linear-gradient(135deg, #dc2626, #b91c1c); transform: translateY(-2px); box-shadow: 0 6px 8px -1px rgba(239,68,68,0.4); }
    
    /* Messages */
    .messages-container { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem; background: linear-gradient(to bottom, #fafaf9, #ffffff); }
    .empty-chat, .join-prompt, .empty-messages { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #94a3b8; padding: 2rem; }
    .empty-chat i, .join-prompt i, .empty-messages i { font-size: 3rem; margin-bottom: 0.8rem; opacity: 0.5; color: #cbd5e1; }
    .empty-chat h3 { color: #475569; margin: 0.5rem 0; font-size: 1.3rem; }
    .join-prompt { background: white; border-radius: 0.75rem; border: 2px dashed #cbd5e1; margin: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .join-prompt h4 { color: #0f172a; margin: 0.5rem 0; font-size: 1.1rem; }
    .btn-join-large { margin-top: 1rem; padding: 0.6rem 1.5rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(99,102,241,0.3); }
    .btn-join-large:hover { background: linear-gradient(135deg, #4f46e5, #7c3aed); transform: translateY(-2px); box-shadow: 0 6px 8px -1px rgba(99,102,241,0.4); }
    
    .message-wrapper { display: flex; gap: 0.6rem; max-width: 80%; animation: slideIn 0.3s ease-out; }
    .message-wrapper.mine { margin-left: auto; flex-direction: row-reverse; }
    .message-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #6366f1); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .message-content { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .message-wrapper.mine .message-content { align-items: flex-end; }
    .message-meta { display: flex; gap: 0.5rem; align-items: center; font-size: 0.75rem; }
    .sender-name { font-weight: 600; color: #334155; }
    .sender-name.incognito { color: #6366f1; font-weight: 600; }
    .time { color: #94a3b8; font-size: 0.7rem; }
    .message-bubble { padding: 0.6rem 0.9rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.8rem; border-top-left-radius: 0.3rem; color: #0f172a; font-size: 0.9rem; line-height: 1.4; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .message-wrapper.mine .message-bubble { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-color: #6366f1; border-top-right-radius: 0.3rem; border-top-left-radius: 0.8rem; box-shadow: 0 4px 6px rgba(99,102,241,0.2); }
    
    /* Input Area */
    .chat-input-area { padding: 0.8rem 1.2rem; border-top: 1px solid #e2e8f0; background: white; }
    .input-wrapper { display: flex; gap: 0.6rem; align-items: center; }
    .btn-incognito { width: 38px; height: 38px; border-radius: 50%; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: 0.2s; }
    .btn-incognito:hover { background: #f1f5f9; color: #475569; }
    .btn-incognito.active { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; border-color: #0f172a; box-shadow: 0 4px 6px rgba(15,23,42,0.3); }
    .message-input { flex: 1; padding: 0.8rem 1.2rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 2rem; outline: none; font-size: 0.95rem; transition: 0.2s; }
    .message-input:focus { border-color: #6366f1; background: white; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
    .btn-send { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: 0.2s; box-shadow: 0 4px 6px rgba(99,102,241,0.3); }
    .btn-send:hover:not(:disabled) { background: linear-gradient(135deg, #4f46e5, #7c3aed); transform: scale(1.05); }
    .btn-send:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
    .incognito-hint { font-size: 0.75rem; color: #64748b; margin-top: 0.4rem; display: flex; align-items: center; gap: 0.3rem; }
    .incognito-hint i { color: #6366f1; }
    
    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); animation: fadeIn 0.3s; }
    .modal-content { background: white; padding: 2.5rem; border-radius: 1.5rem; text-align: center; max-width: 500px; width: 90%; animation: slideUp 0.3s; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .call-animation { font-size: 3.5rem; color: #6366f1; margin-bottom: 1rem; animation: ring 1.5s infinite; }
    .modal-content h3 { margin: 0 0 0.8rem; color: #0f172a; font-size: 1.4rem; font-weight: 700; }
    .modal-content p { margin: 0 0 1.5rem; color: #64748b; font-size: 0.95rem; line-height: 1.5; }
    .modal-content p strong { color: #0f172a; font-weight: 700; }
    .modal-content p em { color: #6366f1; font-style: normal; font-weight: 600; }
    .modal-actions { display: flex; gap: 0.8rem; }
    .btn-accept, .btn-decline { flex: 1; padding: 0.9rem; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.95rem; transition: 0.2s; }
    .btn-accept { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 4px 6px rgba(16,185,129,0.3); }
    .btn-accept:hover { background: linear-gradient(135deg, #059669, #047857); transform: translateY(-2px); box-shadow: 0 6px 8px rgba(16,185,129,0.4); }
    .btn-decline { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
    .btn-decline:hover { background: #e2e8f0; color: #ef4444; transform: translateY(-2px); }
    
    /* Cooldown Modal Specifics */
    .cooldown-modal .modal-icon { font-size: 3.5rem; margin-bottom: 1.5rem; color: #6366f1; }
    .cooldown-modal h3 { margin: 0 0 1rem; color: #0f172a; font-size: 1.5rem; font-weight: 700; }
    .cooldown-modal p { margin: 0 0 1.5rem; color: #64748b; font-size: 1rem; line-height: 1.6; }
    .cooldown-timer { margin: 1.5rem 0; padding: 1rem; background: #f1f5f9; border-radius: 0.75rem; }
    .timer-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
    .timer-progress { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 1s linear; }
    .timer-text { font-size: 0.85rem; color: #475569; font-weight: 600; }
    .btn-action { padding: 0.75rem 1.5rem; background: #6366f1; color: white; border: none; border-radius: 0.5rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-action:hover { background: #4f46e5; transform: translateY(-1px); }
    
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    @keyframes ring { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class FrontChatPage implements OnInit, OnDestroy {
  @ViewChild('scrollMe') private scrollContainer!: ElementRef;
  @ViewChild('localVideo') private localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') private remoteVideoRef!: ElementRef<HTMLVideoElement>;

  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private zone = inject(NgZone);

  // User state
  currentUserId: number = 0;
  
  // Data signals
  rooms = signal<any[]>([]);
  activeRoom = signal<any | null>(null);
  participants = signal<any[]>([]);
  messages = signal<any[]>([]);
  
  // UI state
  showCreateRoom = false;
  newRoomName = '';
  newMessage = '';
  isIncognito = signal<boolean>(false);
  
  // ✅ Cooldown state
  showCooldownModal = signal<boolean>(false);
  cooldownSecondsLeft = signal<number>(0);
  cooldownModalMessage = signal<string>('');
  private cooldownTimer: any;
  private lastMessageTime = 0;
  private readonly COOLDOWN_MS = 30000; // 30 seconds
  
  // Video call state
  callState: 'idle' | 'connecting' | 'connected' = 'idle';
  peerConnection: RTCPeerConnection | null = null;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  localVideoEnabled = true;
  localAudioEnabled = true;
  showIncomingCall = false;
  incomingCallerName = '';
  pendingOffer: any = null;

  private destroy$ = new Subject<void>();
  private pollInterval: any;

  ngOnInit(): void {
    this.checkAuth();
    this.loadUserData();
    this.loadRooms();
    this.connectWebSocket();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.endVideoCall();
    this.chatService.disconnectWebSocket();
  }

  private checkAuth(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  private loadUserData(): void {
    const userStr = localStorage.getItem('camp_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
    }
  }

  // ==================== WebSocket Connection ====================
  private connectWebSocket(): void {
    this.chatService.connectWebSocket();
    
    // Listen for messages
    this.chatService.onMessage().pipe(takeUntil(this.destroy$)).subscribe((msg: any) => {
      if (msg.roomId === this.activeRoom()?.id) {
        const exists = this.messages().some((m: any) => m.id === msg.id);
        if (!exists) {
          this.messages.update(msgs => [...msgs, msg]);
          setTimeout(() => this.scrollToBottom(), 50);
        }
      }
    });

    // WebRTC signaling
    this.chatService.onVideoOffer().pipe(takeUntil(this.destroy$)).subscribe((offer: any) => {
      this.zone.run(() => this.handleVideoOffer(offer));
    });

    this.chatService.onVideoAnswer().pipe(takeUntil(this.destroy$)).subscribe((answer: any) => {
      this.zone.run(() => this.handleVideoAnswer(answer));
    });

    this.chatService.onIceCandidate().pipe(takeUntil(this.destroy$)).subscribe((candidate: any) => {
      this.zone.run(() => this.handleIceCandidate(candidate));
    });

    this.chatService.onCallStatus().pipe(takeUntil(this.destroy$)).subscribe((status: any) => {
      if (status.status === 'ended' && this.callState !== 'idle') {
        this.zone.run(() => this.endVideoCall());
      }
    });
  }

  // ==================== Room Management ====================
  loadRooms(): void {
    this.chatService.findAllRooms().subscribe({
      next: (res: any) => this.rooms.set(res?.data || []),
      error: (err: any) => console.error('Failed to load rooms:', err)
    });
  }

  selectRoom(room: any): void {
    this.activeRoom.set(room);
    this.loadParticipants();
    if (this.isUserInRoom(room)) {
      this.loadMessages();
    } else {
      this.messages.set([]);
    }
  }

  loadParticipants(): void {
    if (!this.activeRoom()) return;
    this.chatService.getParticipantsByRoomId(this.activeRoom().id).subscribe({
      next: (res: any) => this.participants.set(res?.data || []),
      error: (err: any) => console.error('Failed to load participants:', err)
    });
  }

  isUserInRoom(room: any): boolean {
    return this.participants().some((p: any) => p.userId === this.currentUserId);
  }

  joinRoom(room: any, event: Event | null): void {
    if (event) event.stopPropagation();
    this.chatService.addParticipant(room.id, this.currentUserId).subscribe({
      next: () => {
        if (this.activeRoom()?.id !== room.id) {
          this.selectRoom(room);
        } else {
          this.loadParticipants();
          this.loadMessages();
        }
      },
      error: (err: any) => {
        console.error('Failed to join room:', err);
        alert('Failed to join room. Please try again.');
      }
    });
  }

  leaveRoom(): void {
    const p = this.participants().find((x: any) => x.userId === this.currentUserId);
    if (!p) return;
    if (confirm('Are you sure you want to leave this room?')) {
      this.endVideoCall();
      this.chatService.removeParticipant(p.id).subscribe({
        next: () => {
          this.loadParticipants();
          this.messages.set([]);
        },
        error: (err: any) => console.error('Failed to leave room:', err)
      });
    }
  }

  loadMessages(): void {
    if (!this.activeRoom()) return;
    this.chatService.getMessagesByRoomId(this.activeRoom().id).subscribe({
      next: (res: any) => {
        this.messages.set(res?.data || []);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: (err: any) => console.error('Failed to load messages:', err)
    });
  }

  // ==================== ✅ SEND MESSAGE WITH COOLDOWN MODAL ====================
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeRoom()) return;
    if (!this.isUserInRoom(this.activeRoom())) {
      alert('Please join the room to send messages');
      return;
    }

    // ✅ Check cooldown
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastMessageTime;
    
    if (timeSinceLastMessage < this.COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((this.COOLDOWN_MS - timeSinceLastMessage) / 1000);
      this.showCooldownNotification(remainingSeconds);
      return;
    }

    const payload = {
      roomId: this.activeRoom().id,
      senderId: this.currentUserId,
      content: this.newMessage,
      isIncognito: this.isIncognito()
    };

    this.chatService.sendMessage(this.activeRoom().id, payload).subscribe({
      next: () => {
        this.newMessage = '';
        this.isIncognito.set(false);
        this.lastMessageTime = Date.now();
        this.loadMessages();
      },
      error: (err: any) => {
        console.error('Failed to send message:', err);
        alert(err?.error?.message || 'Failed to send message');
      }
    });
  }

  // ==================== ✅ COOLDOWN MODAL METHODS ====================
  
  showCooldownNotification(seconds: number): void {
    this.cooldownSecondsLeft.set(seconds);
    this.cooldownModalMessage.set(`Please wait ${seconds} seconds before sending another message.`);
    this.showCooldownModal.set(true);
    
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      const current = this.cooldownSecondsLeft();
      if (current > 0) {
        this.cooldownSecondsLeft.set(current - 1);
      } else {
        clearInterval(this.cooldownTimer);
      }
    }, 1000);
  }

  closeCooldownModal(): void {
    this.showCooldownModal.set(false);
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  getCooldownProgress(): number {
    const total = 30;
    const remaining = this.cooldownSecondsLeft();
    return ((total - remaining) / total) * 100;
  }

  // ==================== Utility Methods ====================

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (e) {
      console.error('Scroll error:', e);
    }
  }

  private startPolling(): void {
    this.pollInterval = setInterval(() => {
      this.loadRooms();
      if (this.activeRoom() && this.isUserInRoom(this.activeRoom())) {
        this.loadMessages();
      }
    }, 4000);
  }

  // ==================== Video Call (WebRTC) ====================

  getCallButtonTitle(): string {
    if (this.callState === 'connected') return 'End call';
    if (this.callState === 'connecting') return 'Connecting...';
    return 'Start video call';
  }

  getCallButtonIcon(): string {
    if (this.callState === 'connected') return 'fa-solid fa-phone-slash';
    if (this.callState === 'connecting') return 'fa-solid fa-spinner fa-spin';
    return 'fa-solid fa-video';
  }

  getCallButtonText(): string {
    if (this.callState === 'connected') return 'End';
    if (this.callState === 'connecting') return '...';
    return 'Call';
  }

  toggleVideoCall(): void {
    if (this.callState !== 'idle') {
      this.endVideoCall();
    } else {
      this.startVideoCall();
    }
  }

  private async startVideoCall(): Promise<void> {
    const room = this.activeRoom();
    if (!room || !this.isUserInRoom(room)) {
      alert('Please join the room first');
      return;
    }

    this.callState = 'connecting';

    try {
      // Create peer connection
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);
      
      // Get user media (camera + microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      
      // Display local video
      if (this.localVideoRef?.nativeElement) {
        this.localVideoRef.nativeElement.srcObject = this.localStream;
      }

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Handle remote stream
      this.remoteStream = new MediaStream();
      this.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream?.addTrack(track);
        });
        if (this.remoteVideoRef?.nativeElement) {
          this.remoteVideoRef.nativeElement.srcObject = this.remoteStream;
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.activeRoom()) {
          this.chatService.sendIceCandidate(this.activeRoom().id, {
            candidate: event.candidate.toJSON(),
            senderId: this.currentUserId,
            roomId: this.activeRoom()?.id
          });
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log('WebRTC connection state:', state);
        
        if (state === 'connected') {
          this.callState = 'connected';
        } else if (state === 'failed' || state === 'disconnected') {
          this.endVideoCall();
        }
      };

      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      if (this.activeRoom()) {
        const userStr = localStorage.getItem('camp_user');
        const userName = userStr ? JSON.parse(userStr).fullName || 'User' : 'User';
        
        this.chatService.sendVideoOffer(this.activeRoom().id, {
          offer: this.peerConnection.localDescription,
          senderId: this.currentUserId,
          senderName: userName,
          roomId: this.activeRoom().id
        });
      }

    } catch (err: any) {
      console.error('Video call error:', err);
      const errorMsg = err.message || 'Unable to access camera/microphone';
      alert('Error: ' + errorMsg + '\n\nPlease allow camera and microphone permissions.');
      this.endVideoCall();
    }
  }

  private handleVideoOffer(offer: any): void {
    // Ignore if it's our own offer or already in a call
    if (offer.senderId === this.currentUserId || this.callState !== 'idle') {
      return;
    }
    
    // Store offer and show incoming call modal
    this.pendingOffer = offer;
    this.incomingCallerName = offer.senderName || 'Someone';
    this.showIncomingCall = true;
  }

  async acceptIncomingCall(): Promise<void> {
    if (!this.pendingOffer || !this.activeRoom()) return;
    
    this.showIncomingCall = false;
    this.callState = 'connecting';

    try {
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);
      
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      
      if (this.localVideoRef?.nativeElement) {
        this.localVideoRef.nativeElement.srcObject = this.localStream;
      }

      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      this.remoteStream = new MediaStream();
      this.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream?.addTrack(track);
        });
        if (this.remoteVideoRef?.nativeElement) {
          this.remoteVideoRef.nativeElement.srcObject = this.remoteStream;
        }
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.activeRoom()) {
          this.chatService.sendIceCandidate(this.activeRoom().id, {
            candidate: event.candidate.toJSON(),
            senderId: this.currentUserId,
            roomId: this.activeRoom()?.id
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        if (this.peerConnection?.connectionState === 'connected') {
          this.callState = 'connected';
        } else if (['failed', 'disconnected'].includes(this.peerConnection?.connectionState || '')) {
          this.endVideoCall();
        }
      };

      // Set remote description and create answer
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.pendingOffer.offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      if (this.activeRoom()) {
        this.chatService.sendVideoAnswer(this.activeRoom().id, {
          answer: this.peerConnection.localDescription,
          senderId: this.currentUserId,
          roomId: this.activeRoom().id
        });
      }

      this.pendingOffer = null;

    } catch (err: any) {
      console.error('Error accepting call:', err);
      alert('Failed to accept call');
      this.endVideoCall();
    }
  }

  rejectIncomingCall(): void {
    this.showIncomingCall = false;
    this.pendingOffer = null;
    
    // Optionally notify sender
    if (this.activeRoom()) {
      this.chatService.sendCallStatus(this.activeRoom().id, {
        status: 'rejected',
        senderId: this.currentUserId,
        roomId: this.activeRoom().id
      });
    }
  }

  private handleVideoAnswer(answer: any): void {
    if (!this.peerConnection || this.callState === 'idle') return;
    
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer.answer))
      .catch((err: any) => console.error('Error setting remote description:', err));
  }

  private handleIceCandidate(candidate: any): void {
    if (!this.peerConnection || !candidate?.candidate) return;
    
    this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate.candidate))
      .catch((err: any) => console.error('Error adding ICE candidate:', err));
  }

  toggleLocalVideo(): void {
    if (!this.localStream) return;
    const track = this.localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      this.localVideoEnabled = track.enabled;
    }
  }

  toggleLocalAudio(): void {
    if (!this.localStream) return;
    const track = this.localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      this.localAudioEnabled = track.enabled;
    }
  }

  endVideoCall(): void {
    // Stop all tracks
    this.localStream?.getTracks().forEach(track => track.stop());
    this.remoteStream?.getTracks().forEach(track => track.stop());
    
    // Close peer connection
    this.peerConnection?.close();
    
    // Notify others
    if (this.activeRoom() && this.callState !== 'idle') {
      this.chatService.sendCallStatus(this.activeRoom().id, {
        status: 'ended',
        senderId: this.currentUserId,
        roomId: this.activeRoom().id
      });
    }
    
    // Reset state
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callState = 'idle';
    this.localVideoEnabled = true;
    this.localAudioEnabled = true;
    this.pendingOffer = null;
    this.showIncomingCall = false;
    
    // Clear video elements
    if (this.localVideoRef?.nativeElement) {
      this.localVideoRef.nativeElement.srcObject = null;
    }
    if (this.remoteVideoRef?.nativeElement) {
      this.remoteVideoRef.nativeElement.srcObject = null;
    }
  }

  createRoom(): void {
    if (!this.newRoomName.trim()) return;
    this.chatService.createRoom({ name: this.newRoomName }).subscribe({
      next: (res: any) => {
        this.newRoomName = '';
        this.showCreateRoom = false;
        this.loadRooms();
        this.selectRoom(res.data);
        this.joinRoom(res.data, null);
      },
      error: (err: any) => {
        console.error('Failed to create room:', err);
        alert('Failed to create room');
      }
    });
  }
}