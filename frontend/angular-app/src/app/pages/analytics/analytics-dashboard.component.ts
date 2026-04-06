import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
 
@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">
 
        <div class="page-header">
          <div>
            <h1>📊 Analytics</h1>
            <p>Vue d'ensemble de tes cours et étudiants</p>
          </div>
          <div class="header-badge" [class.admin]="isAdmin">
            {{ isAdmin ? 'Vue administrateur' : 'Vue formateur' }}
          </div>
        </div>
 
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <span>Chargement des données…</span>
        </div>
 
        <ng-container *ngIf="!loading && stats">
 
          <div class="kpi-grid">
            <div class="kpi-card blue">
              <div class="kpi-icon">📚</div>
              <div class="kpi-value">{{ stats.summary.total_courses }}</div>
              <div class="kpi-label">Cours publiés</div>
            </div>
            <div class="kpi-card green">
              <div class="kpi-icon">👥</div>
              <div class="kpi-value">{{ stats.summary.total_enrollments }}</div>
              <div class="kpi-label">Inscriptions totales</div>
            </div>
            <div class="kpi-card purple">
              <div class="kpi-icon">✅</div>
              <div class="kpi-value">{{ stats.summary.completion_rate }}%</div>
              <div class="kpi-label">Taux de complétion</div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-icon">🔥</div>
              <div class="kpi-value">{{ stats.summary.active_students }}</div>
              <div class="kpi-label">Étudiants actifs</div>
            </div>
            <div class="kpi-card teal">
              <div class="kpi-icon">📈</div>
              <div class="kpi-value">{{ stats.summary.avg_progress }}%</div>
              <div class="kpi-label">Progression moyenne</div>
            </div>
            <div class="kpi-card coral">
              <div class="kpi-icon">🏆</div>
              <div class="kpi-value">{{ stats.summary.completed }}</div>
              <div class="kpi-label">Cours terminés</div>
            </div>
          </div>
 
          <div class="charts-row">
            <div class="chart-card wide">
              <div class="chart-header"><h2>Inscriptions — 6 derniers mois</h2></div>
              <div class="bar-chart" *ngIf="stats.enrollments_by_month.length > 0; else noData">
                <div class="bar-group" *ngFor="let m of stats.enrollments_by_month">
                  <div class="bar-wrap">
                    <div class="bar" [style.height]="getBarHeight(m.count, maxEnrollment) + 'px'" [title]="m.count + ' inscrits'"></div>
                    <span class="bar-val">{{ m.count }}</span>
                  </div>
                  <div class="bar-label">{{ formatMonth(m.month) }}</div>
                </div>
              </div>
              <ng-template #noData><div class="empty-chart">Aucune donnée disponible</div></ng-template>
            </div>
 
            <div class="chart-card narrow" *ngIf="quizStats">
              <div class="chart-header"><h2>Quiz globaux</h2></div>
              <div class="donut-wrap">
                <svg viewBox="0 0 120 120" class="donut">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#e2e8f0" stroke-width="14"/>
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#4A90D9" stroke-width="14"
                    [attr.stroke-dasharray]="passCircle + ' ' + (301.6 - passCircle)"
                    stroke-dashoffset="75.4" stroke-linecap="round"/>
                  <text x="60" y="56" text-anchor="middle" font-size="20" font-weight="700" fill="#1E3A5F">{{ quizStats.pass_rate }}%</text>
                  <text x="60" y="72" text-anchor="middle" font-size="9" fill="#94a3b8">taux de réussite</text>
                </svg>
              </div>
              <div class="quiz-row"><span class="quiz-dot blue"></span><span>Quizzes total</span><strong>{{ quizStats.total_quizzes }}</strong></div>
              <div class="quiz-row"><span class="quiz-dot green"></span><span>Tentatives</span><strong>{{ quizStats.total_attempts }}</strong></div>
              <div class="quiz-row"><span class="quiz-dot purple"></span><span>Complétées</span><strong>{{ quizStats.completed }}</strong></div>
            </div>
          </div>
 
          <div class="tables-row">
            <div class="table-card">
              <div class="chart-header"><h2>Top cours par inscriptions</h2></div>
              <table class="data-table">
                <thead><tr><th>#</th><th>Cours</th><th>Niveau</th><th>Inscrits</th></tr></thead>
                <tbody>
                  <tr *ngFor="let c of stats.top_courses; let i = index" [routerLink]="['/courses', c.id]" class="clickable">
                    <td><span class="rank" [class]="getRankClass(i)">{{ i + 1 }}</span></td>
                    <td class="course-title">{{ c.title }}</td>
                    <td><span class="level-badge" [class]="c.level">{{ formatLevel(c.level) }}</span></td>
                    <td><strong>{{ c.enrollments }}</strong></td>
                  </tr>
                  <tr *ngIf="stats.top_courses.length === 0"><td colspan="4" class="empty-row">Aucun cours</td></tr>
                </tbody>
              </table>
            </div>
 
            <div class="table-card">
              <div class="chart-header"><h2>Progression par cours</h2></div>
              <div class="completion-list">
                <div class="completion-item" *ngFor="let c of stats.completion_by_course">
                  <div class="completion-header">
                    <span class="completion-title">{{ c.title }}</span>
                    <span class="completion-pct">{{ c.completion_rate }}%</span>
                  </div>
                  <div class="completion-bar">
                    <div class="completion-fill"
                      [style.width]="c.completion_rate + '%'"
                      [class.high]="c.completion_rate >= 70"
                      [class.mid]="c.completion_rate >= 40 && c.completion_rate < 70"
                      [class.low]="c.completion_rate < 40">
                    </div>
                  </div>
                  <div class="completion-meta">{{ c.done }}/{{ c.total }} terminés · progression moy. {{ c.avg_progress }}%</div>
                </div>
                <div class="empty-row" *ngIf="stats.completion_by_course.length === 0">Aucune donnée</div>
              </div>
            </div>
          </div>
        </ng-container>
 
        <div class="error-state" *ngIf="!loading && error">
          <span>⚠️</span>
          <p>Impossible de charger les analytics.</p>
          <button (click)="load()">Réessayer</button>
        </div>
 
      </main>
    </div>
  `,
  styles: [`
    .layout{display:flex;min-height:100vh}
    .main{margin-left:260px;flex:1;padding:2rem;background:#f8f9fa}
    .page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem}
    .page-header h1{font-size:1.75rem;color:#1E3A5F;margin:0 0 .25rem}
    .page-header p{color:#64748b;margin:0;font-size:.9rem}
    .header-badge{padding:.35rem .9rem;border-radius:20px;font-size:.78rem;font-weight:600;background:#e0eaff;color:#1E3A5F}
    .header-badge.admin{background:#fef3c7;color:#92400e}
    .loading-state{display:flex;align-items:center;gap:1rem;padding:3rem;color:#64748b}
    .spinner{width:24px;height:24px;border:3px solid #e2e8f0;border-top-color:#4A90D9;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
    .kpi-card{background:white;border-radius:14px;padding:1.5rem;display:flex;flex-direction:column;gap:.4rem;box-shadow:0 2px 8px rgba(0,0,0,.05);border-top:4px solid}
    .kpi-card.blue{border-color:#4A90D9}.kpi-card.green{border-color:#10b981}.kpi-card.purple{border-color:#7c3aed}
    .kpi-card.amber{border-color:#f59e0b}.kpi-card.teal{border-color:#0d9488}.kpi-card.coral{border-color:#ef4444}
    .kpi-icon{font-size:1.5rem}.kpi-value{font-size:2rem;font-weight:800;color:#1E3A5F;line-height:1}.kpi-label{font-size:.82rem;color:#64748b}
    .charts-row{display:grid;grid-template-columns:1fr 280px;gap:1rem;margin-bottom:1.5rem}
    .chart-card{background:white;border-radius:14px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.05)}
    .chart-header h2{font-size:1rem;color:#1E3A5F;margin:0 0 1.25rem;font-weight:700}
    .bar-chart{display:flex;align-items:flex-end;gap:1rem;height:160px;padding-bottom:.5rem}
    .bar-group{display:flex;flex-direction:column;align-items:center;flex:1;gap:.25rem}
    .bar-wrap{display:flex;flex-direction:column;align-items:center;gap:.25rem;flex:1;justify-content:flex-end}
    .bar{width:100%;background:linear-gradient(180deg,#4A90D9,#1E3A5F);border-radius:6px 6px 0 0;min-height:4px;transition:height .4s}
    .bar-val{font-size:.72rem;font-weight:700;color:#1E3A5F}.bar-label{font-size:.72rem;color:#94a3b8;white-space:nowrap}
    .empty-chart{display:flex;align-items:center;justify-content:center;height:120px;color:#94a3b8;font-size:.85rem}
    .donut-wrap{display:flex;justify-content:center;margin-bottom:1rem}.donut{width:120px;height:120px}
    .quiz-row{display:flex;align-items:center;gap:.5rem;font-size:.85rem;color:#374151;padding:.3rem 0}
    .quiz-row strong{margin-left:auto;font-weight:700;color:#1E3A5F}
    .quiz-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
    .quiz-dot.blue{background:#4A90D9}.quiz-dot.green{background:#10b981}.quiz-dot.purple{background:#7c3aed}
    .tables-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    .table-card{background:white;border-radius:14px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.05)}
    .data-table{width:100%;border-collapse:collapse;font-size:.85rem}
    .data-table th{text-align:left;padding:.5rem .75rem;color:#94a3b8;font-weight:600;font-size:.75rem;text-transform:uppercase;border-bottom:1px solid #f1f5f9}
    .data-table td{padding:.65rem .75rem;border-bottom:1px solid #f8fafc;color:#374151}
    .data-table tr.clickable{cursor:pointer;transition:background .15s}.data-table tr.clickable:hover{background:#f8fafc}
    .course-title{font-weight:500;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .rank{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-weight:700;font-size:.78rem;background:#e2e8f0;color:#64748b}
    .rank.gold{background:#fef3c7;color:#92400e}.rank.silver{background:#f1f5f9;color:#475569}.rank.bronze{background:#fff7ed;color:#9a3412}
    .level-badge{padding:.2rem .5rem;border-radius:6px;font-size:.72rem;font-weight:600}
    .level-badge.debutant{background:#dcfce7;color:#166534}.level-badge.intermediaire{background:#fef3c7;color:#92400e}.level-badge.avance{background:#fee2e2;color:#991b1b}
    .empty-row{text-align:center;color:#94a3b8;font-size:.85rem;padding:1.5rem}
    .completion-list{display:flex;flex-direction:column;gap:1rem}
    .completion-item{display:flex;flex-direction:column;gap:.3rem}
    .completion-header{display:flex;justify-content:space-between;align-items:center}
    .completion-title{font-size:.85rem;font-weight:600;color:#1E3A5F;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}
    .completion-pct{font-size:.85rem;font-weight:700;color:#1E3A5F}
    .completion-bar{height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden}
    .completion-fill{height:100%;border-radius:4px;transition:width .4s}
    .completion-fill.high{background:#10b981}.completion-fill.mid{background:#f59e0b}.completion-fill.low{background:#ef4444}
    .completion-meta{font-size:.72rem;color:#94a3b8}
    .error-state{display:flex;flex-direction:column;align-items:center;gap:1rem;padding:4rem;color:#64748b}
    .error-state span{font-size:2rem}
    .error-state button{padding:.5rem 1.25rem;background:#1E3A5F;color:white;border:none;border-radius:8px;cursor:pointer}
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  stats: any = null;
  quizStats: any = null;
  loading = true;
  error = false;
 
  get isAdmin() { return this.auth.isAdmin(); }
  get maxEnrollment(): number {
    if (!this.stats?.enrollments_by_month?.length) return 1;
    return Math.max(...this.stats.enrollments_by_month.map((m: any) => m.count), 1);
  }
  get passCircle(): number {
    return this.quizStats ? (this.quizStats.pass_rate / 100) * 301.6 : 0;
  }
 
  constructor(private analyticsService: AnalyticsService, private auth: AuthService) {}
 
  ngOnInit() { this.load(); }
 
  load() {
    this.loading = true;
    this.error = false;
    this.analyticsService.getTeacherStats().subscribe({
      next: (data) => { this.stats = data; this.loading = false; },
      error: () => { this.error = true; this.loading = false; }
    });
    this.analyticsService.getGlobalQuizStats().subscribe({
      next: (data) => { this.quizStats = data; },
      error: () => {}
    });
  }
 
  getBarHeight(count: number, max: number): number {
    return Math.max(4, Math.round((count / max) * 120));
  }
  formatMonth(ym: string): string {
    const [year, month] = ym.split('-');
    const months = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
    return months[parseInt(month) - 1] + ' ' + year.slice(2);
  }
  formatLevel(level: string): string {
    const map: Record<string,string> = { debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé' };
    return map[level] ?? level;
  }
  getRankClass(i: number): string {
    return ['gold','silver','bronze'][i] ?? '';
  }
}
