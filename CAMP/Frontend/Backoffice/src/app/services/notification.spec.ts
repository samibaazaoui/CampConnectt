import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should mark notification as read', () => {
    service.markAsRead(777).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/notifications/777/read');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should get notifications for a user', () => {
    service.findByUserId(1).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/notifications/user/1');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
