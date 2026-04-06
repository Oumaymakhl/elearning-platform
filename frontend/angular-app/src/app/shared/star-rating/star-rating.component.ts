import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingService, RatingStats } from '../../services/rating.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rc">

      <!-- Résumé compact horizontal -->
      <div class="summary" *ngIf="stats">
        <div class="summary-left">
          <div class="big-score">{{ stats.average ?? '–' }}</div>
          <div class="big-stars">
            <span *ngFor="let s of [1,2,3,4,5]" class="star" [class.filled]="s <= (stats.average ?? 0)">★</span>
          </div>
          <div class="total-count">{{ stats.count }} avis</div>
        </div>
        <div class="summary-right" *ngIf="stats.count > 0">
          <div class="dist-row" *ngFor="let s of [5,4,3,2,1]">
            <div class="dist-stars">
              <span *ngFor="let x of [1,2,3,4,5]" class="star xs" [class.filled]="x <= s">★</span>
            </div>
            <div class="dist-bar-wrap">
              <div class="dist-bar-fill" [style.width.%]="(stats.distribution[s] / stats.count) * 100"></div>
            </div>
            <span class="dist-num">{{ stats.distribution[s] }}</span>
          </div>
        </div>
      </div>

      <!-- Formulaire compact -->
      <div class="form-section" *ngIf="canRate">
        <div class="form-row">
          <span class="form-label">{{ myRating ? 'Modifier :' : 'Votre note :' }}</span>
          <div class="stars-input">
            <span *ngFor="let s of [1,2,3,4,5]"
              class="star-pick" [class.filled]="s <= (hoverStar || selectedStar)"
              (mouseenter)="hoverStar = s" (mouseleave)="hoverStar = 0"
              (click)="selectStar(s)">★</span>
            <span class="star-hint" *ngIf="hoverStar > 0">{{ labels[hoverStar-1] }}</span>
            <span class="star-hint" *ngIf="!hoverStar && selectedStar > 0">{{ labels[selectedStar-1] }}</span>
          </div>
        </div>
        <div class="comment-wrap" *ngIf="selectedStar > 0">
          <textarea [(ngModel)]="comment" rows="2" maxlength="500"
            placeholder="Partagez votre expérience..."></textarea>
          <div class="form-actions">
            <button class="btn-save" (click)="submit()" [disabled]="submitting">
              {{ submitting ? 'Envoi...' : (myRating ? '✓ Mettre à jour' : '✓ Publier') }}
            </button>
            <button class="btn-del" *ngIf="myRating" (click)="remove()">🗑 Supprimer</button>
          </div>
        </div>
        <div class="alert ok" *ngIf="ok">✓ {{ ok }}</div>
        <div class="alert err" *ngIf="err">✕ {{ err }}</div>
      </div>

      <!-- Avis récents avec nom -->
      <div class="comments-section" *ngIf="stats && stats.comments.length > 0">
        <div class="comments-header">💬 Avis récents</div>
        <div class="comment-card" *ngFor="let c of stats.comments">
          <div class="comment-top">
            <div class="avatar">{{ getInitials(c.user_name) }}</div>
            <div class="comment-meta">
              <div class="comment-author">{{ c.user_name || 'Étudiant' }}</div>
              <div class="comment-stars">
                <span *ngFor="let s of [1,2,3,4,5]" class="star sm" [class.filled]="s <= c.stars">★</span>
                <span class="comment-date">· {{ c.updated_at | date:'dd MMM yyyy' }}</span>
              </div>
            </div>
          </div>
          <p class="comment-text">{{ c.comment }}</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .rc { font-family: inherit; }

    /* ── Résumé compact ── */
    .summary {
      display: flex; gap: 1.5rem; align-items: center;
      background: linear-gradient(135deg, #f8faff, #eef1ff);
      border-radius: 10px; padding: 1rem 1.2rem;
      margin-bottom: 1rem; border: 1px solid #dde3ff;
    }
    .summary-left { text-align: center; flex-shrink: 0; }
    .big-score { font-size: 2.5rem; font-weight: 800; color: #1a2340; line-height: 1; }
    .big-stars { display: flex; justify-content: center; gap: 2px; margin: .3rem 0; }
    .total-count { font-size: .72rem; color: #8a9bbf; }
    .summary-right { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .dist-row { display: flex; align-items: center; gap: 6px; }
    .dist-stars { display: flex; gap: 1px; flex-shrink: 0; }
    .dist-bar-wrap { flex: 1; height: 6px; background: #e0e4f0; border-radius: 3px; overflow: hidden; }
    .dist-bar-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 3px; transition: width .4s; }
    .dist-num { font-size: 11px; color: #8a9bbf; width: 12px; text-align: right; }

    /* ── Stars ── */
    .star { font-size: 20px; color: #e0e4f0; line-height: 1; }
    .star.filled { color: #f59e0b; }
    .star.xs { font-size: 10px; color: #e0e4f0; }
    .star.xs.filled { color: #f59e0b; }
    .star.sm { font-size: 13px; color: #e0e4f0; }
    .star.sm.filled { color: #f59e0b; }

    /* ── Formulaire compact ── */
    .form-section {
      background: #fff; border: 1px solid #e8ecf3;
      border-radius: 10px; padding: .9rem 1.2rem; margin-bottom: 1rem;
    }
    .form-row { display: flex; align-items: center; gap: .8rem; flex-wrap: wrap; }
    .form-label { font-size: .82rem; font-weight: 600; color: #4a5568; flex-shrink: 0; }
    .stars-input { display: flex; align-items: center; gap: 2px; }
    .star-pick { font-size: 28px; cursor: pointer; color: #e0e4f0; transition: color .1s, transform .1s; line-height: 1; }
    .star-pick:hover { transform: scale(1.2); }
    .star-pick.filled { color: #f59e0b; }
    .star-hint { font-size: .78rem; color: #4361ee; font-weight: 500; margin-left: .4rem; }
    .comment-wrap { margin-top: .7rem; }
    textarea {
      width: 100%; box-sizing: border-box; border: 1.5px solid #e8ecf3;
      border-radius: 8px; padding: .6rem .9rem; font-size: .85rem;
      color: #1a2340; resize: none; outline: none; font-family: inherit;
      background: #f8fafc; transition: border-color .15s;
    }
    textarea:focus { border-color: #4361ee; background: #fff; }
    .form-actions { display: flex; gap: .6rem; margin-top: .6rem; align-items: center; }
    .btn-save {
      padding: .45rem 1.1rem;
      background: linear-gradient(135deg, #4361ee, #3451d1);
      color: #fff; border: none; border-radius: 7px;
      font-size: .82rem; font-weight: 600; cursor: pointer;
      box-shadow: 0 2px 6px rgba(67,97,238,.2); transition: opacity .2s;
    }
    .btn-save:hover { opacity: .9; }
    .btn-save:disabled { opacity: .6; cursor: not-allowed; }
    .btn-del {
      padding: .45rem .9rem; background: transparent; color: #e53e3e;
      border: 1px solid #feb2b2; border-radius: 7px;
      font-size: .82rem; cursor: pointer; transition: background .15s;
    }
    .btn-del:hover { background: #fff5f5; }
    .alert { margin-top: .6rem; padding: .45rem .9rem; border-radius: 7px; font-size: .82rem; font-weight: 500; }
    .ok { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .err { background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2; }

    /* ── Commentaires ── */
    .comments-section { margin-top: .5rem; }
    .comments-header { font-size: .88rem; font-weight: 700; color: #1a2340; margin-bottom: .8rem; padding-bottom: .5rem; border-bottom: 2px solid #eef1ff; }
    .comment-card { background: #f8fafc; border-radius: 9px; padding: .8rem 1rem; margin-bottom: .6rem; border: 1px solid #e8ecf3; transition: box-shadow .15s; }
    .comment-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.05); }
    .comment-top { display: flex; align-items: center; gap: .7rem; margin-bottom: .5rem; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #4361ee, #7b8ff7);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: .75rem; font-weight: 700; flex-shrink: 0; letter-spacing: .02em;
    }
    .comment-meta { display: flex; flex-direction: column; gap: 2px; }
    .comment-author { font-size: .85rem; font-weight: 600; color: #1a2340; }
    .comment-stars { display: flex; align-items: center; gap: 2px; }
    .comment-date { font-size: .72rem; color: #8a9bbf; margin-left: .3rem; }
    .comment-text { font-size: .84rem; color: #4a5568; margin: 0; line-height: 1.55; }
  `]
})
export class StarRatingComponent implements OnInit, OnChanges {
  @Input() courseId!: number;
  @Input() isEnrolled = false;
  @Output() ratingChanged = new EventEmitter<number>();

  stats: RatingStats | null = null;
  myRating: { stars: number; comment: string } | null = null;
  selectedStar = 0;
  hoverStar = 0;
  comment = '';
  submitting = false;
  ok = '';
  err = '';
  labels = ['Décevant', 'Passable', 'Correct', 'Très bien', 'Excellent !'];

  get canRate(): boolean { return this.isEnrolled && this.auth.isStudent(); }

  constructor(private rs: RatingService, private auth: AuthService) {}
  ngOnInit(): void { this.load(); }
  ngOnChanges(): void { this.load(); }

  getInitials(name: string): string {
    if (!name) return 'E';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  load(): void {
    if (!this.courseId) return;
    this.rs.getStats(this.courseId).subscribe({
      next: (s: RatingStats) => { this.stats = s; },
      error: () => {}
    });
    if (this.isEnrolled && this.auth.isStudent()) {
      this.rs.getMyRating(this.courseId).subscribe({
        next: (r: { stars: number; comment: string } | null) => {
          if (r) { this.myRating = r; this.selectedStar = r.stars; this.comment = r.comment || ''; }
        },
        error: () => {}
      });
    }
  }

  selectStar(s: number): void { this.selectedStar = s; this.ok = ''; this.err = ''; }

  submit(): void {
    if (!this.selectedStar) return;
    this.submitting = true;
    this.rs.rate(this.courseId, this.selectedStar, this.comment || undefined).subscribe({
      next: () => {
        this.submitting = false; this.ok = 'Avis publié !';
        this.myRating = { stars: this.selectedStar, comment: this.comment };
        this.ratingChanged.emit(this.selectedStar); this.load();
      },
      error: (e: { error?: { message?: string } }) => {
        this.submitting = false;
        this.err = e.error?.message ?? 'Erreur lors de l\'envoi.';
      }
    });
  }

  remove(): void {
    if (!confirm('Supprimer votre avis ?')) return;
    this.rs.deleteRating(this.courseId).subscribe({
      next: () => {
        this.myRating = null; this.selectedStar = 0; this.comment = '';
        this.ok = 'Avis supprimé.'; this.ratingChanged.emit(0); this.load();
      },
      error: () => { this.err = 'Erreur lors de la suppression.'; }
    });
  }
}
