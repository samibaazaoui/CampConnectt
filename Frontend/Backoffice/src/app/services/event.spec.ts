import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EventService } from './event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch events with pagination', () => {
    service.findAll(2, 20).subscribe();
    const req = httpMock.expectOne('http://localhost:8084/api/events?page=2&size=20');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true });
  });
});
