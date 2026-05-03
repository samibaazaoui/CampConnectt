import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private http = inject(HttpClient);
  private apiUrl = '/api/feedbacks';

  findAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  findByCampsite(campsiteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/campsite/${campsiteId}`);
  }

  create(feedback: any): Observable<any> {
    return this.http.post(this.apiUrl, feedback);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
