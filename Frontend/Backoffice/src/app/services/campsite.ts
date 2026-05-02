import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CampsiteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8084/api/campsites';

  findAll(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  findAllAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/all`);
  }

  findAllApproved(): Observable<any> {
    return this.http.get(`${this.apiUrl}/approved`);
  }

  findPending(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pending`);
  }

  findOwnerCampsites(): Observable<any> {
    return this.http.get(`${this.apiUrl}/owner`);
  }

  approve(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/approve`, {});
  }

  cancel(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cancel`, {});
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  create(campsite: any): Observable<any> {
    return this.http.post(this.apiUrl, campsite);
  }

  update(id: number, campsite: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, campsite);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
