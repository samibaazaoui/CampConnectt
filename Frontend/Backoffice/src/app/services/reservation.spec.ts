import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReservationService } from './reservation';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ReservationService', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReservationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch reservations by userId', () => {
    service.getByUserId(12).subscribe();
    const req = httpMock.expectOne('http://localhost:8084/api/reservations/user/12');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should call updateStatus with correct query params', () => {
    service.updateStatus(44, 'CONFIRMED').subscribe();
    const req = httpMock.expectOne('http://localhost:8084/api/reservations/44/status?status=CONFIRMED');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
