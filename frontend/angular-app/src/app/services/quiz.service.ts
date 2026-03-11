import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private api = 'http://localhost:8005/api';

  constructor(private http: HttpClient) {}

  getQuizzesByChapter(chapterId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/chapters/${chapterId}/quizzes`);
  }
  getQuiz(id: number): Observable<any> { return this.http.get(`${this.api}/quizzes/${id}`); }
  getQuestions(quizId: number): Observable<any[]> { return this.http.get<any[]>(`${this.api}/quizzes/${quizId}/questions`); }
  startAttempt(quizId: number): Observable<any> { return this.http.post(`${this.api}/quizzes/${quizId}/attempts`, {}); }
  submitAttempt(quizId: number, attemptId: number, answers: any): Observable<any> {
    return this.http.post(`${this.api}/quizzes/${quizId}/attempts/${attemptId}/submit`, { answers });
  }
  myAttempts(quizId: number): Observable<any[]> { return this.http.get<any[]>(`${this.api}/quizzes/${quizId}/attempts/mine`); }
  getResults(quizId: number): Observable<any> { return this.http.get(`${this.api}/quizzes/${quizId}/results`); }
  createQuiz(data: any): Observable<any> { return this.http.post(`${this.api}/quizzes`, data); }
  addQuestion(quizId: number, data: any): Observable<any> { return this.http.post(`${this.api}/quizzes/${quizId}/questions`, data); }
  addOption(quizId: number, questionId: number, data: any): Observable<any> {
    return this.http.post(`${this.api}/quizzes/${quizId}/questions/${questionId}/options`, data);
  }
}
