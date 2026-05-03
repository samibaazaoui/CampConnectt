import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EventParticipationService } from './event-participation';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('EventParticipationService', () => {
  let service: EventParticipationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventParticipationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EventParticipationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get participation by userId', () => {
    service.getByUserId(1).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/event-participations/user/1');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should update participation status', () => {
    service.updateStatus(10, 'ATTENDED').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/event-participations/10/status?status=ATTENDED');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
