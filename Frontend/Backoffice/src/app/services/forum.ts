// src/app/services/forum.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ✅ Interfaces TypeScript pour le typage fort
export interface ForumPost {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  authorKarma?: number;
  authorRole?: string;
  createdAt: string;
  commentCount?: number;
}

export interface ForumComment {
  id: number;
  content: string;
  postId: number;
  authorId: number;
  authorName: string;
  authorKarma?: number;
  createdAt: string;
}

export interface UserForumStats {
  userId: number;
  postCount: number;
  commentCount: number;
  totalInteractions: number;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ForumService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/forum';

  // ==================== POSTS ====================

  findAllPosts(): Observable<ForumPost[]> {
    return this.http.get<ApiResponse<ForumPost[]>>(`${this.apiUrl}/posts`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  getPostById(id: number): Observable<ForumPost | null> {
    return this.http.get<ApiResponse<ForumPost>>(`${this.apiUrl}/posts/${id}`).pipe(
      map(res => res.data || null),
      catchError(() => of(null))
    );
  }

  createPost(post: any): Observable<ForumPost> {
    return this.http.post<ApiResponse<ForumPost>>(`${this.apiUrl}/posts`, post).pipe(
      map(res => res.data)
    );
  }

  updatePost(id: number, post: any): Observable<ForumPost> {
    return this.http.put<ApiResponse<ForumPost>>(`${this.apiUrl}/posts/${id}`, post).pipe(
      map(res => res.data)
    );
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${id}`);
  }

  // ✅ Advanced Search (consomme searchHighQualityPosts JPQL)
  searchHighQualityPosts(keyword: string, minKarma: number = 20): Observable<ForumPost[]> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('minKarma', minKarma.toString());
    
    return this.http.get<ApiResponse<ForumPost[]>>(`${this.apiUrl}/posts/search-hq`, { params }).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  // ✅ Posts by Role + Date (consomme findPostsWithDetailsByRoleAndDate JPQL)
  getPostsByRoleAndDate(
    role: 'ADMIN' | 'GUIDE' | 'USER' | 'CAMPSITE_OWNER' | 'EQUIPMENT_OWNER', 
    since: Date
  ): Observable<ForumPost[]> {
    const params = new HttpParams()
      .set('role', role)
      .set('since', since.toISOString());
    
    return this.http.get<ApiResponse<ForumPost[]>>(`${this.apiUrl}/posts/by-role`, { params }).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  // ==================== COMMENTAIRES ====================

  getCommentsByPostId(postId: number): Observable<ForumComment[]> {
    return this.http.get<ApiResponse<ForumComment[]>>(`${this.apiUrl}/posts/${postId}/comments`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  addComment(comment: any): Observable<ForumComment> {
    return this.http.post<ApiResponse<ForumComment>>(`${this.apiUrl}/comments`, comment).pipe(
      map(res => res.data)
    );
  }

  deleteComment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${id}`);
  }

  // ✅ Expert Comments (consomme findCommentsByAuthorKarmaAndDate JPQL)
  getExpertComments(minKarma: number = 20, since: Date): Observable<ForumComment[]> {
    const params = new HttpParams()
      .set('minKarma', minKarma.toString())
      .set('since', since.toISOString());
    
    return this.http.get<ApiResponse<ForumComment[]>>(`${this.apiUrl}/comments/experts`, { params }).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  // ==================== STATS UTILISATEUR ====================

  // ✅ User Stats (consomme COUNT JPQL)
  getUserForumStats(userId: number): Observable<UserForumStats> {
    return this.http.get<ApiResponse<UserForumStats>>(`${this.apiUrl}/stats/user/${userId}`).pipe(
      map(res => res.data),
      catchError(() => of({ userId, postCount: 0, commentCount: 0, totalInteractions: 0 }))
    );
  }

  // ==================== RECOMMANDATIONS ====================

  getRecommendedPosts(userId: number): Observable<ForumPost[]> {
    return this.http.get<ApiResponse<ForumPost[]>>(`http://localhost:8080/api/recommendations/user/${userId}/posts`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  getTrendingPosts(): Observable<ForumPost[]> {
    return this.http.get<ApiResponse<ForumPost[]>>(`http://localhost:8080/api/recommendations/trending`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }

  getTopContributors(limit: number = 5): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`http://localhost:8080/api/users/top-contributors?limit=${limit}`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }
}