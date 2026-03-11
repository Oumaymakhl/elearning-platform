import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private api = 'http://localhost:8002/api';

  constructor(private http: HttpClient) {}

  getExercises(subChapterId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/sub-chapters/${subChapterId}/exercises`);
  }
  getExercise(id: number): Observable<any> { return this.http.get(`${this.api}/exercises/${id}`); }
  getQuestions(exerciseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/exercises/${exerciseId}/questions`);
  }
  submitCode(exerciseId: number, questionId: number, code: string, language: string): Observable<any> {
    return this.http.post(`${this.api}/exercises/${exerciseId}/questions/${questionId}/submit`, { code, language });
  }
  mySubmissions(exerciseId: number, questionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/exercises/${exerciseId}/questions/${questionId}/my-submissions`);
  }
  allSubmissions(exerciseId: number, questionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/exercises/${exerciseId}/questions/${questionId}/all-submissions`);
  }
}
