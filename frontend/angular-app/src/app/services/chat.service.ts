import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = 'http://localhost:8007/api';

  constructor(private http: HttpClient) {}

  sendMessage(message: string, history: any[] = []): Observable<any> {
    return this.http.post(`${this.api}/chat`, { message, history });
  }
}
