import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">
        <div class="messenger">

          <!-- Liste conversations -->
          <div class="conv-panel">
            <div class="conv-header">
              <h2>💬 Messages</h2>
              <span class="unread-badge" *ngIf="totalUnread > 0">{{ totalUnread }}</span>
              <button class="new-conv-btn" (click)="toggleNewConv()" title="Nouveau message">✏️</button>
            </div>
            <!-- Liste des utilisateurs -->
            <div class="users-panel" *ngIf="showNewConv">
              <div class="users-search">
                <input type="text" [(ngModel)]="userSearch" placeholder="Rechercher..." (input)="filterUsers()"/>
              </div>
              <div class="users-list">
                <div class="user-item" *ngFor="let u of filteredUsers" (click)="startOrOpenConv(u.id || u.auth_id, u.name, u.avatar_url)">
                  <div class="conv-avatar">
                    <img *ngIf="u.avatar_url" [src]="u.avatar_url" class="avatar-img" alt=""/>
                    <span *ngIf="!u.avatar_url">{{ getInitials(u.name) }}</span>
                  </div>
                  <div class="conv-info">
                    <div class="conv-name">{{ u.name }}</div>
                    <div class="conv-last">{{ u.role === "teacher" ? "👨‍🏫 Professeur" : "👤 Étudiant" }}</div>
                  </div>
                </div>
                <div class="conv-empty" *ngIf="filteredUsers.length === 0">
                  <p>Aucun utilisateur trouvé</p>
                </div>
              </div>
            </div>
            <div class="conv-search">
              <input type="text" [(ngModel)]="convSearch" placeholder="Rechercher..."/>
            </div>
            <div class="conv-list">
              <div class="conv-empty" *ngIf="conversations.length === 0">
                <div>💬</div>
                <p>Aucune conversation</p>
              </div>
              <div class="conv-item"
                *ngFor="let conv of filteredConvs"
                [class.active]="activeConv?.id === conv.id"
                (click)="openConv(conv)">
                <div class="conv-avatar" [class.has-unread]="conv.unread > 0">
                  <img *ngIf="conv.other_avatar" [src]="conv.other_avatar" class="avatar-img" alt=""/>
                  <span *ngIf="!conv.other_avatar">{{ getInitials(conv.other_name) }}</span>
                </div>
                <div class="conv-info">
                  <div class="conv-name">{{ conv.other_name }}</div>
                  <div class="conv-last">{{ conv.last_message | slice:0:35 }}{{ conv.last_message?.length > 35 ? '...' : '' }}</div>
                </div>
                <div class="conv-right">
                  <div class="conv-time">{{ formatTime(conv.last_message_time) }}</div>
                  <span class="unread-dot" *ngIf="conv.unread > 0">{{ conv.unread }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Zone de chat -->
          <div class="chat-panel" *ngIf="activeConv">
            <div class="chat-header">
              <div class="avatar sm">
                <img *ngIf="activeConv.other_avatar" [src]="activeConv.other_avatar" class="avatar-img" alt=""/>
                <span *ngIf="!activeConv.other_avatar">{{ getInitials(activeConv.other_name) }}</span>
              </div>
              <div class="chat-header-info">
                <div class="chat-name">{{ activeConv.other_name }}</div>
                <div class="chat-status">En ligne</div>
              </div>
            </div>

            <div class="messages-wrap" #messagesWrap>
              <div class="loading" *ngIf="loadingMessages">
                <div class="spinner"></div>
              </div>
              <div class="messages" *ngIf="!loadingMessages">
                <div class="day-sep">Aujourd'hui</div>
                <div class="msg-group" *ngFor="let msg of messages"
                  [class.mine]="msg.sender_id === currentUser?.id || msg.sender_id === currentUser?.auth_id">
                  <div class="msg-avatar" *ngIf="msg.sender_id !== currentUser?.id && msg.sender_id !== currentUser?.auth_id">
                    <img *ngIf="msg.sender_avatar" [src]="msg.sender_avatar" class="avatar-img" alt=""/>
                    <span *ngIf="!msg.sender_avatar">{{ getInitials(msg.sender_name) }}</span>
                  </div>
                  <div class="msg-bubble">
                    <div class="msg-body">{{ msg.body }}</div>
                    <div class="msg-time">{{ formatTime(msg.created_at) }}</div>
                  </div>
                </div>
                <div class="empty-chat" *ngIf="messages.length === 0">
                  <div>👋</div>
                  <p>Commencez la conversation !</p>
                </div>
              </div>
            </div>

            <div class="chat-input">
              <textarea
                [(ngModel)]="newMessage"
                (keydown.enter)="onEnter($event)"
                placeholder="Écrivez un message... (Entrée pour envoyer)"
                rows="1"></textarea>
              <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>

          <!-- Pas de conversation sélectionnée -->
          <div class="chat-panel empty-state" *ngIf="!activeConv">
            <div>💬</div>
            <h3>Sélectionnez une conversation</h3>
            <p>Choisissez une conversation à gauche pour commencer à discuter</p>
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; background:#f0f4ff; display:flex; }
    .messenger { display:flex; flex:1; height:100vh; overflow:hidden; }

    /* Conv panel */
    .conv-panel { width:300px; min-width:300px; background:white; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; }
    .conv-header { padding:1.25rem 1rem .75rem; display:flex; align-items:center; gap:.75rem; border-bottom:1px solid #f1f5f9; }
    .conv-header h2 { margin:0; font-size:1.1rem; color:#1E3A5F; flex:1; }
    .unread-badge { background:#ef4444; color:white; font-size:.72rem; font-weight:700; padding:2px 7px; border-radius:20px; }
    .users-panel { border-bottom:1px solid #e2e8f0; max-height:300px; display:flex; flex-direction:column; }
    .users-search { padding:.6rem 1rem; border-bottom:1px solid #f1f5f9; }
    .users-search input { width:100%; padding:.45rem .75rem; border:1.5px solid #e2e8f0; border-radius:20px; font-size:.82rem; outline:none; box-sizing:border-box; }
    .users-search input:focus { border-color:#1E3A5F; }
    .users-list { overflow-y:auto; flex:1; }
    .user-item { display:flex; align-items:center; gap:.75rem; padding:.7rem 1rem; cursor:pointer; border-bottom:1px solid #f8fafc; transition:.15s; }
    .user-item:hover { background:#f0f4ff; }
    .new-conv-btn { background:rgba(30,58,95,.1); border:none; border-radius:8px; padding:4px 8px; cursor:pointer; font-size:1rem; transition:.2s; }
    .new-conv-btn:hover { background:#1E3A5F; color:white; }
    .new-conv-form { padding:.75rem 1rem; border-bottom:1px solid #f1f5f9; display:flex; flex-direction:column; gap:.5rem; }
    .new-conv-form input { padding:.5rem .75rem; border:1.5px solid #e2e8f0; border-radius:8px; font-size:.83rem; outline:none; }
    .new-conv-form input:focus { border-color:#1E3A5F; }
    .new-conv-form button { background:#1E3A5F; color:white; border:none; border-radius:8px; padding:.5rem; cursor:pointer; font-size:.85rem; font-weight:600; }
    .conv-search { padding:.75rem 1rem; border-bottom:1px solid #f1f5f9; }
    .conv-search input { width:100%; padding:.5rem .75rem; border:1.5px solid #e2e8f0; border-radius:20px; font-size:.83rem; outline:none; box-sizing:border-box; }
    .conv-search input:focus { border-color:#1E3A5F; }
    .conv-list { flex:1; overflow-y:auto; }
    .conv-empty { text-align:center; padding:3rem 1rem; color:#94a3b8; }
    .conv-empty div { font-size:2.5rem; margin-bottom:.75rem; }
    .conv-empty p { margin:0; font-size:.85rem; }
    .conv-item { display:flex; align-items:center; gap:.75rem; padding:.85rem 1rem; cursor:pointer; border-bottom:1px solid #f8fafc; transition:.15s; }
    .conv-item:hover { background:#f8faff; }
    .conv-item.active { background:#e8edf8; }
    .conv-avatar { width:42px; height:42px; border-radius:50%; background:#1E3A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700; flex-shrink:0; overflow:hidden; position:relative; }
    .conv-avatar.has-unread::after { content:''; position:absolute; top:1px; right:1px; width:10px; height:10px; background:#22c55e; border-radius:50%; border:2px solid white; }
    .avatar-img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
    .conv-info { flex:1; min-width:0; }
    .conv-name { font-weight:600; color:#1a2340; font-size:.88rem; }
    .conv-last { font-size:.75rem; color:#94a3b8; margin-top:.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .conv-right { display:flex; flex-direction:column; align-items:flex-end; gap:.3rem; flex-shrink:0; }
    .conv-time { font-size:.68rem; color:#94a3b8; }
    .unread-dot { background:#4361ee; color:white; font-size:.65rem; font-weight:700; min-width:18px; height:18px; border-radius:9px; padding:0 4px; display:flex; align-items:center; justify-content:center; }

    /* Chat panel */
    .chat-panel { flex:1; display:flex; flex-direction:column; }
    .chat-header { padding:1rem 1.5rem; background:white; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; gap:.9rem; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    .avatar { width:38px; height:38px; border-radius:50%; background:#1E3A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; flex-shrink:0; overflow:hidden; }
    .avatar.sm { width:38px; height:38px; }
    .chat-name { font-weight:700; color:#1a2340; font-size:.95rem; }
    .chat-status { font-size:.75rem; color:#22c55e; }
    .messages-wrap { flex:1; overflow-y:auto; padding:1.5rem; background:#f0f4ff; }
    .loading { display:flex; justify-content:center; padding:2rem; }
    .spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#1E3A5F; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .day-sep { text-align:center; font-size:.72rem; color:#94a3b8; margin:1rem 0; position:relative; }
    .day-sep::before { content:''; position:absolute; top:50%; left:0; right:0; height:1px; background:#e2e8f0; z-index:0; }
    .day-sep { background:transparent; }

    .msg-group { display:flex; align-items:flex-end; gap:.5rem; margin-bottom:.75rem; }
    .msg-group.mine { flex-direction:row-reverse; }
    .msg-avatar { width:28px; height:28px; border-radius:50%; background:#1E3A5F; color:white; display:flex; align-items:center; justify-content:center; font-size:.6rem; font-weight:700; flex-shrink:0; overflow:hidden; }
    .msg-bubble { max-width:65%; }
    .msg-body { background:white; padding:.6rem .9rem; border-radius:18px 18px 18px 4px; font-size:.88rem; color:#1a2340; line-height:1.5; box-shadow:0 1px 3px rgba(0,0,0,.07); word-break:break-word; }
    .mine .msg-body { background:#1E3A5F; color:white; border-radius:18px 18px 4px 18px; }
    .msg-time { font-size:.65rem; color:#94a3b8; margin-top:.25rem; text-align:right; }
    .mine .msg-time { text-align:right; }
    .empty-chat { text-align:center; padding:3rem; color:#94a3b8; }
    .empty-chat div { font-size:2.5rem; margin-bottom:.75rem; }
    .empty-chat p { margin:0; font-size:.85rem; }

    .chat-input { padding:1rem 1.5rem; background:white; border-top:1px solid #e2e8f0; display:flex; align-items:flex-end; gap:.75rem; }
    .chat-input textarea { flex:1; border:1.5px solid #e2e8f0; border-radius:12px; padding:.65rem 1rem; font-size:.9rem; resize:none; outline:none; font-family:inherit; max-height:120px; }
    .chat-input textarea:focus { border-color:#1E3A5F; }
    .send-btn { background:#1E3A5F; color:white; border:none; border-radius:12px; padding:.65rem .9rem; cursor:pointer; display:flex; align-items:center; transition:.2s; flex-shrink:0; }
    .send-btn:hover:not(:disabled) { background:#0f2544; }
    .send-btn:disabled { opacity:.4; cursor:not-allowed; }

    .empty-state { align-items:center; justify-content:center; flex-direction:column; gap:1rem; color:#94a3b8; background:#f8faff; }
    .empty-state div { font-size:4rem; }
    .empty-state h3 { margin:0; color:#1E3A5F; }
    .empty-state p { margin:0; font-size:.85rem; }
  `]
})
export class MessagingComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesWrap') messagesWrap!: ElementRef;

  conversations: any[] = [];
  activeConv: any = null;
  messages: any[] = [];
  newMessage = '';
  convSearch = '';
  showNewConv = false;
  newConvName = '';
  newConvId: number | null = null;
  users: any[] = [];
  filteredUsers: any[] = [];
  userSearch = '';
  loadingMessages = false;
  totalUnread = 0;
  currentUser: any;
  private sseSource: EventSource | null = null;
  private shouldScroll = false;

  get filteredConvs() {
    if (!this.convSearch.trim()) return this.conversations;
    return this.conversations.filter(c =>
      c.other_name?.toLowerCase().includes(this.convSearch.toLowerCase())
    );
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.loadConversations();

    // Ouvrir une conversation depuis query param
    this.route.queryParams.subscribe(params => {
      if (params['with'] && params['name']) {
        this.startOrOpenConv(+params['with'], params['name'], params['avatar'] || null);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    this.sseSource?.close();
  }

  getUserHeader(): string {
    const u = this.currentUser;
    if (!u) return '';
    return btoa(unescape(encodeURIComponent(JSON.stringify({
      id: u.auth_id || u.id,
      name: u.name,
      role: u.role,
      avatar_url: u.avatar_url || null
    }))));
  }

  toggleNewConv() {
    this.showNewConv = !this.showNewConv;
    if (this.showNewConv && this.users.length === 0) {
      const myId = this.currentUser?.auth_id || this.currentUser?.id;
      // Récupérer les profs depuis les cours
      this.http.get<any[]>('/api/courses').subscribe({
        next: (courses) => {
          const seen = new Set();
          const users: any[] = [];
          courses.forEach((c: any) => {
            if (c.instructor && !seen.has(c.instructor.id)) {
              seen.add(c.instructor.id);
              if (c.instructor.id != myId) {
                users.push({ ...c.instructor, role: 'teacher' });
              }
            }
            // Ajouter aussi instructor_id si pas d'objet instructor
            if (!c.instructor && c.instructor_id && c.instructor_id != myId && !seen.has(c.instructor_id)) {
              seen.add(c.instructor_id);
              users.push({ id: c.instructor_id, auth_id: c.instructor_id, name: c.instructor_name || 'Professeur', role: 'teacher', avatar_url: null });
            }
          });
          this.users = users;
          this.filteredUsers = [...users];
        },
        error: () => {}
      });
    }
  }

  filterUsers() {
    const q = this.userSearch.toLowerCase();
    this.filteredUsers = q
      ? this.users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      : [...this.users];
  }

  startNewConv() {
    if (!this.newConvId || !this.newConvName.trim()) return;
    this.startOrOpenConv(this.newConvId, this.newConvName.trim(), null);
    this.showNewConv = false;
    this.newConvName = '';
    this.newConvId = null;
  }

  loadConversations() {
    this.http.get<any[]>('/api/messaging/conversations', {
      headers: { 'X-User-Data': this.getUserHeader() }
    }).subscribe({
      next: (convs) => {
        this.conversations = convs;
        this.totalUnread = convs.reduce((acc, c) => acc + (c.unread || 0), 0);
      }
    });
  }

  openConv(conv: any) {
    this.activeConv = conv;
    this.loadingMessages = true;
    this.sseSource?.close();

    this.http.get<any[]>(`/api/messaging/conversations/${conv.id}/messages`, {
      headers: { 'X-User-Data': this.getUserHeader() }
    }).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.loadingMessages = false;
        this.shouldScroll = true;
        conv.unread = 0;
        this.totalUnread = this.conversations.reduce((acc, c) => acc + (c.unread || 0), 0);
        this.startSSE(conv.id, msgs.length > 0 ? msgs[msgs.length - 1].id : 0);
      }
    });
  }

  startSSE(convId: number, lastId: number) {
    const uid = this.currentUser?.auth_id || this.currentUser?.id;
    const userData = this.getUserHeader();
    this.sseSource = new EventSource(
      `/api/messaging/conversations/${convId}/stream?lastId=${lastId}&X-User-Data=${encodeURIComponent(userData)}`
    );
    this.sseSource.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (!this.messages.find(m => m.id === msg.id)) {
        this.messages.push(msg);
        this.shouldScroll = true;
      }
    };
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.activeConv) return;
    const body = this.newMessage.trim();
    this.newMessage = '';

    this.http.post<any>(`/api/messaging/conversations/${this.activeConv.id}/messages`,
      { body },
      { headers: { 'X-User-Data': this.getUserHeader() } }
    ).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.activeConv.last_message = body;
        this.shouldScroll = true;
      }
    });
  }

  startOrOpenConv(otherId: number, otherName: string, otherAvatar: string | null) {
    this.showNewConv = false;
    this.userSearch = '';
    const existing = this.conversations.find(c => c.other_id === otherId);
    if (existing) { this.openConv(existing); return; }

    this.http.post<any>('/api/messaging/conversations',
      { other_id: otherId, other_name: otherName, other_avatar: otherAvatar },
      { headers: { 'X-User-Data': this.getUserHeader() } }
    ).subscribe({
      next: (conv) => {
        conv.other_id = otherId;
        conv.other_name = otherName;
        conv.other_avatar = otherAvatar;
        conv.last_message = '';
        conv.unread = 0;
        this.conversations.unshift(conv);
        this.openConv(conv);
      }
    });
  }

  onEnter(e: Event) {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  scrollToBottom() {
    try {
      const el = this.messagesWrap.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatTime(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
