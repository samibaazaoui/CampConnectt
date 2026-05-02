import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/chat';

  private stompClient: Client | null = null;
  private messageSubject = new Subject<any>();
  private typingSubject = new Subject<any>();
  private videoOfferSubject = new Subject<any>();
  private videoAnswerSubject = new Subject<any>();
  private iceCandidateSubject = new Subject<any>();
  private callStatusSubject = new Subject<any>();

  // ==================== WebSocket ====================

  connectWebSocket(): void {
    if (this.stompClient?.active) return;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // Uncomment for debugging: console.log('[STOMP]', str);
      }
    });

    this.stompClient.onConnect = () => {
      console.log('[WebSocket] Connected to STOMP');
    };

    this.stompClient.onStompError = (frame) => {
      console.error('[WebSocket] STOMP error:', frame);
    };

    this.stompClient.activate();
  }

  disconnectWebSocket(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
      console.log('[WebSocket] Disconnected');
    }
  }

  subscribeToRoom(roomId: number): void {
    if (!this.stompClient?.active) return;

    // Subscribe to messages
    this.stompClient.subscribe(`/topic/chat/room/${roomId}`, (message) => {
      const body = JSON.parse(message.body);
      this.messageSubject.next(body);
    });

    // Subscribe to typing indicators
    this.stompClient.subscribe(`/topic/chat/room/${roomId}/typing`, (message) => {
      const body = JSON.parse(message.body);
      this.typingSubject.next(body);
    });

    // Subscribe to video call signaling
    this.stompClient.subscribe(`/topic/chat/room/${roomId}/video-offer`, (message) => {
      this.videoOfferSubject.next(JSON.parse(message.body));
    });

    this.stompClient.subscribe(`/topic/chat/room/${roomId}/video-answer`, (message) => {
      this.videoAnswerSubject.next(JSON.parse(message.body));
    });

    this.stompClient.subscribe(`/topic/chat/room/${roomId}/ice-candidate`, (message) => {
      this.iceCandidateSubject.next(JSON.parse(message.body));
    });

    this.stompClient.subscribe(`/topic/chat/room/${roomId}/call-status`, (message) => {
      this.callStatusSubject.next(JSON.parse(message.body));
    });
  }

  sendMessageViaWebSocket(roomId: number, message: any): void {
    if (!this.stompClient?.active) return;
    this.stompClient.publish({
      destination: `/app/chat/room/${roomId}/send`,
      body: JSON.stringify(message)
    });
  }

  sendTypingIndicator(roomId: number, userId: number, userName: string): void {
    if (!this.stompClient?.active) return;
    this.stompClient.publish({
      destination: `/app/chat/room/${roomId}/typing`,
      body: JSON.stringify({ senderId: userId, senderName: userName, type: 'TYPING' })
    });
  }

  // WebRTC signaling
  sendVideoOffer(roomId: number, offer: any): void {
    if (!this.stompClient?.active) return;
    this.stompClient.publish({
      destination: `/app/chat/room/${roomId}/video-offer`,
      body: JSON.stringify(offer)
    });
  }

  sendVideoAnswer(roomId: number, answer: any): void {
    if (!this.stompClient?.active) return;
    this.stompClient.publish({
      destination: `/app/chat/room/${roomId}/video-answer`,
      body: JSON.stringify(answer)
    });
  }

  sendIceCandidate(roomId: number, candidate: any): void {
    if (!this.stompClient?.active) return;
    this.stompClient.publish({
      destination: `/app/chat/room/${roomId}/ice-candidate`,
      body: JSON.stringify(candidate)
    });
  }

  sendCallStatus(roomId: number, status: any): void {
    if (!this.stompClient?.active) return;
    this.stompClient.publish({
      destination: `/app/chat/room/${roomId}/call-status`,
      body: JSON.stringify(status)
    });
  }

  // Observables for components
  onMessage(): Observable<any> { return this.messageSubject.asObservable(); }
  onTyping(): Observable<any> { return this.typingSubject.asObservable(); }
  onVideoOffer(): Observable<any> { return this.videoOfferSubject.asObservable(); }
  onVideoAnswer(): Observable<any> { return this.videoAnswerSubject.asObservable(); }
  onIceCandidate(): Observable<any> { return this.iceCandidateSubject.asObservable(); }
  onCallStatus(): Observable<any> { return this.callStatusSubject.asObservable(); }

  isWebSocketConnected(): boolean {
    return this.stompClient?.active ?? false;
  }

  // ==================== REST API ====================

  getUserRooms(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms/user/${userId}`);
  }

  getMessagesByRoomId(roomId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms/${roomId}/messages`);
  }

  sendMessage(roomId: number, message: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/messages`, message);
  }

  createRoom(room: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rooms`, room);
  }

  createOneToOneRoom(userId1: number, userId2: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/rooms/one-to-one`, { userId1, userId2 });
  }

  findAllRooms(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms`);
  }

  addParticipant(roomId: number, userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/participants`, { roomId, userId });
  }

  getParticipantsByRoomId(roomId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms/${roomId}/participants`);
  }

  removeParticipant(participationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/participants/${participationId}`);
  }

  getUserChatStats(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/user/${userId}`);
  }

  getMessagesByRole(roomId: number, role: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms/${roomId}/messages/role?role=${role}`);
  }

  deleteMessage(messageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/messages/${messageId}`);
  }

  // ==================== Audio Upload (for Voice Messages) ====================

  uploadAudio(audioBlob: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice_message.webm');
    return this.http.post('http://localhost:8001/upload-audio', formData);
  }
}
