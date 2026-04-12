import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">

        <div class="page-header">
          <a [routerLink]="['/courses', courseId]" class="back-link">← Retour au cours</a>
          <h1>💬 Forum du cours</h1>
          <p class="subtitle">{{ posts.length }} discussion(s)</p>
        </div>

        <!-- Nouveau post -->
        <div class="new-post-card" *ngIf="!showForm">
          <button class="btn-new" (click)="showForm=true">✏️ Nouvelle discussion</button>
        </div>

        <div class="form-card" *ngIf="showForm">
          <h3>Nouvelle discussion</h3>
          <input class="input" [(ngModel)]="newTitle" placeholder="Titre de votre question..." maxlength="255"/>
          <textarea class="textarea" [(ngModel)]="newBody" placeholder="Décrivez votre question..." rows="4"></textarea>
          <div class="form-actions">
            <button class="btn-cancel" (click)="showForm=false; newTitle=''; newBody=''">Annuler</button>
            <button class="btn-submit" (click)="createPost()" [disabled]="!newTitle.trim() || !newBody.trim() || posting">
              {{ posting ? 'Envoi...' : 'Publier' }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div class="loading" *ngIf="loading">
          <div class="spinner"></div> Chargement...
        </div>

        <!-- Liste posts -->
        <div class="posts" *ngIf="!loading">
          <div class="empty" *ngIf="posts.length === 0">
            <div>💬</div>
            <p>Aucune discussion pour l'instant. Soyez le premier à poser une question !</p>
          </div>

          <div class="post-card" *ngFor="let post of posts">
            <div class="post-header">
              <div class="avatar" [class.teacher]="post.user_role==='teacher'">
                <img *ngIf="post.user_avatar" [src]="post.user_avatar" class="avatar-img" alt=""/>
                <span *ngIf="!post.user_avatar">{{ getInitials(post.user_name) }}</span>
              </div>
              <div class="post-meta">
                <span class="author">{{ post.user_name }}</span>
                <span class="role-badge" *ngIf="post.user_role==='teacher'">👨‍🏫 Professeur</span>
                <span class="date">{{ formatDate(post.created_at) }}</span>
              </div>
              <button class="btn-edit" *ngIf="canDelete(post)" (click)="startEdit(post)">✏️</button>
              <button class="btn-delete" *ngIf="canDelete(post)"
                (click)="deletePost(post.id)">🗑</button>
            </div>

            <!-- Mode lecture -->
            <ng-container *ngIf="editingPostId !== post.id">
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-body">{{ post.body }}</p>
            </ng-container>
            <!-- Mode édition -->
            <div class="edit-form" *ngIf="editingPostId === post.id">
              <input class="input" [(ngModel)]="editTitle" placeholder="Titre..."/>
              <textarea class="textarea" [(ngModel)]="editBody" rows="3"></textarea>
              <div class="form-actions">
                <button class="btn-cancel" (click)="cancelEdit()">Annuler</button>
                <button class="btn-submit" (click)="saveEdit(post)">💾 Sauvegarder</button>
              </div>
            </div>

            <div class="replies-section">
              <div class="replies-header" (click)="toggleReplies(post)">
                <span>💬 {{ post.reply_count }} réponse(s)</span>
                <span class="toggle-icon">{{ post.showReplies ? '▲' : '▼' }}</span>
              </div>

              <div class="replies" *ngIf="post.showReplies">
                <div class="reply" *ngFor="let reply of post.replies">
                  <div class="reply-header">
                    <div class="avatar sm" [class.teacher]="reply.user_role==='teacher'">
                      <img *ngIf="reply.user_avatar" [src]="reply.user_avatar" class="avatar-img" alt=""/>
                      <span *ngIf="!reply.user_avatar">{{ getInitials(reply.user_name) }}</span>
                    </div>
                    <span class="author">{{ reply.user_name }}</span>
                    <span class="role-badge sm" *ngIf="reply.user_role==='teacher'">👨‍🏫</span>
                    <span class="date">{{ formatDate(reply.created_at) }}</span>
                    <button class="btn-delete sm" *ngIf="canDeleteReply(reply)"
                      (click)="deleteReply(post, reply.id)">🗑</button>
                  </div>
                  <p class="reply-body">{{ reply.body }}</p>
                </div>

                <!-- Répondre -->
                <div class="reply-form">
                  <textarea class="textarea sm" [(ngModel)]="post.replyText"
                    placeholder="Votre réponse..." rows="2"></textarea>
                  <button class="btn-reply" (click)="createReply(post)"
                    [disabled]="!post.replyText?.trim()">
                    Répondre
                  </button>
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
    .page-header { margin-bottom:1.5rem; }
    .back-link { color:#4361ee; text-decoration:none; font-size:.85rem; }
    .back-link:hover { text-decoration:underline; }
    h1 { color:#1E3A5F; margin:.5rem 0 .25rem; }
    .subtitle { color:#64748b; font-size:.9rem; margin:0; }

    .new-post-card { margin-bottom:1.5rem; }
    .btn-new { background:#1E3A5F; color:white; border:none; border-radius:10px; padding:.75rem 1.5rem; font-size:.9rem; font-weight:600; cursor:pointer; transition:background .2s; }
    .btn-new:hover { background:#0f2544; }

    .form-card { background:white; border-radius:14px; padding:1.5rem; margin-bottom:1.5rem; box-shadow:0 2px 8px rgba(0,0,0,.07); }
    .form-card h3 { color:#1E3A5F; margin:0 0 1rem; }
    .input { width:100%; padding:.7rem 1rem; border:1.5px solid #e2e8f0; border-radius:8px; font-size:.9rem; margin-bottom:.75rem; outline:none; box-sizing:border-box; }
    .input:focus { border-color:#1E3A5F; }
    .textarea { width:100%; padding:.7rem 1rem; border:1.5px solid #e2e8f0; border-radius:8px; font-size:.9rem; resize:vertical; outline:none; font-family:inherit; box-sizing:border-box; }
    .textarea:focus { border-color:#1E3A5F; }
    .textarea.sm { margin-top:.75rem; }
    .form-actions { display:flex; gap:.75rem; justify-content:flex-end; margin-top:.75rem; }
    .btn-cancel { background:#f1f5f9; color:#64748b; border:none; border-radius:8px; padding:.6rem 1.2rem; cursor:pointer; font-size:.85rem; }
    .btn-submit { background:#1E3A5F; color:white; border:none; border-radius:8px; padding:.6rem 1.4rem; cursor:pointer; font-size:.85rem; font-weight:600; }
    .btn-submit:disabled { opacity:.5; cursor:not-allowed; }

    .loading { display:flex; align-items:center; gap:1rem; padding:3rem; justify-content:center; color:#64748b; }
    .spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#1E3A5F; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .empty { text-align:center; padding:3rem; color:#94a3b8; }
    .empty div { font-size:3rem; margin-bottom:1rem; }

    .posts { display:flex; flex-direction:column; gap:1rem; }
    .post-card { background:white; border-radius:14px; padding:1.5rem; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .post-header { display:flex; align-items:center; gap:.75rem; margin-bottom:.75rem; }
    .avatar { width:38px; height:38px; border-radius:50%; background:#1E3A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; flex-shrink:0; }
    .avatar.teacher { background:#f59e0b; }
    .avatar.sm { width:28px; height:28px; font-size:.65rem; }
    .avatar-img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
    .post-meta { display:flex; align-items:center; gap:.5rem; flex:1; flex-wrap:wrap; }
    .author { font-weight:700; color:#1a2340; font-size:.9rem; }
    .role-badge { background:#fef3c7; color:#92400e; font-size:.7rem; font-weight:600; padding:2px 8px; border-radius:20px; }
    .role-badge.sm { padding:1px 6px; font-size:.65rem; }
    .date { color:#94a3b8; font-size:.78rem; margin-left:auto; }
    .btn-edit { background:none; border:none; cursor:pointer; font-size:1rem; opacity:.4; transition:opacity .2s; margin-left:.5rem; }
    .btn-edit:hover { opacity:1; }
    .edit-form { display:flex; flex-direction:column; gap:.5rem; margin:.5rem 0; }
    .btn-delete { background:none; border:none; cursor:pointer; font-size:1rem; opacity:.4; transition:opacity .2s; margin-left:.5rem; }
    .btn-delete:hover { opacity:1; }
    .btn-delete.sm { font-size:.85rem; }
    .post-title { color:#1E3A5F; font-size:1.05rem; margin:.25rem 0 .5rem; }
    .post-body { color:#374151; font-size:.88rem; line-height:1.6; margin:0 0 1rem; white-space:pre-wrap; }

    .replies-section { border-top:1px solid #f1f5f9; padding-top:.75rem; }
    .replies-header { display:flex; justify-content:space-between; align-items:center; cursor:pointer; color:#4361ee; font-size:.83rem; font-weight:600; padding:.25rem 0; user-select:none; }
    .replies-header:hover { color:#1E3A5F; }
    .toggle-icon { font-size:.7rem; }
    .replies { margin-top:.75rem; display:flex; flex-direction:column; gap:.75rem; }
    .reply { background:#f8faff; border-radius:10px; padding:.9rem 1rem; }
    .reply-header { display:flex; align-items:center; gap:.5rem; margin-bottom:.4rem; flex-wrap:wrap; }
    .reply-body { color:#374151; font-size:.85rem; margin:0; line-height:1.5; white-space:pre-wrap; }
    .reply-form { margin-top:.75rem; }
    .btn-reply { margin-top:.5rem; background:#4361ee; color:white; border:none; border-radius:8px; padding:.5rem 1.2rem; font-size:.82rem; font-weight:600; cursor:pointer; }
    .btn-reply:disabled { opacity:.5; cursor:not-allowed; }
    .btn-reply:hover:not(:disabled) { background:#1E3A5F; }
  `]
})
export class ForumComponent implements OnInit {
  courseId!: number;
  posts: any[] = [];
  loading = true;
  showForm = false;
  newTitle = '';
  newBody = '';
  posting = false;
  currentUser: any;
  editingPostId: number | null = null;
  editTitle = '';
  editBody = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: AuthService,
    private confirmSvc: ConfirmService
  ) {}

  ngOnInit() {
    this.courseId = +this.route.snapshot.paramMap.get('id')!;
    this.currentUser = this.auth.getCurrentUser();
    this.loadPosts();
  }

  loadPosts() {
    this.loading = true;
    this.http.get<any[]>(`/api/forum/courses/${this.courseId}/posts`).subscribe({
      next: (posts) => {
        this.posts = posts.map(p => ({ ...p, showReplies: false, replyText: '' }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getUserHeader(): string {
    const u = this.currentUser;
    if (!u) return '';
    return btoa(unescape(encodeURIComponent(JSON.stringify({ id: u.auth_id || u.id, name: u.name, role: u.role, avatar_url: u.avatar_url || null }))));
  }

  createPost() {
    if (!this.newTitle.trim() || !this.newBody.trim()) return;
    this.posting = true;
    this.http.post(`/api/forum/courses/${this.courseId}/posts`,
      { title: this.newTitle, body: this.newBody },
      { headers: { 'X-User-Data': this.getUserHeader() } }
    ).subscribe({
      next: (post: any) => {
        this.posts.unshift({ ...post, replies: [], reply_count: 0, showReplies: false, replyText: '' });
        this.newTitle = '';
        this.newBody = '';
        this.showForm = false;
        this.posting = false;
      },
      error: () => { this.posting = false; }
    });
  }

  toggleReplies(post: any) {
    post.showReplies = !post.showReplies;
  }

  createReply(post: any) {
    if (!post.replyText?.trim()) return;
    this.http.post(`/api/forum/posts/${post.id}/replies`,
      { body: post.replyText },
      { headers: { 'X-User-Data': this.getUserHeader() } }
    ).subscribe({
      next: (reply: any) => {
        post.replies.push(reply);
        post.reply_count++;
        post.replyText = '';
      }
    });
  }

  async deletePost(postId: number) {
    const ok = await this.confirmSvc.open({ title: 'Supprimer la discussion', message: 'Voulez-vous vraiment supprimer cette discussion et toutes ses réponses ?', icon: '🗑️', okLabel: 'Supprimer', okColor: '#ef4444' });
    if (!ok) return;
    this.http.delete(`/api/forum/posts/${postId}`,
      { headers: { 'X-User-Data': this.getUserHeader() } }
    ).subscribe({
      next: () => { this.posts = this.posts.filter(p => p.id !== postId); }
    });
  }

  async deleteReply(post: any, replyId: number) {
    const ok = await this.confirmSvc.open({ title: 'Supprimer la réponse', message: 'Voulez-vous vraiment supprimer cette réponse ?', icon: '🗑️', okLabel: 'Supprimer', okColor: '#ef4444' });
    if (!ok) return;
    this.http.delete(`/api/forum/replies/${replyId}`,
      { headers: { 'X-User-Data': this.getUserHeader() } }
    ).subscribe({
      next: () => {
        post.replies = post.replies.filter((r: any) => r.id !== replyId);
        post.reply_count--;
      }
    });
  }

  startEdit(post: any) {
    this.editingPostId = post.id;
    this.editTitle = post.title;
    this.editBody = post.body;
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editTitle = '';
    this.editBody = '';
  }

  saveEdit(post: any) {
    if (!this.editTitle.trim() || !this.editBody.trim()) return;
    this.http.put(`/api/forum/posts/${post.id}`,
      { title: this.editTitle, body: this.editBody },
      { headers: { 'X-User-Data': this.getUserHeader() } }
    ).subscribe({
      next: () => {
        post.title = this.editTitle;
        post.body = this.editBody;
        this.cancelEdit();
      }
    });
  }

  canDelete(post: any): boolean {
    const u = this.currentUser;
    if (!u) return false;
    return post.user_id === (u.auth_id || u.id) || ['teacher','admin'].includes(u.role);
  }

  canDeleteReply(reply: any): boolean {
    const u = this.currentUser;
    if (!u) return false;
    return reply.user_id === (u.auth_id || u.id) || ['teacher','admin'].includes(u.role);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
}
