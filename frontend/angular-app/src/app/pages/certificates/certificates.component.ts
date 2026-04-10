import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">
        <div class="page-header">
          <div class="header-icon">🏆</div>
          <div>
            <h1 class="page-title">Mes Certificats</h1>
            <p class="page-sub">Tous vos certificats de réussite</p>
          </div>
        </div>

        <div class="loading" *ngIf="loading">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>

        <div class="empty" *ngIf="!loading && certificates.length === 0">
          <div class="empty-icon">📭</div>
          <h2>Aucun certificat</h2>
          <p>Complétez tous les TDs d'un cours pour obtenir votre certificat.</p>
          <a routerLink="/courses" class="btn-primary">Voir les cours</a>
        </div>

        <div class="certs-grid" *ngIf="!loading && certificates.length > 0">
          <div class="cert-card" *ngFor="let c of certificates">
            <div class="cert-card-top">
              <div class="cert-medal">🏆</div>
              <div class="cert-badge">Certifié</div>
            </div>
            <div class="cert-card-body">
              <div class="cert-platform">E-Learning Platform</div>
              <h3 class="cert-course-title">{{ c.course_title }}</h3>
              <div class="cert-student">{{ c.student_name }}</div>
              <div class="cert-info">
                <span class="cert-num">N° {{ c.certificate_number }}</span>
                <span class="cert-date">{{ formatDate(c.issued_at) }}</span>
              </div>
            </div>
            <div class="cert-card-footer">
              <a [routerLink]="['/courses', c.course_id, 'certificate']" class="btn-view">
                👁 Voir & Imprimer
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; padding:2.5rem; background:#f4f6fb; }

    .page-header { display:flex; align-items:center; gap:1.25rem; margin-bottom:2.5rem; }
    .header-icon { font-size:3rem; }
    .page-title { font-size:1.8rem; font-weight:900; color:#1a2340; margin:0 0 .25rem; }
    .page-sub { color:#64748b; margin:0; font-size:.95rem; }

    .loading { display:flex; flex-direction:column; align-items:center; padding:4rem; gap:1rem; color:#64748b; }
    .spinner { width:40px; height:40px; border:4px solid #e2e8f0; border-top-color:#1E3A5F; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .empty { text-align:center; padding:4rem 2rem; background:#fff; border-radius:20px; max-width:480px; margin:0 auto; box-shadow:0 4px 20px rgba(0,0,0,.06); }
    .empty-icon { font-size:3.5rem; margin-bottom:1rem; }
    .empty h2 { color:#1a2340; margin:0 0 .5rem; }
    .empty p { color:#64748b; margin:0 0 1.5rem; }
    .btn-primary { background:linear-gradient(135deg,#1E3A5F,#4361ee); color:#fff; padding:.75rem 1.5rem; border-radius:10px; text-decoration:none; font-weight:700; }

    .certs-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1.5rem; }

    .cert-card { background:#fff; border-radius:20px; box-shadow:0 4px 24px rgba(30,58,95,.10); overflow:hidden; border:1px solid #e8ecf3; transition:transform .2s, box-shadow .2s; }
    .cert-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(30,58,95,.15); }

    .cert-card-top { background:linear-gradient(135deg,#1E3A5F,#4361ee); padding:2rem; text-align:center; position:relative; }
    .cert-medal { font-size:3.5rem; filter:drop-shadow(0 4px 8px rgba(0,0,0,.3)); }
    .cert-badge { position:absolute; top:1rem; right:1rem; background:rgba(255,255,255,.2); color:#fff; font-size:.72rem; font-weight:700; padding:.25rem .7rem; border-radius:20px; letter-spacing:.08em; text-transform:uppercase; border:1px solid rgba(255,255,255,.3); }

    .cert-card-body { padding:1.5rem; }
    .cert-platform { font-size:.72rem; font-weight:700; color:#4361ee; text-transform:uppercase; letter-spacing:.1em; margin-bottom:.5rem; }
    .cert-course-title { font-size:1.1rem; font-weight:800; color:#1a2340; margin:0 0 .5rem; line-height:1.3; }
    .cert-student { font-size:.9rem; color:#64748b; font-style:italic; margin-bottom:1rem; }
    .cert-info { display:flex; justify-content:space-between; align-items:center; padding-top:.75rem; border-top:1px solid #f0f4ff; }
    .cert-num { font-size:.7rem; color:#94a3b8; font-family:monospace; }
    .cert-date { font-size:.75rem; color:#64748b; font-weight:600; }

    .cert-card-footer { padding:1rem 1.5rem; background:#f8faff; border-top:1px solid #f0f4ff; }
    .btn-view { display:block; text-align:center; background:linear-gradient(135deg,#1E3A5F,#4361ee); color:#fff; padding:.7rem; border-radius:10px; text-decoration:none; font-weight:700; font-size:.88rem; transition:.2s; }
    .btn-view:hover { opacity:.9; transform:translateY(-1px); }
  `]
})
export class CertificatesComponent implements OnInit {
  certificates: any[] = [];
  loading = true;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '';
    this.http.get<any[]>('/api/certificates', {
      headers: { Authorization: 'Bearer ' + token }
    }).subscribe({
      next: (certs) => { this.certificates = certs; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
