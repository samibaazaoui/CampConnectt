import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivityService } from './activity';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ActivityService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch activities with pagination', () => {
    const mockData = { data: [], success: true };
    service.findAll(0, 5).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/activities?page=0&size=5');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should delete activity', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/activities/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });
});
