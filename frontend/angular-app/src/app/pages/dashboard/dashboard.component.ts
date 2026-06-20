import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CourseService } from '../../services/course.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, FormsModule],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">

        <!-- ══ BANNIÈRE HERO ══ -->
        <div class="hero-banner">
          <div class="hero-content">
            <div class="hero-tag">{{ today }}</div>
            <h1 class="hero-title">Bonjour, <span class="hero-name">{{ user?.name }}</span> 👋</h1>
            <p class="hero-sub">
              {{ isAdmin ? 'Vue administrateur — Pilotez votre plateforme' :
                 isTeacher ? 'Vue formateur — Gérez vos cours et suivez vos étudiants' :
                 'Continuez votre apprentissage là où vous en étiez !' }}
            </p>
            <a *ngIf="isStudent" routerLink="/courses" class="hero-cta">
              Explorer les cours →
            </a>
          </div>
          <div class="hero-illustration">
            <svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
              <!-- Desk -->
              <rect x="40" y="170" width="240" height="12" rx="6" fill="rgba(255,255,255,0.15)"/>
              <!-- Monitor -->
              <rect x="100" y="90" width="120" height="80" rx="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
              <rect x="108" y="98" width="104" height="64" rx="4" fill="rgba(30,58,95,0.6)"/>
              <!-- Screen content lines -->
              <rect x="116" y="108" width="60" height="4" rx="2" fill="rgba(255,255,255,0.6)"/>
              <rect x="116" y="116" width="45" height="3" rx="2" fill="rgba(255,255,255,0.3)"/>
              <rect x="116" y="123" width="50" height="3" rx="2" fill="rgba(255,255,255,0.3)"/>
              <!-- Chart bars on screen -->
              <rect x="164" y="120" width="8" height="28" rx="2" fill="#4A90D9" opacity="0.8"/>
              <rect x="175" y="112" width="8" height="36" rx="2" fill="#22c55e" opacity="0.8"/>
              <rect x="186" y="118" width="8" height="30" rx="2" fill="#f59e0b" opacity="0.8"/>
              <!-- Monitor stand -->
              <rect x="153" y="170" width="14" height="10" rx="2" fill="rgba(255,255,255,0.15)"/>
              <rect x="143" y="178" width="34" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
              <!-- Book stack -->
              <rect x="50" y="152" width="50" height="8" rx="3" fill="#4A90D9" opacity="0.7"/>
              <rect x="52" y="144" width="46" height="8" rx="3" fill="#7c3aed" opacity="0.7"/>
              <rect x="54" y="136" width="42" height="8" rx="3" fill="#22c55e" opacity="0.6"/>
              <!-- Pencil -->
              <rect x="220" y="140" width="6" height="32" rx="3" fill="#f59e0b" opacity="0.8" transform="rotate(-15 223 156)"/>
              <!-- Stars decoration -->
              <circle cx="70" cy="60" r="3" fill="rgba(255,255,255,0.4)"/>
              <circle cx="250" cy="40" r="2" fill="rgba(255,255,255,0.3)"/>
              <circle cx="290" cy="90" r="4" fill="rgba(255,255,255,0.2)"/>
              <circle cx="30" cy="110" r="2.5" fill="rgba(255,255,255,0.35)"/>
              <!-- Floating badge -->
              <rect x="220" y="60" width="70" height="30" rx="15" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
              <circle cx="238" cy="75" r="8" fill="#22c55e" opacity="0.8"/>
              <text x="250" y="79" font-size="10" fill="white" opacity="0.9" font-family="sans-serif">+24%</text>
            </svg>
          </div>
        </div>

        <!-- ══ KPI CARDS ══ -->
        <div class="kpi-grid" *ngIf="!isAdmin && isStudent">
          <div class="kpi-card" [class.kpi-blue]="true">
            <div class="kpi-icon">📚</div>
            <div class="kpi-body">
              <div class="kpi-label">{{ isStudent ? 'Mes cours' : 'Cours créés' }}</div>
              <div class="kpi-value">{{ stats.courses }}</div>
            </div>
            <div class="kpi-trend up">↑</div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon">✅</div>
            <div class="kpi-body">
              <div class="kpi-label">Complétés</div>
              <div class="kpi-value">{{ stats.completed }}</div>
            </div>
            <div class="kpi-trend up">↑</div>
          </div>
          <div class="kpi-card kpi-purple">
            <div class="kpi-icon">🎯</div>
            <div class="kpi-body">
              <div class="kpi-label">{{ isStudent ? 'Score moyen' : 'Taux complétion' }}</div>
              <div class="kpi-value">{{ isStudent ? stats.score : stats.completion }}<span class="kpi-unit">%</span></div>
            </div>
            <div class="kpi-trend up">↑</div>
          </div>
          <div class="kpi-card kpi-amber">
            <div class="kpi-icon">⏳</div>
            <div class="kpi-body">
              <div class="kpi-label">En cours</div>
              <div class="kpi-value">{{ stats.courses - stats.completed }}</div>
            </div>
          </div>
        </div>

        <!-- Admin KPI -->
        <div class="kpi-grid" *ngIf="isAdmin">
          <div class="kpi-card kpi-blue">
            <div class="kpi-icon">👥</div>
            <div class="kpi-body">
              <div class="kpi-label">Utilisateurs total</div>
              <div class="kpi-value">{{ adminStats?.users?.total_users || 0 }}</div>
              <div class="kpi-sub">{{ adminStats?.users?.students || 0 }} étudiants · {{ adminStats?.users?.teachers || 0 }} formateurs</div>
            </div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon">📖</div>
            <div class="kpi-body">
              <div class="kpi-label">Cours publiés</div>
              <div class="kpi-value">{{ adminStats?.courses?.total_courses || 0 }}</div>
            </div>
          </div>
          <div class="kpi-card kpi-purple">
            <div class="kpi-icon">📝</div>
            <div class="kpi-body">
              <div class="kpi-label">Tentatives quiz</div>
              <div class="kpi-value">{{ adminStats?.quizzes?.total_attempts || 0 }}</div>
              <div class="kpi-sub">Taux réussite : {{ adminStats?.quizzes?.pass_rate || 0 }}%</div>
            </div>
          </div>
          <div class="kpi-card kpi-amber">
            <div class="kpi-icon">🏆</div>
            <div class="kpi-body">
              <div class="kpi-label">Quiz complétés</div>
              <div class="kpi-value">{{ adminStats?.quizzes?.completed || 0 }}</div>
            </div>
          </div>
        </div>

        <!-- ══ CONTENU PRINCIPAL ══ -->
        <div class="content-grid">

          <!-- Cours récents -->
          <div class="content-panel wide" *ngIf="recentCourses.length > 0 && !isAdmin">
            <div class="panel-header">
              <h2>📚 Mes cours</h2>
              <a routerLink="/courses" class="see-all">Voir tout →</a>
            </div>
            <div class="course-grid">
              <div class="course-card" *ngFor="let course of recentCourses" [routerLink]="['/courses', course.id]">
                <div class="course-img">
                  <img *ngIf="course.image_path" [src]="course.image_path" alt="{{ course.title }}">
                  <div class="course-img-placeholder" *ngIf="!course.image_path">
                    <span>📘</span>
                  </div>
                  <div class="course-done-badge" *ngIf="course.progress === 100">✅</div>
                  <div class="course-progress-overlay" *ngIf="isStudent">
                    <div class="progress-bar">
                      <div class="progress-fill"
                        [style.width]="(course.progress || 0) + '%'"
                        [class.done]="course.progress === 100"
                        [class.mid]="course.progress >= 50 && course.progress < 100"
                        [class.low]="course.progress < 50">
                      </div>
                    </div>
                    <span class="prog-pct">{{ course.progress || 0 }}%</span>
                  </div>
                </div>
                <div class="course-info">
                  <h3>{{ course.title }}</h3>
                </div>
              </div>
            </div>
          </div>

          <!-- Formateur : table -->
          <div class="content-panel wide" *ngIf="!isStudent && !isAdmin && recentCourses.length > 0">
            <div class="panel-header">
              <h2>📊 Top cours par inscriptions</h2>
            </div>
            <table class="data-table">
              <thead>
                <tr><th>#</th><th>Cours</th><th>Inscrits</th><th>Complétion</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of recentCourses; let i = index" [routerLink]="['/courses', c.id]" class="clickable">
                  <td><span class="rank" [class]="getRankClass(i)">{{ i+1 }}</span></td>
                  <td class="course-title-cell">{{ c.title }}</td>
                  <td><strong>{{ c.enrollments ?? '—' }}</strong></td>
                  <td>
                    <div class="mini-bar">
                      <div class="mini-fill"
                        [class.high]="(c.progress ?? 0) >= 70"
                        [class.mid]="(c.progress ?? 0) >= 40 && (c.progress ?? 0) < 70"
                        [class.low]="(c.progress ?? 0) < 40"
                        [style.width]="(c.progress ?? 0) + '%'">
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Certificats -->
          <div class="content-panel" *ngIf="isStudent">
            <div class="panel-header">
              <h2>🏆 Mes certificats</h2>
              <a routerLink="/certificates" class="see-all">Voir tout →</a>
            </div>
            <div class="empty-state" *ngIf="certificates.length === 0">
              <div class="empty-icon">🎓</div>
              <p>Complétez un cours pour obtenir votre certificat !</p>
            </div>
            <div class="cert-list" *ngIf="certificates.length > 0">
              <div class="cert-item" *ngFor="let cert of certificates | slice:0:3">
                <div class="cert-icon-wrap">🏆</div>
                <div class="cert-body">
                  <div class="cert-title">{{ cert.course_title || cert.title }}</div>
                  <div class="cert-date">{{ cert.issued_at | date:'dd/MM/yyyy' }}</div>
                </div>
                <a [routerLink]="['/courses', cert.course_id, 'certificate']" class="cert-link">Voir →</a>
              </div>
            </div>
          </div>

          <!-- Forum récent -->
          <div class="content-panel" *ngIf="isStudent">
            <div class="panel-header">
              <h2>💬 Forum récent</h2>
            </div>
            <div class="empty-state" *ngIf="forumPosts.length === 0">
              <div class="empty-icon">💬</div>
              <p>Aucune discussion récente</p>
            </div>
            <div class="forum-list" *ngIf="forumPosts.length > 0">
              <div class="forum-item" *ngFor="let post of forumPosts">
                <div class="forum-avatar">{{ getInitials(post.user_name) }}</div>
                <div class="forum-body">
                  <div class="forum-title">{{ post.title }}</div>
                  <div class="forum-meta">{{ post.reply_count }} réponse(s) · {{ post.user_name }}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="empty" *ngIf="recentCourses.length === 0 && !isAdmin">
          Aucun cours pour l'instant. <a routerLink="/courses">Parcourir les cours</a>
        </div>

      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

    * { font-family: 'DM Sans', sans-serif; }

    .layout { display:flex; min-height:100vh; background:#f0f4f8; }
    .main { margin-left:260px; flex:1; padding:2rem; }

    /* ══ HERO BANNER ══ */
    .hero-banner {
      background: linear-gradient(135deg, #1E3A5F 0%, #2563EB 60%, #1d4ed8 100%);
      border-radius: 20px;
      padding: 2rem 2.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      overflow: hidden;
      position: relative;
      box-shadow: 0 8px 32px rgba(37,99,235,0.25);
    }
    .hero-banner::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
    }
    .hero-banner::after {
      content: '';
      position: absolute;
      bottom: -60px; left: 30%;
      width: 300px; height: 300px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }
    .hero-content { flex: 1; z-index: 1; }
    .hero-tag {
      font-size: .75rem;
      font-weight: 600;
      color: rgba(255,255,255,0.65);
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: .6rem;
    }
    .hero-title {
      font-family: 'Sora', sans-serif;
      font-size: 2rem;
      font-weight: 800;
      color: white;
      margin: 0 0 .6rem;
      line-height: 1.2;
    }
    .hero-name { color: #93c5fd; }
    .hero-sub {
      font-size: .9rem;
      color: rgba(255,255,255,0.75);
      margin: 0 0 1.25rem;
      max-width: 380px;
      line-height: 1.6;
    }
    .hero-cta {
      display: inline-block;
      background: white;
      color: #1E3A5F;
      font-weight: 700;
      font-size: .85rem;
      padding: .6rem 1.4rem;
      border-radius: 30px;
      text-decoration: none;
      transition: all .2s;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
    }
    .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.2); }
    .hero-illustration {
      width: 300px;
      flex-shrink: 0;
      z-index: 1;
      opacity: 0.9;
    }
    .hero-illustration svg { width: 100%; height: auto; }

    /* ══ KPI CARDS ══ */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.75rem;
    }
    .kpi-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
      border-left: 4px solid transparent;
      transition: transform .2s, box-shadow .2s;
      position: relative;
      overflow: hidden;
    }
    .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }
    .kpi-card::after {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 60px; height: 60px;
      border-radius: 50%;
      opacity: .06;
      transform: translate(20px,-20px);
    }
    .kpi-blue { border-left-color: #2563EB; }
    .kpi-blue::after { background: #2563EB; }
    .kpi-green { border-left-color: #10b981; }
    .kpi-green::after { background: #10b981; }
    .kpi-purple { border-left-color: #7c3aed; }
    .kpi-purple::after { background: #7c3aed; }
    .kpi-amber { border-left-color: #f59e0b; }
    .kpi-amber::after { background: #f59e0b; }
    .kpi-icon { font-size: 1.8rem; flex-shrink: 0; }
    .kpi-body { flex: 1; }
    .kpi-label { font-size: .75rem; color: #64748b; font-weight: 500; margin-bottom: .2rem; text-transform: uppercase; letter-spacing: .04em; }
    .kpi-value { font-family: 'Sora', sans-serif; font-size: 1.9rem; font-weight: 800; color: #1E3A5F; line-height: 1; }
    .kpi-unit { font-size: 1.1rem; font-weight: 600; color: #94a3b8; }
    .kpi-sub { font-size: .72rem; color: #94a3b8; margin-top: .25rem; }
    .kpi-trend { font-size: 1.1rem; font-weight: 700; }
    .kpi-trend.up { color: #10b981; }

    /* ══ CONTENT GRID ══ */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    .content-panel {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
    }
    .content-panel.wide { grid-column: 1 / -1; }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .panel-header h2 {
      font-family: 'Sora', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: #1E3A5F;
      margin: 0;
    }
    .see-all { font-size: .8rem; color: #2563EB; text-decoration: none; font-weight: 600; }
    .see-all:hover { text-decoration: underline; }

    /* ══ COURSE GRID ══ */
    .course-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }
    .course-card {
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid #e2e8f0;
      transition: transform .2s, box-shadow .2s;
    }
    .course-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }
    .course-img {
      height: 110px;
      background: linear-gradient(135deg, #1E3A5F, #2563EB);
      position: relative;
      overflow: hidden;
    }
    .course-img img { width: 100%; height: 100%; object-fit: cover; }
    .course-img-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem;
    }
    .course-done-badge {
      position: absolute; top: 8px; right: 8px; font-size: 1.2rem;
    }
    .course-progress-overlay {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 4px 8px;
      background: rgba(0,0,0,.35);
      display: flex; align-items: center; gap: 6px;
    }
    .progress-bar { flex: 1; height: 4px; background: rgba(255,255,255,.3); border-radius: 2px; }
    .progress-fill { height: 100%; border-radius: 2px; transition: width .3s; }
    .progress-fill.done { background: #22c55e; }
    .progress-fill.mid { background: #f59e0b; }
    .progress-fill.low { background: #60a5fa; }
    .prog-pct { font-size: .7rem; color: white; font-weight: 600; white-space: nowrap; }
    .course-info { padding: .75rem 1rem; }
    .course-info h3 { font-size: .88rem; font-weight: 600; color: #1E3A5F; margin: 0; line-height: 1.4; }

    /* ══ TABLE ══ */
    .data-table { width: 100%; border-collapse: collapse; font-size: .83rem; }
    .data-table th {
      text-align: left; padding: .5rem .75rem;
      font-size: .7rem; text-transform: uppercase;
      letter-spacing: .06em; color: #94a3b8;
      border-bottom: 2px solid #f1f5f9;
    }
    .data-table td { padding: .7rem .75rem; border-bottom: 1px solid #f8fafc; color: #374151; }
    .data-table tr.clickable { cursor: pointer; }
    .data-table tr.clickable:hover { background: #f8faff; }
    .course-title-cell { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
    .rank { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; font-weight: 700; font-size: .75rem; }
    .rank.gold { background: #fef3c7; color: #92400e; }
    .rank.silver { background: #f1f5f9; color: #475569; }
    .rank.bronze { background: #fff7ed; color: #9a3412; }
    .rank.other { background: #f1f5f9; color: #64748b; }
    .mini-bar { height: 6px; background: #e2e8f0; border-radius: 3px; width: 90px; }
    .mini-fill { height: 100%; border-radius: 3px; }
    .mini-fill.high { background: #10b981; }
    .mini-fill.mid { background: #f59e0b; }
    .mini-fill.low { background: #ef4444; }

    /* ══ CERTIFICATS ══ */
    .cert-list { display: flex; flex-direction: column; gap: .75rem; }
    .cert-item {
      display: flex; align-items: center; gap: .75rem;
      padding: .75rem 1rem; border-radius: 10px;
      background: linear-gradient(135deg, #f0f7ff, #e8f4fe);
      border: 1px solid #bfdbfe;
      transition: transform .15s;
    }
    .cert-item:hover { transform: translateX(4px); }
    .cert-icon-wrap { font-size: 1.5rem; flex-shrink: 0; }
    .cert-body { flex: 1; min-width: 0; }
    .cert-title { font-size: .85rem; font-weight: 600; color: #1E3A5F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cert-date { font-size: .72rem; color: #94a3b8; margin-top: .15rem; }
    .cert-link { font-size: .75rem; color: #2563EB; text-decoration: none; font-weight: 700; white-space: nowrap; }

    /* ══ FORUM ══ */
    .forum-list { display: flex; flex-direction: column; gap: .75rem; }
    .forum-item {
      display: flex; align-items: flex-start; gap: .75rem;
      padding: .75rem; border-radius: 10px; background: #f8faff;
      border: 1px solid #e2e8f0;
    }
    .forum-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #1E3A5F, #2563EB);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: .7rem; font-weight: 700; flex-shrink: 0;
    }
    .forum-title { font-size: .85rem; font-weight: 600; color: #1a2340; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .forum-meta { font-size: .72rem; color: #94a3b8; margin-top: .15rem; }


    /* ══ DARK MODE ══ */
    :host-context(body.dark) .cert-item { background: #1e2d42 !important; border-color: #2d3f55 !important; }
    :host-context(body.dark) .cert-title { color: #e2e8f0 !important; }
    :host-context(body.dark) .cert-date { color: #64748b !important; }
    :host-context(body.dark) .cert-link { color: #60a5fa !important; }
    :host-context(body.dark) .forum-item { background: #1e2d42 !important; border-color: #2d3f55 !important; }
    :host-context(body.dark) .forum-title { color: #e2e8f0 !important; }
    :host-context(body.dark) .forum-meta { color: #64748b !important; }
    /* ══ EMPTY STATES ══ */
    .empty-state { text-align: center; padding: 2rem 1rem; }
    .empty-icon { font-size: 2.5rem; margin-bottom: .75rem; }
    .empty-state p { font-size: .85rem; color: #94a3b8; margin: 0; }
    .empty { text-align: center; color: #64748b; padding: 3rem; }
    .empty a { color: #2563EB; font-weight: 600; }
  `]
})
export class DashboardComponent implements OnInit {
  user: any;
  recentCourses: any[] = [];
  stats = { courses: 0, completed: 0, score: 0, completion: 0 };
  certificates: any[] = [];
  forumPosts: any[] = [];
  streakDays = 0;
  adminStats: any = null;
  activeTab = 'overview';
  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  get isStudent() { return this.auth.isStudent(); }
  get isTeacher() { return this.auth.isTeacher(); }
  get isAdmin()   { return this.auth.isAdmin(); }

  constructor(
    private auth: AuthService,
    private courseService: CourseService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
    if (this.isAdmin) {
      this.router.navigate(['/analytics']);
      return;
    }
    this.loadData();
  }

  loadData() {
    if (this.isAdmin) {
      this.http.get('/api/admin/stats').subscribe({
        next: (s: any) => { this.adminStats = s; this.stats.courses = s.courses?.total || 0; },
        error: () => {}
      });
    } else if (this.isStudent) {
      this.courseService.myCourses().subscribe({
        next: (enrollments) => {
          this.stats.courses = enrollments.length;
          this.recentCourses = enrollments.slice(0, 6).map((e: any) => ({
            ...e.course, progress: this.capProgress(e.progress)
          }));
          this.stats.completed = enrollments.filter((e: any) => this.capProgress(e.progress) === 100).length;
        },
        error: () => {}
      });
      this.courseService.getMyCertificates().subscribe({
        next: (certs) => { this.certificates = certs; },
        error: () => {}
      });
      this.courseService.myCourses().subscribe({
        next: (enrollments) => {
          const courseIds = enrollments.map((e: any) => e.course?.id || e.course_id).filter(Boolean);
          if (courseIds.length > 0) {
            this.http.get<any[]>(`/api/forum/courses/${courseIds[0]}/posts`).subscribe({
              next: (posts) => { this.forumPosts = posts.slice(0, 3); },
              error: () => {}
            });
          }
        },
        error: () => {}
      });
      this.http.get<any[]>('/api/attempts/mine').subscribe({
        next: (attempts) => {
          if (attempts.length > 0) {
            const best: Record<number, number> = {};
            for (const a of attempts) {
              const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
              if (!best[a.quiz_id] || pct > best[a.quiz_id]) best[a.quiz_id] = pct;
            }
            const scores = Object.values(best);
            this.stats.score = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
          }
        },
        error: () => {}
      });
    } else {
      this.courseService.getCourses().subscribe({
        next: (courses) => {
          const myId = this.user?.auth_id || this.user?.id;
          const myCourses = courses.filter((c: any) => c.instructor_id === myId).slice(0, 6);
          this.http.get<any>('/api/analytics/teacher').subscribe({
            next: (analytics: any) => {
              const topMap: any = {};
              (analytics.top_courses || []).forEach((tc: any) => { topMap[tc.id] = tc; });
              const compMap: any = {};
              (analytics.completion_by_course || []).forEach((cc: any) => { compMap[cc.course_id] = cc; });
              this.recentCourses = myCourses.map((c: any) => ({
                ...c,
                enrollments: topMap[c.id]?.enrollments ?? 0,
                progress: compMap[c.id]?.completion_rate ?? 0
              }));
              this.stats.courses = this.recentCourses.length;
              this.stats.completion = analytics.summary?.completion_rate ?? 0;
              this.stats.completed = (analytics.summary?.completed ?? 0);
            },
            error: () => {
              this.recentCourses = myCourses;
              this.stats.courses = myCourses.length;
            }
          });
        },
        error: () => {}
      });
    }
  }

  capProgress(progress: number | string | null): number {
    return Math.min(100, Math.max(0, Math.round(Number(progress) || 0)));
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRankClass(i: number): string {
    return ['gold','silver','bronze'][i] ?? 'other';
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
