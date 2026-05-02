// ml.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface MlPrediction {
  is_spam: boolean;
  confidence: number;
  reason: string;
  method: string;
  bad_words_detected: string[];
  has_bad_words: boolean;
}

export interface BadWordsCheck {
  has_bad_words: boolean;
  bad_words_found: string[];
}

export interface Recommendation {
  postId: number;
  title: string;
  score: number;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MlService {
  private http = inject(HttpClient);
  private mlApiUrl = 'http://localhost:8001';

  /**
   * Check content for spam and bad words using ML model
   */
  checkContent(content: string): Observable<MlPrediction> {
    return this.http.post<MlPrediction>(
      `${this.mlApiUrl}/predict`,
      { content },
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      timeout<MlPrediction>(5000),
      catchError((error: HttpErrorResponse) => {
        console.warn('⚠️ ML service unavailable, using fallback:', error);
        // Return a safe fallback instead of throwing
        return of({
          is_spam: false,
          confidence: 0.5,
          reason: 'Service unavailable - proceeding with caution',
          method: 'fallback',
          bad_words_detected: [],
          has_bad_words: false
        });
      })
    );
  }

  /**
   * Check bad words only (faster endpoint)
   */
  checkBadWordsOnly(content: string): Observable<BadWordsCheck> {
    return this.http.post<BadWordsCheck>(
      `${this.mlApiUrl}/check-badwords`,
      { content }
    ).pipe(
      timeout<BadWordsCheck>(3000),
      catchError(() => {
        const badWords = ['spam', 'fuck', 'shit', 'merde', 'putain'];
        const found = badWords.filter(w => content.toLowerCase().includes(w));
        return of({ has_bad_words: found.length > 0, bad_words_found: found });
      })
    );
  }

  /**
   * Get personalized post recommendations for user
   */
  getRecommendations(userId: number): Observable<Recommendation[]> {
    return this.http.get<Recommendation[]>(
      `http://localhost:8080/api/recommendations/user/${userId}/posts`
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn('⚠️ Recommendations unavailable:', error);
        return of([]); // Return empty array instead of throwing
      })
    );
  }

  /**
   * Get trending posts (ML-powered ranking)
   */
  getTrendingPosts(): Observable<any[]> {
    return this.http.get<any[]>(
      `http://localhost:8080/api/recommendations/trending`
    ).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Health check for ML service
   */
  isMlServiceHealthy(): Observable<{ status: string; model_loaded: boolean }> {
    return this.http.get<{ status: string; model_loaded: boolean }>(
      `${this.mlApiUrl}/health`
    ).pipe(
      timeout<{ status: string; model_loaded: boolean }>(2000),
      catchError(() => of({ status: 'unreachable', model_loaded: false }))
    );
  }
}