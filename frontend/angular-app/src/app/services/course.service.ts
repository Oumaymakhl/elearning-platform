import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of , catchError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private api = '/api/courses';
  private baseApi = '/api';

  constructor(private http: HttpClient) {}

  getCourses(): Observable<any[]>        { return this.http.get<any[]>(`${this.api}`); }
  getCourse(id: number): Observable<any> { return this.http.get(`${this.api}/${id}`); }
  createCourse(data: any): Observable<any>             { return this.http.post(`${this.api}`, data); }
  updateCourse(id: number, data: any): Observable<any> { return this.http.put(`${this.api}/${id}`, data); }
  deleteCourse(id: number): Observable<any>            { return this.http.delete(`${this.api}/${id}`); }

  getChapters(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${courseId}/chapters`);
  }
  createChapter(courseId: number, data: any): Observable<any> {
    return this.http.post(`${this.api}/${courseId}/chapters`, data);
  }
  deleteChapter(courseId: number, chapterId: number): Observable<any> {
    return this.http.delete(`${this.api}/${courseId}/chapters/${chapterId}`);
  }

  getSubChapters(courseId: number, chapterId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${courseId}/chapters/${chapterId}/subchapters`);
  }
  createSubChapter(courseId: number, chapterId: number, data: any): Observable<any> {
    return this.http.post(`${this.api}/${courseId}/chapters/${chapterId}/subchapters`, data);
  }
  updateSubChapter(courseId: number, chapterId: number, subId: number, body: any): Observable<any> {
    return this.http.put(`${this.api}/${courseId}/chapters/${chapterId}/subchapters/${subId}`, body);
  }
  deleteSubChapter(courseId: number, chapterId: number, subId: number): Observable<any> {
    return this.http.delete(`${this.api}/${courseId}/chapters/${chapterId}/subchapters/${subId}`);
  }

  enroll(courseId: number): Observable<any>   { return this.http.post(`${this.api}/${courseId}/enroll`, {}); }
  unenroll(courseId: number): Observable<any> { return this.http.delete(`${this.api}/${courseId}/enroll`); }
  myCourses(): Observable<any[]>              { return this.http.get<any[]>(`${this.baseApi}/my-courses`); }

  getVisitedSubs(courseId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.api}/${courseId}/visited-subs`);
  }
  markSubVisited(courseId: number, subId: number): Observable<any> {
    return this.http.post(`${this.api}/${courseId}/visited-subs/${subId}`, {});
  }
  updateProgress(courseId: number, data: any): Observable<any> {
    return this.http.post(`${this.api}/${courseId}/progress`, data);
  }
  getProgress(courseId: number): Observable<any> {
    return this.http.get(`${this.api}/${courseId}/progress`).pipe(
      catchError(() => of(null))
    );
  }

  getRatings(courseId: number): Observable<any>  { return this.http.get(`${this.api}/${courseId}/ratings`); }
  getMyRating(courseId: number): Observable<any> { return this.http.get(`${this.api}/${courseId}/ratings/mine`); }
  rateCourse(courseId: number, data: any): Observable<any> { return this.http.post(`${this.api}/${courseId}/ratings`, data); }
  deleteRating(courseId: number): Observable<any> { return this.http.delete(`${this.api}/${courseId}/ratings`); }

  getCourseStudents(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${courseId}/students`);
  }

  checkCertificate(courseId: number): Observable<any> {
    return this.http.post(`${this.api}/${courseId}/certificate/check`, {});
  }
  getCertificate(courseId: number): Observable<any> {
    return this.http.get(`${this.api}/${courseId}/certificate`);
  }
  getMyCertificates(): Observable<any[]> { return this.http.get<any[]>(`${this.baseApi}/certificates`); }

  getTeacherAnalytics(): Observable<any>               { return this.http.get(`${this.baseApi}/analytics/teacher`); }
  getCourseAnalytics(courseId: number): Observable<any> { return this.http.get(`${this.baseApi}/analytics/courses/${courseId}`); }

  createExercise(data: any): Observable<any>             { return this.http.post(`${this.baseApi}/exercises`, data); }
  updateExercise(id: number, data: any): Observable<any> { return this.http.put(`${this.baseApi}/exercises/${id}`, data); }
  deleteExercise(id: number): Observable<any>            { return this.http.delete(`${this.baseApi}/exercises/${id}`); }
  getExercise(id: number): Observable<any>               { return this.http.get(`${this.baseApi}/exercises/${id}`); }
  createQuestion(exerciseId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseApi}/exercises/${exerciseId}/questions`, data);
  }
  deleteQuestion(exerciseId: number, questionId: number): Observable<any> {
    return this.http.delete(`${this.baseApi}/exercises/${exerciseId}/questions/${questionId}`);
  }
  createTestCase(exerciseId: number, questionId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseApi}/exercises/${exerciseId}/questions/${questionId}/test-cases`, data);
  }
  deleteTestCase(exerciseId: number, questionId: number, testCaseId: number): Observable<any> {
    return this.http.delete(`${this.baseApi}/exercises/${exerciseId}/questions/${questionId}/test-cases/${testCaseId}`);
  }
}
