import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventParticipationService {
  private http = inject(HttpClient);
  private apiUrl = '/api/event-participations';

  findAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getByEventId(eventId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/event/${eventId}`);
  }

  getByUserId(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  create(participation: any): Observable<any> {
    return this.http.post(this.apiUrl, participation);
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  isJoined(eventId: number, userId: number): Observable<any> {
    return this.http.get(`/api/events/${eventId}/is-joined/${userId}`);
  }

  getQrImageUrl(token: string): string {
    return `/api/event-participations/qr-image/${token}`;
  }

  getTicketUrl(token: string): string {
    return `/api/event-participations/ticket/${token}`;
  }
}
