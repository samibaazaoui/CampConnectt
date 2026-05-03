import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventAnalyticsService {
  private http = inject(HttpClient);
  private base = '/api/analytics';

  getEventAnalytics(): Observable<any> {
    return this.http.get(`${this.base}/events`);
  }
}
