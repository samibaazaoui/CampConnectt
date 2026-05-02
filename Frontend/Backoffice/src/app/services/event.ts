import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8084/api/events';

  findAll(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  create(event: any): Observable<any> {
    return this.http.post(this.apiUrl, event);
  }

  update(id: number, event: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, event);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
