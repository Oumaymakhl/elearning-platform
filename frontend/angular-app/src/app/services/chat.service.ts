import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) {}

  sendMessage(message: string, conversationId: number | null = null) {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const body: any = { message };
    if (conversationId) body.conversation_id = conversationId;
    return this.http.post('http://localhost:8007/api/chat', body, { headers });
  }
}
