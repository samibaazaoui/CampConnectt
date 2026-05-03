import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8084/api/chat';

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
}
