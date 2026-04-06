import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
 
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private courseApi = 'http://localhost:8002/api';
  private quizApi   = 'http://localhost:8005/api';
 
  constructor(private http: HttpClient) {}
 
  getTeacherStats(): Observable<any> {
    return this.http.get(`${this.courseApi}/analytics/teacher`);
  }
 
  getCourseStats(courseId: number): Observable<any> {
    return this.http.get(`${this.courseApi}/analytics/courses/${courseId}`);
  }
 
  getGlobalQuizStats(): Observable<any> {
    return this.http.get(`${this.quizApi}/quiz-stats`);
  }
}
