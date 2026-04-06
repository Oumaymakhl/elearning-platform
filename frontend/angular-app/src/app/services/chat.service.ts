import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface ChatContext {
  course_title?: string;
  lesson_title?: string;
  lesson_content?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) {}

  sendMessage(
    message: string,
    conversationId: number | null = null,
    context?: ChatContext
  ) {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const body: any = { message };
    if (conversationId) body.conversation_id = conversationId;
    if (context?.course_title)   body.course_title   = context.course_title;
    if (context?.lesson_title)   body.lesson_title   = context.lesson_title;
    if (context?.lesson_content) body.lesson_content = context.lesson_content;
    return this.http.post('http://localhost:8007/api/chat', body, { headers });
  }
}
