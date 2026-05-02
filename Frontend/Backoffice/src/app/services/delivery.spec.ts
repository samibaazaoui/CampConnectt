import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DeliveryService } from './delivery';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DeliveryService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DeliveryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update delivery status via query param', () => {
    service.updateStatus(100, 'DELIVERED').subscribe();
    const req = httpMock.expectOne('http://localhost:8084/api/deliveries/100/status?status=DELIVERED');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
