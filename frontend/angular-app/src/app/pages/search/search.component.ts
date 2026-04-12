import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">
        <div class="search-header">
          <h1>🔍 Recherche globale</h1>
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input #searchInput type="text" [(ngModel)]="query" (input)="search()"
              placeholder="Rechercher un cours, chapitre, étudiant..." autofocus/>
            <button class="clear-btn" *ngIf="query" (click)="query=''; results={}; total=0">✕</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-bar" *ngIf="query && !loading">
          <span>{{ total }} résultat(s) pour <strong>"{{ query }}"</strong></span>
          <div class="filters">
            <button [class.active]="activeTab==='all'"     (click)="activeTab='all'">Tout</button>
            <button [class.active]="activeTab==='courses'" (click)="activeTab='courses'" *ngIf="results.courses?.length">📚 Cours ({{ results.courses?.length }})</button>
            <button [class.active]="activeTab==='chapters'" (click)="activeTab='chapters'" *ngIf="results.chapters?.length">📖 Chapitres ({{ results.chapters?.length }})</button>
            <button [class.active]="activeTab==='students'" (click)="activeTab='students'" *ngIf="results.students?.length && isTeacher">👥 Étudiants ({{ results.students?.length }})</button>
          </div>
        </div>

        <!-- Loading -->
        <div class="loading" *ngIf="loading">
          <div class="spinner"></div> Recherche en cours...
        </div>

        <!-- Pas de résultats -->
        <div class="empty" *ngIf="!loading && query && total === 0">
          <div>🔍</div>
          <p>Aucun résultat pour "{{ query }}"</p>
          <span>Essayez avec d'autres mots-clés</span>
        </div>

        <!-- Page vide -->
        <div class="empty" *ngIf="!query">
          <div>🔍</div>
          <p>Tapez pour rechercher</p>
          <span>Cours, chapitres, étudiants...</span>
        </div>

        <!-- Résultats Cours -->
        <div class="section" *ngIf="(activeTab==='all' || activeTab==='courses') && results.courses?.length">
          <h2>📚 Cours</h2>
          <div class="results-grid">
            <a class="result-card" *ngFor="let c of results.courses" [routerLink]="['/courses', c.id]">
              <div class="rc-icon">📚</div>
              <div class="rc-body">
                <div class="rc-title" [innerHTML]="highlight(c.title)"></div>
                <div class="rc-sub" *ngIf="c.description" [innerHTML]="highlight(getSlice(c.description))"></div>
                <div class="rc-meta">
                  <span class="badge">{{ c.level || 'Tous niveaux' }}</span>
                  <span class="badge blue" *ngIf="c.chapters_count">{{ c.chapters_count }} chapitres</span>
                </div>
              </div>
              <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
        </div>

        <!-- Résultats Chapitres -->
        <div class="section" *ngIf="(activeTab==='all' || activeTab==='chapters') && results.chapters?.length">
          <h2>📖 Chapitres</h2>
          <div class="results-list">
            <a class="result-row" *ngFor="let ch of results.chapters" [routerLink]="['/courses', ch.course_id]">
              <div class="rr-icon">📖</div>
              <div class="rr-body">
                <div class="rr-title" [innerHTML]="highlight(ch.title)"></div>
                <div class="rr-course">dans <strong>{{ ch.course_title }}</strong></div>
              </div>
              <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>
        </div>

        <!-- Résultats Étudiants (prof seulement) -->
        <div class="section" *ngIf="(activeTab==='all' || activeTab==='students') && results.students?.length && isTeacher">
          <h2>👥 Étudiants</h2>
          <div class="results-list">
            <div class="result-row" *ngFor="let s of results.students">
              <div class="avatar">{{ getInitials(s.name) }}</div>
              <div class="rr-body">
                <div class="rr-title" [innerHTML]="highlight(s.name)"></div>
                <div class="rr-course" [innerHTML]="highlight(s.email)"></div>
              </div>
              <span class="badge green">{{ s.role }}</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; padding:2rem; background:#f8f9fa; }
    .search-header { margin-bottom:1.5rem; }
    h1 { color:#1E3A5F; margin:0 0 1rem; }
    .search-box { display:flex; align-items:center; gap:.75rem; background:white; border:2px solid #e2e8f0; border-radius:14px; padding:.75rem 1.25rem; box-shadow:0 2px 8px rgba(0,0,0,.06); transition:border-color .2s; }
    .search-box:focus-within { border-color:#1E3A5F; box-shadow:0 0 0 4px rgba(30,58,95,.08); }
    .search-box input { flex:1; border:none; outline:none; font-size:1rem; color:#1a2340; background:transparent; }
    .search-box input::placeholder { color:#94a3b8; }
    .clear-btn { background:none; border:none; color:#94a3b8; cursor:pointer; font-size:1rem; padding:0 .25rem; }
    .clear-btn:hover { color:#1E3A5F; }

    .stats-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .stats-bar span { color:#64748b; font-size:.9rem; }
    .filters { display:flex; gap:.5rem; flex-wrap:wrap; }
    .filters button { background:#f1f5f9; border:none; border-radius:20px; padding:.4rem .9rem; font-size:.8rem; color:#64748b; cursor:pointer; transition:.2s; }
    .filters button.active { background:#1E3A5F; color:white; }

    .loading { display:flex; align-items:center; gap:1rem; padding:3rem; justify-content:center; color:#64748b; }
    .spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#1E3A5F; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .empty { text-align:center; padding:4rem 2rem; color:#94a3b8; }
    .empty div { font-size:3rem; margin-bottom:1rem; }
    .empty p { font-size:1.1rem; color:#64748b; margin:0 0 .5rem; }
    .empty span { font-size:.85rem; }

    .section { margin-bottom:2rem; }
    .section h2 { color:#1E3A5F; font-size:1rem; font-weight:700; margin:0 0 .75rem; padding-bottom:.5rem; border-bottom:2px solid #e2e8f0; }

    .results-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem; }
    .result-card { background:white; border-radius:12px; padding:1.25rem; display:flex; align-items:flex-start; gap:1rem; text-decoration:none; color:inherit; box-shadow:0 2px 8px rgba(0,0,0,.06); transition:.2s; border:1.5px solid transparent; }
    .result-card:hover { border-color:#1E3A5F; box-shadow:0 4px 16px rgba(30,58,95,.12); transform:translateY(-1px); }
    .rc-icon { font-size:1.8rem; flex-shrink:0; }
    .rc-body { flex:1; min-width:0; }
    .rc-title { font-weight:700; color:#1a2340; margin-bottom:.25rem; }
    .rc-sub { font-size:.82rem; color:#64748b; margin-bottom:.5rem; }
    .rc-meta { display:flex; gap:.5rem; flex-wrap:wrap; }

    .results-list { display:flex; flex-direction:column; gap:.5rem; }
    .result-row { background:white; border-radius:10px; padding:.9rem 1.1rem; display:flex; align-items:center; gap:.9rem; text-decoration:none; color:inherit; box-shadow:0 1px 4px rgba(0,0,0,.05); transition:.2s; cursor:pointer; }
    .result-row:hover { box-shadow:0 3px 12px rgba(30,58,95,.1); transform:translateX(3px); }
    .rr-icon { font-size:1.4rem; flex-shrink:0; }
    .rr-body { flex:1; min-width:0; }
    .rr-title { font-weight:600; color:#1a2340; font-size:.9rem; }
    .rr-course { font-size:.78rem; color:#64748b; margin-top:.15rem; }
    .arrow { flex-shrink:0; }

    .avatar { width:36px; height:36px; border-radius:50%; background:#1E3A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; flex-shrink:0; }
    .badge { padding:.2rem .6rem; border-radius:20px; font-size:.72rem; font-weight:600; background:#f1f5f9; color:#64748b; }
    .badge.blue { background:#dbeafe; color:#1d4ed8; }
    .badge.green { background:#dcfce7; color:#166534; }

    mark { background:#fef08a; border-radius:3px; padding:0 2px; }
  `]
})
export class SearchComponent implements OnInit {
  query = '';
  results: any = {};
  total = 0;
  loading = false;
  activeTab = 'all';
  private timer: any;

  get isTeacher() { return this.auth.isTeacher() || this.auth.isAdmin(); }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['q']) { this.query = p['q']; this.doSearch(); }
    });
  }

  search() {
    clearTimeout(this.timer);
    if (!this.query.trim()) { this.results = {}; this.total = 0; return; }
    this.timer = setTimeout(() => this.doSearch(), 350);
  }

  doSearch() {
    if (!this.query.trim()) return;
    this.loading = true;
    this.activeTab = 'all';
    this.router.navigate([], { queryParams: { q: this.query }, replaceUrl: true });

    const q = encodeURIComponent(this.query.trim());
    this.http.get<any[]>(`/api/courses?search=${q}`).subscribe({
      next: (courses) => {
        const filtered = courses.filter(c =>
          c.title?.toLowerCase().includes(this.query.toLowerCase()) ||
          c.description?.toLowerCase().includes(this.query.toLowerCase())
        );
        this.results.courses = filtered;

        // Chercher dans les chapitres
        const chapters: any[] = [];
        courses.forEach(course => {
          (course.chapters || []).forEach((ch: any) => {
            if (ch.title?.toLowerCase().includes(this.query.toLowerCase())) {
              chapters.push({ ...ch, course_id: course.id, course_title: course.title });
            }
            (ch.sub_chapters || ch.subChapters || []).forEach((sub: any) => {
              if (sub.title?.toLowerCase().includes(this.query.toLowerCase())) {
                chapters.push({ ...sub, course_id: course.id, course_title: course.title });
              }
            });
          });
        });
        this.results.chapters = chapters;
        this.computeTotal();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    // Chercher étudiants si prof
    if (this.isTeacher) {
      this.http.get<any[]>(`/api/users?search=${q}`).subscribe({
        next: (users) => {
          this.results.students = users.filter(u =>
            u.name?.toLowerCase().includes(this.query.toLowerCase()) ||
            u.email?.toLowerCase().includes(this.query.toLowerCase())
          );
          this.computeTotal();
        },
        error: () => {}
      });
    }
  }

  computeTotal() {
    this.total = (this.results.courses?.length || 0) +
                 (this.results.chapters?.length || 0) +
                 (this.results.students?.length || 0);
  }

  getSlice(text: string): string {
    if (!text) return '';
    return text.length > 80 ? text.slice(0, 80) + '...' : text;
  }

  highlight(text: string): string {
    if (!text || !this.query) return text;
    const escaped = this.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'gi'), m => `<mark>${m}</mark>`);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
