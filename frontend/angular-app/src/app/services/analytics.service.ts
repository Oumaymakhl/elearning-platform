import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private api = '/api';

  constructor(private http: HttpClient) {}

  getTeacherStats(): Observable<any> {
    return this.http.get(`${this.api}/analytics/teacher`);
  }
  getCourseStats(courseId: number): Observable<any> {
    return this.http.get(`${this.api}/analytics/courses/${courseId}`);
  }
  getGlobalQuizStats(): Observable<any> {
    return this.http.get(`${this.api}/quiz-stats`);
  }
}
