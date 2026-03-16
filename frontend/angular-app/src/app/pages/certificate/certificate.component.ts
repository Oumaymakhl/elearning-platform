import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">

        <!-- Loading -->
        <div class="loading" *ngIf="loading">
          <div class="spinner"></div>
          <p>Vérification en cours...</p>
        </div>

        <!-- Non éligible -->
        <div class="not-eligible" *ngIf="!loading && !eligible">
          <div class="ne-icon">📚</div>
          <h2>Certificat non disponible</h2>
          <p>Vous avez complété <strong>{{ completed }}</strong> TD(s) sur <strong>{{ total }}</strong>.</p>
          <p>Terminez tous les TDs du cours pour obtenir votre certificat.</p>
          <div class="progress-wrap">
            <div class="progress-bar">
              <div class="progress-fill" [style.width]="(total > 0 ? completed/total*100 : 0) + '%'"></div>
            </div>
            <span>{{ total > 0 ? (completed/total*100 | number:'1.0-0') : 0 }}%</span>
          </div>
          <a [routerLink]="['/courses', courseId]" class="btn-back">← Retour au cours</a>
        </div>

        <!-- Certificat -->
        <div class="cert-wrap" *ngIf="!loading && eligible && certificate">
          <div class="cert-actions">
            <button class="btn-print" (click)="print()">🖨️ Imprimer</button>
            <a [routerLink]="['/courses', courseId]" class="btn-back-link">← Retour au cours</a>
          </div>

          <div class="certificate" id="certificate">
            <div class="cert-border">


              <div class="cert-header">
                <div class="cert-logo">🎓</div>
                <h1 class="cert-platform">E-Learning Platform</h1>
                <p class="cert-subtitle">Certificat de Réussite</p>
              </div>

              <div class="cert-body">
                <p class="cert-presents">Ce certificat est décerné à</p>
                <h2 class="cert-name">{{ certificate.student_name }}</h2>
                <p class="cert-text">pour avoir complété avec succès tous les travaux dirigés du cours</p>
                <h3 class="cert-course">{{ certificate.course_title }}</h3>

                <div class="cert-stats">
                  <div class="cert-stat">
                    <div class="cert-stat-value">{{ total }}</div>
                    <div class="cert-stat-label">TDs complétés</div>
                  </div>
                  <div class="cert-stat">
                    <div class="cert-stat-value">100%</div>
                    <div class="cert-stat-label">Taux de réussite</div>
                  </div>
                </div>

                <p class="cert-date">Délivré le {{ formatDate(certificate.issued_at) }}</p>
              </div>

              <div class="cert-footer">
                <div class="cert-sig-left">
                  <div class="cert-sig-line"></div>
                  <div class="cert-sig-name">E-Learning Platform</div>
                  <div class="cert-sig-label">Responsable Formation</div>
                </div>
                <div class="cert-center">
                  <div class="cert-badge"><span>🏆</span></div>
                  <div class="cert-number">N° {{ certificate.certificate_number }}</div>
                </div>
                <div class="cert-sig-right">
                  <div class="cert-sig-auto">E-Learning</div>
                  <div class="cert-sig-line"></div>

                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; padding:2rem; background:#f8f9fa; }
    .loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4rem; gap:1rem; color:#64748b; }
    .spinner { width:40px; height:40px; border:4px solid #e2e8f0; border-top-color:#1E3A5F; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Non éligible */
    .not-eligible { max-width:500px; margin:3rem auto; text-align:center; background:white; padding:2.5rem; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .ne-icon { font-size:3rem; margin-bottom:1rem; }
    .not-eligible h2 { color:#1E3A5F; margin:0 0 1rem; }
    .not-eligible p { color:#64748b; margin:0 0 .5rem; }
    .progress-wrap { display:flex; align-items:center; gap:1rem; margin:1.5rem 0; }
    .progress-bar { flex:1; height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden; }
    .progress-fill { height:100%; background:#1E3A5F; border-radius:5px; transition:width .3s; }
    .btn-back { display:inline-block; margin-top:1rem; background:#1E3A5F; color:white; padding:.75rem 1.5rem; border-radius:8px; text-decoration:none; font-weight:600; }

    /* Actions */
    .cert-actions { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .btn-print { background:#1E3A5F; color:white; border:none; padding:.6rem 1.2rem; border-radius:8px; cursor:pointer; font-size:.9rem; }
    .btn-print:hover { background:#0f2544; }
    .btn-back-link { color:#1E3A5F; text-decoration:none; font-size:.9rem; }

    /* Certificat */
    .cert-wrap { max-width:860px; margin:0 auto; }
    .cert-actions { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .certificate { background:white; border-radius:4px; box-shadow:0 10px 40px rgba(0,0,0,.12); }
    .cert-border {
      border:14px solid #1E3A5F;
      padding:3.5rem;
      text-align:center;
      position:relative;
      background: linear-gradient(145deg, #ffffff 0%, #f8faff 100%);
    }
    .cert-border::before {
      content:'';
      position:absolute;
      inset:10px;
      border:1.5px solid #4A90D9;
      pointer-events:none;
    }


    /* Header */
    .cert-header { margin-bottom:2rem; }
    .cert-logo { font-size:3.5rem; margin-bottom:.5rem; filter:drop-shadow(0 2px 4px rgba(0,0,0,.1)); }
    .cert-platform { color:#1E3A5F; font-size:2rem; margin:.25rem 0; font-weight:800; letter-spacing:.08em; }
    .cert-subtitle { color:#4A90D9; font-size:.85rem; letter-spacing:.25em; text-transform:uppercase; margin:0; font-weight:600; }

    /* Divider */


    /* Body */
    .cert-body { padding:1rem 2rem 2rem; }
    .cert-presents { color:#64748b; font-size:.95rem; margin:0 0 .75rem; font-style:italic; }
    .cert-name { color:#1E3A5F; font-size:2.8rem; font-weight:800; margin:.25rem 0 1.5rem; font-style:italic; font-family:Georgia, serif; text-shadow:1px 1px 2px rgba(30,58,95,.1); }
    .cert-text { color:#64748b; font-size:.95rem; margin:0 0 .5rem; }
    .cert-course { color:#1E3A5F; font-size:1.5rem; font-weight:700; margin:.5rem 0 1.5rem; }

    /* Stats */
    .cert-stats { display:flex; justify-content:center; gap:3rem; margin:1.5rem 0; padding:1rem; background:#f0f4ff; border-radius:10px; }
    .cert-stat { text-align:center; }
    .cert-stat-value { font-size:1.4rem; font-weight:800; color:#1E3A5F; }
    .cert-stat-label { font-size:.72rem; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }

    .cert-date { color:#64748b; font-size:.88rem; margin:1rem 0 0; }

    /* Footer */
    .cert-footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:2rem; padding-top:1.5rem; border-top:2px solid #e2e8f0; gap:1rem; }
    .cert-sig-left, .cert-sig-right { text-align:center; flex:1; }
    .cert-sig-line { width:120px; height:1.5px; background:#1E3A5F; margin:.5rem auto .3rem; }
    .cert-sig-name { font-size:.82rem; font-weight:700; color:#1E3A5F; margin-bottom:.1rem; }
    .cert-sig-label { font-size:.68rem; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; }
    .cert-sig-auto { font-family:Georgia, serif; font-size:1.4rem; font-style:italic; color:#1E3A5F; line-height:1; }
    .cert-center { text-align:center; flex-shrink:0; }
    .cert-badge { width:75px; height:75px; border-radius:50%; border:3px solid #1E3A5F; display:flex; align-items:center; justify-content:center; font-size:2rem; margin:0 auto .4rem; background:linear-gradient(135deg,#f0f4ff,#fff); }
    .cert-number { color:#94a3b8; font-size:.7rem; letter-spacing:.08em; }


    @media print {
      .cert-actions { display:none; }
      .layout { display:block; }
      app-sidebar { display:none; }
      .main { margin:0; padding:0; }
      .certificate { box-shadow:none; }
    }
  `]
})
export class CertificateComponent implements OnInit {
  courseId!: number;
  loading = true;
  eligible = false;
  certificate: any = null;
  total = 0;
  completed = 0;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.courseId = +this.route.snapshot.paramMap.get('id')!;
    this.courseService.checkCertificate(this.courseId).subscribe({
      next: (res) => {
        this.eligible = res.eligible;
        this.certificate = res.certificate;
        this.total = res.total;
        this.completed = res.completed;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  print() {
    window.print();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
