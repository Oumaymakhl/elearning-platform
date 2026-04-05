import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingService } from '../../services/rating.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})
export class StarRatingComponent implements OnInit {
  @Input() courseId!: number;
  @Input() isEnrolled = false;
  @Input() showDistribution = false;
  @Input() showComments = false;

  @Output() ratingChanged = new EventEmitter<number>();

  averageRating: number | null = null;
  userRating = 0;
  hoverRating: number | null = null;
  comments: any[] = [];
  distribution: number[] = [0, 0, 0, 0, 0];

  get stars(): number[] {
    return [1,2,3,4,5];
  }

  get filledStarsOnly(): boolean {
    return Math.floor(this.userRating) === this.userRating;
  }

  constructor(private ratingService: RatingService, private auth: AuthService) {}

  ngOnInit() {
    this.loadRatings();
    if (this.isEnrolled) {
      this.loadUserRating();
    }
  }

  loadRatings() {
    this.ratingService.getCourseRatings(this.courseId).subscribe({
      next: (data: any) => {
        this.averageRating = data.average;
        this.distribution = this.computeDistribution(data.counts || [0,0,0,0,0]);
        if (this.showComments) {
          this.comments = data.comments || [];
        }
      },
      error: (err) => console.error('Erreur chargement notes', err)
    });
  }

  loadUserRating() {
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) return;
    this.ratingService.getUserRating(this.courseId, userId).subscribe({
      next: (rating: number) => this.userRating = rating,
      error: () => this.userRating = 0
    });
  }

  setRating(value: number) {
    if (!this.isEnrolled) {
      alert('Vous devez être inscrit pour noter ce cours.');
      return;
    }
    this.ratingService.submitRating(this.courseId, value).subscribe({
      next: () => {
        this.userRating = value;
        this.ratingChanged.emit(value);
        this.loadRatings();
      },
      error: (err) => alert('Erreur lors de l’enregistrement : ' + err.message)
    });
  }

  computeDistribution(counts: number[]): number[] {
    const total = counts.reduce((a,b) => a+b, 0);
    if (total === 0) return [0,0,0,0,0];
    return counts.map(c => (c / total) * 100);
  }
}
