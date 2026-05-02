import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and store tokens', () => {
    const mockResponse = {
      success: true,
      data: {
        token: 'test-token',
        user: { id: 1, role: 'USER' }
      }
    };

    service.login({ email: 'test@test.com', password: 'password' }).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(localStorage.getItem('camp_token')).toBe('test-token');
    expect(localStorage.getItem('camp_user')).toContain('USER');
  });

  it('should return isLoggedIn correctly', () => {
    expect(service.isLoggedIn()).toBe(false);
    localStorage.setItem('camp_token', 'token');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should logout and clear storage', () => {
    localStorage.setItem('camp_token', 'token');
    localStorage.setItem('camp_user', '{}');
    
    service.logout();
    
    expect(localStorage.getItem('camp_token')).toBeNull();
    expect(localStorage.getItem('camp_user')).toBeNull();
  });

  it('should identify admin role', () => {
    localStorage.setItem('camp_user', JSON.stringify({ role: 'ADMIN' }));
    expect(service.isAdmin()).toBe(true);
    
    localStorage.setItem('camp_user', JSON.stringify({ role: 'USER' }));
    expect(service.isAdmin()).toBe(false);
  });
});
