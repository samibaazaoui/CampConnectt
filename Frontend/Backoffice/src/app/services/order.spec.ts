import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch user orders', () => {
    service.getByUserId(99).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/equipment-orders/user/99');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should update order status', () => {
    service.updateStatus(1, 'CONFIRMED').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/equipment-orders/1/status?status=CONFIRMED');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
