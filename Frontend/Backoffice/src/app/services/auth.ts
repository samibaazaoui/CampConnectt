import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8084/api/auth';

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.success) {
          localStorage.setItem('camp_token', res.data.token);
          localStorage.setItem('camp_user', JSON.stringify(res.data.user));
        }
      })
    );
  }

  register(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, payload).pipe(
      tap((res: any) => {
        if (res.success) {
          localStorage.setItem('camp_token', res.data.token);
          localStorage.setItem('camp_user', JSON.stringify(res.data.user));
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('camp_token');
    localStorage.removeItem('camp_user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('camp_token');
  }

  getToken(): string | null {
    return localStorage.getItem('camp_token');
  }

  getUserRole(): string | null {
    const userStr = localStorage.getItem('camp_user');
    if (userStr) {
      return JSON.parse(userStr).role;
    }
    return null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  isCampsiteOwner(): boolean {
    return this.getUserRole() === 'CAMPSITE_OWNER';
  }

  isEquipmentOwner(): boolean {
    return this.getUserRole() === 'EQUIPMENT_OWNER';
  }
}
