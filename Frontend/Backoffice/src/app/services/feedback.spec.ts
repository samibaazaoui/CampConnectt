import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FeedbackService } from './feedback';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeedbackService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(FeedbackService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get feedback for a specific campsite', () => {
    service.findByCampsite(55).subscribe();
    const req = httpMock.expectOne('http://localhost:8084/api/feedbacks/campsite/55');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
