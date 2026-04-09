import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RatingStats {
  average: number | null;
  count: number;
  distribution: { [key: number]: number };
  comments: { stars: number; comment: string; updated_at: string; user_name: string; avatar_url?: string | null }[];
}

@Injectable({ providedIn: 'root' })
export class RatingService {
  private api = '/api/courses';
  constructor(private http: HttpClient) {}

  getStats(courseId: number): Observable<RatingStats> {
    return this.http.get<RatingStats>(`${this.api}/${courseId}/ratings`);
  }
  getMyRating(courseId: number): Observable<{ stars: number; comment: string } | null> {
    return this.http.get<any>(`${this.api}/${courseId}/ratings/mine`);
  }
  rate(courseId: number, stars: number, comment?: string): Observable<any> {
    return this.http.post(`${this.api}/${courseId}/ratings`, { stars, comment });
  }
  deleteRating(courseId: number): Observable<any> {
    return this.http.delete(`${this.api}/${courseId}/ratings`);
  }
}
