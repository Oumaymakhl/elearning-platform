import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-teacher-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <div class="approval-container">
          <div class="page-header">
            <h2>👨‍🏫 Enseignants en attente d'approbation</h2>
            <span class="badge" *ngIf="teachers.length > 0">{{ teachers.length }}</span>
          </div>

          <div *ngIf="message" class="alert" [class.success]="isSuccess" [class.error]="!isSuccess">
            {{ message }}
          </div>

          <div *ngIf="loading" class="loading">
            <div class="spinner"></div>
          </div>

          <div *ngIf="!loading && teachers.length === 0" class="empty">
            ✅ Aucun enseignant en attente d'approbation.
          </div>

          <div class="teacher-card" *ngFor="let t of teachers">
            <div class="teacher-info">
              <div class="avatar">{{ t.name[0].toUpperCase() }}</div>
              <div class="details">
                <h3>{{ t.name }}</h3>
                <p>{{ t.email }}</p>
                <p class="date">Inscrit le {{ t.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>

            <div class="actions">
              <a [href]="getCvUrl(t.id)" target="_blank" class="btn btn-cv" *ngIf="t.cv_path">
                📄 Voir le CV
              </a>
              <span class="no-cv" *ngIf="!t.cv_path">⚠️ Pas de CV</span>

              <div class="reason-group" *ngIf="selectedId === t.id">
                <textarea [(ngModel)]="reason" placeholder="Raison du refus (optionnel)" rows="2"></textarea>
              </div>

              <button class="btn btn-approve" (click)="approve(t.id, true)">
                ✅ Approuver
              </button>
              <button class="btn btn-reject" (click)="selectReject(t.id)" *ngIf="selectedId !== t.id">
                ❌ Refuser
              </button>
              <button class="btn btn-confirm-reject"
                *ngIf="selectedId === t.id"
                (click)="approve(t.id, false)">
                Confirmer le refus
              </button>
              <button class="btn btn-cancel"
                *ngIf="selectedId === t.id"
                (click)="selectedId = null">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .main-content { margin-left:260px; flex:1; background:#f5f7fa; padding:2rem; min-height:100vh; }
    .approval-container { max-width:900px; margin:0 auto; }
    .page-header { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; }
    .page-header h2 { color:#1E3A5F; margin:0; font-size:1.4rem; }
    .badge { background:#1E3A5F; color:white; border-radius:20px; padding:2px 12px; font-size:.85rem; font-weight:700; }
    .empty { color:#666; background:white; padding:2rem; border-radius:12px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .loading { display:flex; justify-content:center; padding:3rem; }
    .spinner { width:40px; height:40px; border:3px solid #e2e8f0; border-top-color:#1E3A5F; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .teacher-card {
      background:white; border-radius:12px; padding:1.5rem;
      margin-bottom:1rem; box-shadow:0 2px 8px rgba(0,0,0,.06);
      display:flex; justify-content:space-between; align-items:flex-start;
      flex-wrap:wrap; gap:1rem;
    }
    .teacher-info { display:flex; align-items:center; gap:1rem; }
    .avatar {
      width:52px; height:52px; border-radius:50%; background:#1E3A5F;
      color:white; display:flex; align-items:center; justify-content:center;
      font-size:1.4rem; font-weight:700; flex-shrink:0;
    }
    .details h3 { margin:0 0 0.2rem; color:#1E3A5F; }
    .details p { margin:0; color:#666; font-size:.9rem; }
    .date { font-size:.78rem !important; color:#999 !important; margin-top:.2rem !important; }
    .actions { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; }
    .btn {
      padding:.5rem 1rem; border-radius:8px; border:none;
      cursor:pointer; font-size:.85rem; font-weight:500;
      text-decoration:none; display:inline-flex; align-items:center;
      transition:opacity .2s;
    }
    .btn:hover { opacity:.85; }
    .btn-cv { background:#e3f2fd; color:#1565c0; }
    .btn-approve { background:#e8f5e9; color:#2e7d32; }
    .btn-reject { background:#ffebee; color:#c62828; }
    .btn-confirm-reject { background:#c62828; color:white; }
    .btn-cancel { background:#f5f5f5; color:#666; }
    .no-cv { color:#f59e0b; font-size:.85rem; font-weight:500; }
    textarea {
      width:220px; padding:.5rem; border:1px solid #ddd;
      border-radius:6px; font-size:.85rem; resize:vertical;
    }
    .alert { padding:.8rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:.9rem; }
    .success { background:#e8f5e9; color:#2e7d32; border:1px solid #a5d6a7; }
    .error { background:#ffebee; color:#c62828; border:1px solid #ef9a9a; }
  `]
})
export class TeacherApprovalComponent implements OnInit {
  teachers: any[] = [];
  message = '';
  isSuccess = false;
  selectedId: number | null = null;
  reason = '';
  loading = true;

  private teachersUrl = '/api/teachers';

  constructor(private http: HttpClient) {}

  get headers() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<any[]>(`${this.teachersUrl}/pending`, this.headers).subscribe({
      next: (data) => { this.teachers = data; this.loading = false; },
      error: () => { this.showMessage('Erreur lors du chargement.', false); this.loading = false; }
    });
  }

  getCvUrl(id: number) {
    return `http://localhost:8000/storage/${this.teachers.find(t => t.id === id)?.cv_path}`;
  }

  selectReject(id: number) {
    this.selectedId = id;
    this.reason = '';
  }

  approve(id: number, approved: boolean) {
    this.http.post(`${this.teachersUrl}/${id}/approve`,
      { approved, reason: this.reason || null },
      this.headers
    ).subscribe({
      next: () => {
        this.showMessage(
          approved ? '✅ Enseignant approuvé. Un email lui a été envoyé.' : '❌ Enseignant refusé. Un email lui a été envoyé.',
          true
        );
        this.selectedId = null;
        this.reason = '';
        this.load();
      },
      error: () => this.showMessage('Erreur lors de l\'opération.', false)
    });
  }

  showMessage(msg: string, success: boolean) {
    this.message = msg;
    this.isSuccess = success;
    setTimeout(() => this.message = '', 5000);
  }
}
