import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="success-page">
      <div class="success-card" [class.visible]="visible">
        <div class="icon-wrapper">
          <div class="circle-bg">
            <svg viewBox="0 0 52 52" class="checkmark">
              <circle cx="26" cy="26" r="25" fill="none" class="checkmark-circle"/>
              <path fill="none" d="M14 27l7 7 16-16" class="checkmark-check"/>
            </svg>
          </div>
        </div>

        <h1 class="title">Paiement réussi !</h1>
        <p class="subtitle">Félicitations ! Votre accès au cours a été activé.</p>

        <div class="info-box">
          <div class="info-row">
            <span class="info-icon">📚</span>
            <span>Cours débloqué et prêt à commencer</span>
          </div>
          <div class="info-row">
            <span class="info-icon">🏆</span>
            <span>Certificat disponible après complétion</span>
          </div>
        </div>

        <div class="actions">
          <button *ngIf="courseId" class="btn-primary" (click)="goToCourse()">
            🚀 Accéder au cours
          </button>
          <a routerLink="/courses" class="btn-secondary">
            📚 Tous mes cours
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: 'Segoe UI', sans-serif;
    }
    .success-card {
      background: white;
      border-radius: 24px;
      padding: 3rem 2.5rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0,0,0,0.2);
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .success-card.visible { opacity: 1; transform: translateY(0); }
    .circle-bg {
      width: 90px; height: 90px; border-radius: 50%;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 8px 25px rgba(74,222,128,0.4);
    }
    .checkmark { width: 50px; height: 50px; }
    .checkmark-circle {
      stroke: white; stroke-width: 2;
      stroke-dasharray: 166; stroke-dashoffset: 166;
      animation: stroke 0.6s ease forwards 0.3s;
    }
    .checkmark-check {
      stroke: white; stroke-width: 3;
      stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: 48; stroke-dashoffset: 48;
      animation: stroke 0.4s ease forwards 0.8s;
    }
    @keyframes stroke { to { stroke-dashoffset: 0; } }
    .title { font-size: 2rem; font-weight: 800; color: #1a1a2e; margin: 0 0 0.5rem; }
    .subtitle { color: #6b7280; font-size: 1rem; margin-bottom: 2rem; }
    .info-box {
      background: #f8faff; border: 1px solid #e0e7ff;
      border-radius: 16px; padding: 1.2rem 1.5rem; margin-bottom: 2rem; text-align: left;
    }
    .info-row {
      display: flex; align-items: center; gap: 0.8rem;
      padding: 0.5rem 0; color: #374151; font-size: 0.9rem;
    }
    .info-row + .info-row { border-top: 1px solid #e0e7ff; }
    .actions { display: flex; flex-direction: column; gap: 0.8rem; }
    .btn-primary {
      background: linear-gradient(135deg, #6772e5, #4361ee);
      color: white; padding: 0.9rem 2rem; border-radius: 12px;
      font-weight: 700; font-size: 1rem; border: none; cursor: pointer;
      transition: all 0.2s; box-shadow: 0 4px 15px rgba(99,114,229,0.4);
    }
    .btn-primary:hover { transform: translateY(-2px); }
    .btn-secondary {
      background: #f3f4f6; color: #374151; padding: 0.9rem 2rem;
      border-radius: 12px; font-weight: 600; font-size: 1rem;
      text-decoration: none; display: block; transition: all 0.2s;
    }
    .btn-secondary:hover { background: #e5e7eb; }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  visible = false;
  courseId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    setTimeout(() => this.visible = true, 100);

    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    const courseIdParam = this.route.snapshot.queryParamMap.get('course_id');

    if (courseIdParam) {
      this.courseId = parseInt(courseIdParam);
    }

    // Confirmer le paiement et inscrire au cours
    if (sessionId) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.get(`/api/payments/success?session_id=${sessionId}`, { headers }).subscribe({
        next: (res: any) => {
          console.log('Paiement confirmé:', res);
        },
        error: (e) => console.error('Erreur confirmation:', e)
      });
    }
  }

  goToCourse() {
    if (this.courseId) {
      this.router.navigate(['/courses', this.courseId]);
    }
  }
}
