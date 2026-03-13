import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private api = 'http://localhost:8002/api';

  constructor(private http: HttpClient) {}

  getCourses(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/courses`); }
  getCourse(id: number): Observable<any> { return this.http.get(`${this.api}/courses/${id}`); }
  createCourse(data: any): Observable<any> { return this.http.post(`${this.api}/courses`, data); }
  updateCourse(id: number, data: any): Observable<any> { return this.http.put(`${this.api}/courses/${id}`, data); }
  deleteCourse(id: number): Observable<any> { return this.http.delete(`${this.api}/courses/${id}`); }

  getChapters(courseId: number): Observable<any[]> { return this.http.get<any[]>(`${this.api}/courses/${courseId}/chapters`); }
  createChapter(courseId: number, data: any): Observable<any> { return this.http.post(`${this.api}/courses/${courseId}/chapters`, data); }

  getSubChapters(courseId: number, chapterId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/courses/${courseId}/chapters/${chapterId}/subchapters`);
  }

  createSubChapter(courseId: number, chapterId: number, data: any): Observable<any> {
    return this.http.post(`${this.api}/courses/${courseId}/chapters/${chapterId}/subchapters`, data);
  }
  deleteChapter(courseId: number, chapterId: number): Observable<any> {
    return this.http.delete(`${this.api}/courses/${courseId}/chapters/${chapterId}`);
  }
  deleteSubChapter(courseId: number, chapterId: number, subId: number): Observable<any> {
    return this.http.delete(`${this.api}/courses/${courseId}/chapters/${chapterId}/subchapters/${subId}`);
  }
  enroll(courseId: number): Observable<any> { return this.http.post(`${this.api}/courses/${courseId}/enroll`, {}); }
  unenroll(courseId: number): Observable<any> { return this.http.delete(`${this.api}/courses/${courseId}/enroll`); }
  myCourses(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/my-courses`); }
  getVisitedSubs(courseId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.api}/courses/${courseId}/visited-subs`);
  }
  markSubVisited(courseId: number, subId: number): Observable<any> {
    return this.http.post(`${this.api}/courses/${courseId}/visited-subs/${subId}`, {});
  }
  updateProgress(courseId: number, data: any): Observable<any> {
    return this.http.post(`${this.api}/courses/${courseId}/progress`, data);
  }
  getProgress(courseId: number): Observable<any> { return this.http.get(`${this.api}/courses/${courseId}/progress`); }
}
