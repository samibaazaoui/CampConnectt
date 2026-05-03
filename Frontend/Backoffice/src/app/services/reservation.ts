import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8084/api/reservations';

  findAll(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getByUserId(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  create(reservation: any): Observable<any> {
    return this.http.post(this.apiUrl, reservation);
  }

  updateStatus(id: number, status: string): Observable<any> {
    // Backend path is /api/reservations/{id}/status?status={status}
    return this.http.put(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
