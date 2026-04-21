import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = '/api/payments';

  constructor(private http: HttpClient, private auth: AuthService) {}

  initiatePayment(courseId: number, amount: number, email: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const user = this.auth.getCurrentUser();
    return this.http.post<any>(this.apiUrl + '/initiate', {
      user_id:   user?.id || 1,
      course_id: courseId,
      amount:    amount,
      email:     email || user?.email,
    }, { headers });
  }

  hasPaid(courseId: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const user = this.auth.getCurrentUser();
    return this.http.get<any>(this.apiUrl + `?user_id=${user?.id}&course_id=${courseId}`, { headers });
  }
}
