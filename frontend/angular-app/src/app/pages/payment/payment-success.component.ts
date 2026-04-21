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
        <div class="confetti">
          <span *ngFor="let c of confetti" [style]="c">🎊</span>
        </div>

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
          <div class="info-row">
            <span class="info-icon">🤖</span>
            <span>Assistant IA inclus dans votre accès</span>
          </div>
        </div>

        <div class="actions">
          <a routerLink="/courses" class="btn-primary">
            🚀 Accéder à mes cours
          </a>
          <a routerLink="/dashboard" class="btn-secondary">
            📊 Tableau de bord
          </a>
        </div>

        <p class="note">Un email de confirmation a été envoyé à votre adresse.</p>
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
      position: relative;
      overflow: hidden;
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .success-card.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .confetti {
      position: absolute;
      top: 0; left: 0; right: 0;
      pointer-events: none;
    }

    .confetti span {
      position: absolute;
      font-size: 1.5rem;
      animation: fall 3s ease-in infinite;
      opacity: 0;
    }

    @keyframes fall {
      0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
    }

    .icon-wrapper {
      margin-bottom: 1.5rem;
    }

    .circle-bg {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      box-shadow: 0 8px 25px rgba(74,222,128,0.4);
      animation: pulse-green 2s infinite;
    }

    @keyframes pulse-green {
      0%, 100% { box-shadow: 0 8px 25px rgba(74,222,128,0.4); }
      50%       { box-shadow: 0 8px 40px rgba(74,222,128,0.7); }
    }

    .checkmark { width: 50px; height: 50px; }

    .checkmark-circle {
      stroke: white;
      stroke-width: 2;
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      animation: stroke 0.6s ease forwards 0.3s;
    }

    .checkmark-check {
      stroke: white;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: stroke 0.4s ease forwards 0.8s;
    }

    @keyframes stroke {
      to { stroke-dashoffset: 0; }
    }

    .title {
      font-size: 2rem;
      font-weight: 800;
      color: #1a1a2e;
      margin: 0 0 0.5rem;
    }

    .subtitle {
      color: #6b7280;
      font-size: 1rem;
      margin-bottom: 2rem;
    }

    .info-box {
      background: #f8faff;
      border: 1px solid #e0e7ff;
      border-radius: 16px;
      padding: 1.2rem 1.5rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.5rem 0;
      color: #374151;
      font-size: 0.9rem;
    }

    .info-row + .info-row {
      border-top: 1px solid #e0e7ff;
    }

    .info-icon { font-size: 1.2rem; }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      margin-bottom: 1.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6772e5, #4361ee);
      color: white;
      padding: 0.9rem 2rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1rem;
      text-decoration: none;
      display: block;
      transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(99,114,229,0.4);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99,114,229,0.5);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      padding: 0.9rem 2rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      text-decoration: none;
      display: block;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
      transform: translateY(-1px);
    }

    .note {
      color: #9ca3af;
      font-size: 0.8rem;
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  visible = false;
  confetti: string[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    setTimeout(() => this.visible = true, 100);
    this.generateConfetti();

    // Enroller automatiquement après paiement
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.get(`/api/payments/success?session_id=${sessionId}`, { headers }).subscribe();
    }
  }

  generateConfetti() {
    this.confetti = Array.from({ length: 12 }, (_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = 2 + Math.random() * 2;
      return `left:${left}%; animation-delay:${delay}s; animation-duration:${duration}s`;
    });
  }
}
