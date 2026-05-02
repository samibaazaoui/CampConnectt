import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CampsiteService } from './campsite';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CampsiteService', () => {
  let service: CampsiteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CampsiteService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CampsiteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all campsites with pagination parameters', () => {
    const mockData = { data: [ { id: 1, name: 'Camp A' } ], success: true };

    service.findAll(1, 10).subscribe(res => {
      expect(res.data).toHaveLength(1);
      expect(res.data[0].name).toBe('Camp A');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/campsites?page=1&size=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should get a campsite by id', () => {
    const mockData = { data: { id: 5, name: 'Lake Spot' }, success: true };

    service.getById(5).subscribe(res => {
      expect(res.data.id).toBe(5);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/campsites/5');
    req.flush(mockData);
  });

  it('should post new campsite data', () => {
    const newCamp = { name: 'New Spot', location: 'Forest' };

    service.create(newCamp).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/campsites');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newCamp);
    req.flush({ success: true });
  });

  it('should call delete endpoint with correct id', () => {
    service.delete(123).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/campsites/123');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });
});
