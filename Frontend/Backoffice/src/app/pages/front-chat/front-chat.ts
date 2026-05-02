import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-front-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container animate-fade-in">
      
      <!-- Rooms Sidebar -->
      <div class="rooms-sidebar">
        <div class="sidebar-header">
          <h2><i class="fa-solid fa-comments"></i> Chat Rooms</h2>
          <button class="btn-icon" (click)="showCreateRoom = !showCreateRoom" title="Create Room">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>

        <!-- Create Room Input -->
        <div class="create-room-box" *ngIf="showCreateRoom">
          <input type="text" [(ngModel)]="newRoomName" placeholder="Room name..." class="room-input" (keyup.enter)="createRoom()">
          <button class="btn-create" (click)="createRoom()" [disabled]="!newRoomName.trim()">Create</button>
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
            <button class="btn-join" *ngIf="!isUserInRoom(room)" (click)="joinRoom(room, $event)">Join</button>
          </div>
          
          <div *ngIf="rooms().length === 0" class="empty-state">
            No rooms available. Create one!
          </div>
        </div>
      </div>

      <!-- Chat Area -->
      <div class="chat-area">
        <div *ngIf="!activeRoom()" class="empty-chat">
          <i class="fa-regular fa-comments"></i>
          <h3>Welcome to CAMP Chat</h3>
          <p>Select a room from the sidebar to start chatting with other campers.</p>
        </div>

        <ng-container *ngIf="activeRoom()">
          <div class="chat-header">
            <div class="header-info">
              <h3># {{ activeRoom().name }}</h3>
              <span class="participant-count"><i class="fa-solid fa-users"></i> {{ participants().length }} participants</span>
            </div>
            <button *ngIf="isUserInRoom(activeRoom())" class="btn-leave" (click)="leaveRoom()">Leave Room</button>
          </div>

          <div class="messages-container" #scrollMe>
            <div *ngIf="!isUserInRoom(activeRoom())" class="join-prompt">
              <i class="fa-solid fa-lock"></i>
              <p>You must join this room to view and send messages.</p>
              <button class="btn-join-large" (click)="joinRoom(activeRoom(), $event)">Join Room</button>
            </div>

            <ng-container *ngIf="isUserInRoom(activeRoom())">
              <div *ngFor="let msg of messages()" class="message-wrapper" [class.mine]="msg.senderId === currentUserId">
                <div class="message-avatar" *ngIf="msg.senderId !== currentUserId">{{ msg.senderName.charAt(0) }}</div>
                <div class="message-content">
                  <div class="message-meta" *ngIf="msg.senderId !== currentUserId">
                    <strong>{{ msg.senderName }}</strong>
                    <span>{{ msg.sentAt | date:'shortTime' }}</span>
                  </div>
                  <div class="message-meta" *ngIf="msg.senderId === currentUserId">
                    <span>{{ msg.sentAt | date:'shortTime' }}</span>
                  </div>
                  <div class="message-bubble">
                    {{ msg.content }}
                  </div>
                </div>
              </div>
              <div *ngIf="messages().length === 0" class="empty-messages">
                No messages yet. Say hello!
              </div>
            </ng-container>
          </div>

          <!-- Message Input -->
          <div class="chat-input-area" *ngIf="isUserInRoom(activeRoom())">
            <div class="emoji-bar">
              <span *ngFor="let e of commonEmojis" (click)="newMessage += e" class="emoji-btn">{{ e }}</span>
            </div>
            <div style="display: flex; gap: 1rem; width: 100%;">
              <input type="text" [(ngModel)]="newMessage" placeholder="Type a message..." class="message-input" (keyup.enter)="sendMessage()">
              <button class="btn-send" (click)="sendMessage()" [disabled]="!newMessage.trim()">
                <i class="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </ng-container>
      </div>

    </div>
  `,
  styles: [`
    .chat-container { display: flex; height: calc(100vh - 180px); background: white; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    
    /* Sidebar */
    .rooms-sidebar { width: 320px; background: #f8fafc; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
    .sidebar-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .sidebar-header h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
    .sidebar-header h2 i { color: #6366f1; }
    .btn-icon { background: none; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; transition: color 0.2s; }
    .btn-icon:hover { color: #6366f1; }
    
    .create-room-box { padding: 1rem; background: rgba(99, 102, 241, 0.05); border-bottom: 1px solid #e2e8f0; display: flex; gap: 0.5rem; }
    .room-input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-family: inherit; font-size: 0.9rem; outline: none; }
    .room-input:focus { border-color: #6366f1; }
    .btn-create { background: #6366f1; color: white; border: none; padding: 0 1rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-create:disabled { opacity: 0.5; }
    
    .rooms-list { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .room-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
    .room-item:hover { background: white; border-color: #e2e8f0; }
    .room-item.active { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); }
    .room-avatar { width: 36px; height: 36px; border-radius: 0.5rem; background: #e2e8f0; color: #64748b; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 1.25rem; }
    .room-item.active .room-avatar { background: #6366f1; color: white; }
    .room-info { flex: 1; }
    .room-info strong { display: block; color: #0f172a; font-size: 0.95rem; }
    .btn-join { background: #10b981; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-join:hover { background: #059669; }
    .empty-state { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 2rem; }

    /* Chat Area */
    .chat-area { flex: 1; display: flex; flex-direction: column; background: white; }
    .empty-chat { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #94a3b8; }
    .empty-chat i { font-size: 4rem; color: #e2e8f0; margin-bottom: 1rem; }
    .empty-chat h3 { color: #475569; margin: 0 0 0.5rem; font-size: 1.5rem; }
    
    .chat-header { padding: 1.5rem 2rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .header-info h3 { margin: 0 0 0.25rem; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
    .participant-count { font-size: 0.8rem; color: #64748b; font-weight: 600; display: flex; gap: 0.25rem; align-items: center; }
    .btn-leave { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 0.4rem 1rem; border-radius: 0.5rem; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
    .btn-leave:hover { background: #fee2e2; }

    .messages-container { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; background: #fafaf9; }
    .join-prompt { margin: auto; text-align: center; background: white; padding: 3rem; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .join-prompt i { font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem; }
    .join-prompt p { color: #64748b; margin-bottom: 1.5rem; }
    .btn-join-large { background: #6366f1; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 1rem; }
    .btn-join-large:hover { background: #4f46e5; }
    
    .message-wrapper { display: flex; gap: 1rem; max-width: 80%; }
    .message-wrapper.mine { margin-left: auto; flex-direction: row-reverse; }
    .message-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #6366f1); color: white; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
    .message-content { display: flex; flex-direction: column; gap: 0.25rem; }
    .message-wrapper.mine .message-content { align-items: flex-end; }
    
    .message-meta { display: flex; gap: 0.5rem; align-items: baseline; font-size: 0.75rem; }
    .message-meta strong { color: #334155; }
    .message-meta span { color: #94a3b8; }
    
    .message-bubble { padding: 0.75rem 1.25rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; border-top-left-radius: 0.25rem; color: #0f172a; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .message-wrapper.mine .message-bubble { background: #6366f1; color: white; border-color: #6366f1; border-top-right-radius: 0.25rem; border-top-left-radius: 1rem; box-shadow: 0 4px 6px rgba(99,102,241,0.2); }
    
    .empty-messages { text-align: center; color: #94a3b8; padding: 2rem; margin: auto; }

    .chat-input-area { padding: 1.5rem 2rem; border-top: 1px solid #e2e8f0; background: white; display: flex; flex-direction: column; gap: 0.5rem; }
    .message-input { flex: 1; padding: 1rem 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 2rem; outline: none; font-family: inherit; font-size: 1rem; color: #0f172a; transition: 0.2s; }
    .message-input:focus { border-color: #6366f1; background: white; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
    .btn-send { width: 50px; height: 50px; border-radius: 50%; background: #6366f1; color: white; border: none; font-size: 1.1rem; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(99,102,241,0.3); }
    .btn-send:hover:not(:disabled) { background: #4f46e5; transform: scale(1.05); }
    .btn-send:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

    .emoji-bar { display: flex; gap: 0.5rem; padding: 0.25rem 0; flex-wrap: wrap; width: 100%; }
    .emoji-btn { cursor: pointer; font-size: 1.1rem; transition: transform 0.2s; padding: 0.25rem; border-radius: 0.25rem; }
    .emoji-btn:hover { background: rgba(99,102,241,0.1); transform: scale(1.2); }
  `]
})
export class FrontChatPage implements OnInit, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUserId: number = 0;
  
  rooms = signal<any[]>([]);
  activeRoom = signal<any | null>(null);
  participants = signal<any[]>([]);
  messages = signal<any[]>([]);
  
  showCreateRoom = false;
  newRoomName = '';
  newMessage = '';
  commonEmojis = ['😀', '😂', '😍', '🙌', '🔥', '✨', '⛺', '🌲', '🏔️', '🎒', '🪵', '🔦', '🥘', '🗺️', '🤝', '⚡'];

  private pollInterval: any;

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      alert('You must be logged in to access the Chat!');
      this.router.navigate(['/login']);
      return;
    }
    const userStr = localStorage.getItem('camp_user');
    if (userStr) {
      this.currentUserId = JSON.parse(userStr).id;
    }
    
    this.loadRooms();

    // Start polling for real-time messages
    this.pollInterval = setInterval(() => {
      this.loadRooms(false); // background refresh
      if (this.activeRoom() && this.isUserInRoom(this.activeRoom())) {
        this.loadMessages(false);
      }
    }, 3000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadRooms(scroll = false) {
    this.chatService.findAllRooms().subscribe((res: any) => {
      this.rooms.set(res?.data || []);
    });
  }

  createRoom() {
    if (!this.newRoomName.trim()) return;
    this.chatService.createRoom({ name: this.newRoomName }).subscribe((res: any) => {
      this.newRoomName = '';
      this.showCreateRoom = false;
      this.loadRooms();
      this.selectRoom(res.data);
      this.joinRoom(res.data, null);
    });
  }

  selectRoom(room: any) {
    this.activeRoom.set(room);
    this.loadParticipants();
    if (this.isUserInRoom(room)) {
      this.loadMessages(true);
    } else {
      this.messages.set([]);
    }
  }

  loadParticipants() {
    if (!this.activeRoom()) return;
    this.chatService.getParticipantsByRoomId(this.activeRoom().id).subscribe((res: any) => {
      this.participants.set(res?.data || []);
    });
  }

  isUserInRoom(room: any): boolean {
    if (!room || !this.participants()) return false;
    return this.participants().some(p => p.userId === this.currentUserId);
  }

  joinRoom(room: any, event: any) {
    if (event) event.stopPropagation();
    this.chatService.addParticipant(room.id, this.currentUserId).subscribe(() => {
      if (this.activeRoom()?.id !== room.id) {
        this.selectRoom(room);
      } else {
        this.loadParticipants();
        this.loadMessages(true);
      }
    });
  }

  leaveRoom() {
    const p = this.participants().find(x => x.userId === this.currentUserId);
    if (!p) return;
    if (confirm('Are you sure you want to leave this room?')) {
      this.chatService.removeParticipant(p.id).subscribe(() => {
        this.loadParticipants();
        this.messages.set([]);
      });
    }
  }

  loadMessages(scrollToBottom = false) {
    if (!this.activeRoom()) return;
    this.chatService.getMessagesByRoomId(this.activeRoom().id).subscribe((res: any) => {
      this.messages.set(res?.data || []);
      if (scrollToBottom) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.activeRoom()) return;
    
    const payload = {
      roomId: this.activeRoom().id,
      senderId: this.currentUserId,
      content: this.newMessage
    };

    this.chatService.sendMessage(this.activeRoom().id, payload).subscribe(() => {
      this.newMessage = '';
      this.loadMessages(true);
    });
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
