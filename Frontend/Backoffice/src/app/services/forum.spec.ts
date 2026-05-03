import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ForumService } from './forum';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ForumService', () => {
  let service: ForumService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ForumService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ForumService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all forum posts', () => {
    service.findAllPosts().subscribe();
    const req = httpMock.expectOne('http://localhost:8084/api/forum/posts?page=0&size=10');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should create a new post', () => {
    service.createPost({ title: 'Hi' }).subscribe();
    const req = httpMock.expectOne('http://localhost:8084/api/forum/posts');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should get comments for a post', () => {
    service.getCommentsByPostId(9).subscribe();
    const req = httpMock.expectOne('http://localhost:8084/api/forum/posts/9/comments');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
