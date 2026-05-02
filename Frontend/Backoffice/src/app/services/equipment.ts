import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/equipments';

  findAll(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  findAllAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/all`);
  }

  findPending(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pending`);
  }

  findOwnerEquipment(): Observable<any> {
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

  create(equipment: any): Observable<any> {
    return this.http.post(this.apiUrl, equipment);
  }

  update(id: number, equipment: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, equipment);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
