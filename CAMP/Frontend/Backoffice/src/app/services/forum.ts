import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private http = inject(HttpClient);
  private apiUrl = '/api/forum';

  // Posts
  findAllPosts(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/posts?page=${page}&size=${size}`);
  }

  getPostById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/posts/${id}`);
  }

  createPost(post: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts`, post);
  }

  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${id}`);
  }

  // Comments
  getCommentsByPostId(postId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/posts/${postId}/comments`);
  }

  addComment(commentPayload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/comments`, commentPayload);
  }

  deleteComment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/${id}`);
  }
}
