import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CallService {

  private client!: Client;
  private peer!: RTCPeerConnection;
  private localStream!: MediaStream;

  incomingCall$ = new Subject<any>();
  signal$ = new Subject<any>();

  connect(userId: number) {

    this.client = new Client({
      brokerURL: 'ws://localhost:8084/ws',
      reconnectDelay: 5000,

      onConnect: () => {

        this.client.subscribe(`/topic/call/${userId}`, (msg: IMessage) => {
          this.incomingCall$.next(JSON.parse(msg.body));
        });

        this.client.subscribe(`/topic/signal/${userId}`, (msg: IMessage) => {
          this.signal$.next(JSON.parse(msg.body));
        });
      }
    });

    this.client.activate();
  }

  call(callerId: number, receiverId: number, callerName: string) {
    this.send('/app/call', {
      callerId,
      receiverId,
      callerName,
      type: 'CALL'
    });
  }

  async startCall(callerId: number, receiverId: number) {

    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.localStream.getTracks().forEach(track => {
      this.peer.addTrack(track, this.localStream);
    });

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.send('/app/signal', {
          callerId,
          receiverId,
          type: 'ICE',
          data: event.candidate
        });
      }
    };
    this.peer.ontrack = (event) => {
   const audio = new Audio();
  audio.srcObject = event.streams[0];
  audio.play();
};

    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);

    this.send('/app/signal', {
      callerId,
      receiverId,
      type: 'OFFER',
      data: offer
    });
  }

  async handleSignal(msg: any, currentUserId: number) {

    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.localStream.getTracks().forEach(track => {
        this.peer.addTrack(track, this.localStream);
      });
    }

    if (msg.type === 'OFFER') {
      await this.peer.setRemoteDescription(msg.data);

      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);

      this.send('/app/signal', {
        callerId: currentUserId,
        receiverId: msg.callerId,
        type: 'ANSWER',
        data: answer
      });
    }

    if (msg.type === 'ANSWER') {
      await this.peer.setRemoteDescription(msg.data);
    }

    if (msg.type === 'ICE') {
      await this.peer.addIceCandidate(msg.data);
    }
    if (msg.type === 'END_CALL') {

  if (this.peer) {
    this.peer.close();
    this.peer = null as any;
  }

  if (this.localStream) {
    this.localStream.getTracks().forEach(t => t.stop());
    this.localStream = null as any;
  }

  alert('📴 Call ended by other user');
}
  }

  private send(dest: string, body: any) {
    this.client.publish({
      destination: dest,
      body: JSON.stringify(body)
    });
  }
  endCall(callerId?: number, receiverId?: number) {

  if (callerId && receiverId) {
    this.send('/app/signal', {
      callerId,
      receiverId,
      type: 'END_CALL'
    });
  }

  if (this.peer) {
    this.peer.close();
    this.peer = null as any;
  }

  if (this.localStream) {
    this.localStream.getTracks().forEach(t => t.stop());
    this.localStream = null as any;
  }
}
}