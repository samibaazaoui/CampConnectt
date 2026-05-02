import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChatService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should find all rooms', () => {
    service.findAllRooms().subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/chat/rooms');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should identify correct message endpoint after my fix', () => {
    service.sendMessage(1, { content: 'hello' }).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/chat/messages');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should get participants for a room', () => {
    service.getParticipantsByRoomId(123).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/chat/rooms/123/participants');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
