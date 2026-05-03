import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private http = inject(HttpClient);
  private baseUrl = '/api/recommendations';

  getForUser(userId: number, n = 4): Observable<any> {
    return this.http.get(`${this.baseUrl}/${userId}?n=${n}`);
  }
}
