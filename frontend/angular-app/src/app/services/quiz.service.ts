import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private api = '/api/quizzes';

  constructor(private http: HttpClient) {}

  getQuizzesByChapter(chapterId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/chapters/${chapterId}/quizzes`);
  }
  getQuiz(id: number): Observable<any> { return this.http.get(`${this.api}/${id}`); }
  getQuestions(quizId: number): Observable<any[]> { return this.http.get<any[]>(`${this.api}/${quizId}/questions`); }
  startAttempt(quizId: number): Observable<any> { return this.http.post(`${this.api}/${quizId}/attempts`, {}); }
  submitAttempt(quizId: number, attemptId: number, answers: any): Observable<any> {
    return this.http.post(`${this.api}/${quizId}/attempts/${attemptId}/submit`, { answers });
  }
  myAttempts(quizId: number): Observable<any[]> { return this.http.get<any[]>(`${this.api}/${quizId}/attempts/mine`); }
  getResults(quizId: number): Observable<any> { return this.http.get(`${this.api}/${quizId}/results`); }
  createQuiz(data: any): Observable<any> { return this.http.post(`${this.api}`, data); }
  addQuestion(quizId: number, data: any): Observable<any> { return this.http.post(`${this.api}/${quizId}/questions`, data); }
  addOption(quizId: number, questionId: number, data: any): Observable<any> {
    return this.http.post(`${this.api}/${quizId}/questions/${questionId}/options`, data);
  }
}
