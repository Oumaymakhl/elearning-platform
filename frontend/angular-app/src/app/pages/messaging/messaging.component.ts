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
                <div class="user-item" *ngFor="let u of filteredUsers" (click)="startOrOpenConv(u.id, u.name, u.avatar_url)">
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
                <p>Aucune conversation pour l'instant</p>
              </div>
              <div class="section-label" *ngIf="conversations.length > 0">Messages récents</div>
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
                <div class="chat-status">● En ligne</div>
              </div>
              <div class="header-actions">
                <button class="icon-btn" title="Appel vidéo">📹</button>
                <button class="icon-btn" title="Infos">ℹ️</button>
              </div>
            </div>

            <div class="messages-wrap" #messagesWrap>
              <div class="loading" *ngIf="loadingMessages">
                <div class="spinner"></div>
              </div>
              <div class="messages" *ngIf="!loadingMessages">
                <div class="day-sep"><span>Aujourd'hui</span></div>
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
                  <h4>Début de la conversation</h4>
                  <p>Envoyez un message pour démarrer la discussion avec {{ activeConv.other_name }}</p>
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
          <div class="chat-panel empty-state" *ngIf="!activeConv" style="display:flex;">
            <div class="empty-icon">💬</div>
            <h3>Vos messages</h3>
            <p>Sélectionnez une conversation ou démarrez-en une nouvelle avec un professeur</p>
            <button class="empty-cta" (click)="toggleNewConv()">✏️ Nouveau message</button>
          </div>

        </div>
      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; display:flex; background:#f0f4f8; }
    .messenger { display:flex; flex:1; height:100vh; overflow:hidden; }

    /* ── LEFT PANEL ── */
    .conv-panel {
      width:340px; min-width:340px; display:flex; flex-direction:column;
      background:#1a2340;
    }
    .conv-header {
      padding:1.5rem 1.25rem 1rem;
      display:flex; align-items:center; gap:.75rem;
    }
    .conv-header h2 { color:#fff; font-size:1.2rem; font-weight:700; flex:1; letter-spacing:-.3px; }
    .unread-badge {
      background:#ef4444; color:#fff; font-size:.68rem; font-weight:700;
      padding:2px 8px; border-radius:20px;
    }
    .new-conv-btn {
      width:34px; height:34px; border-radius:10px;
      background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15);
      color:#fff; font-size:1.1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center; transition:.2s;
    }
    .new-conv-btn:hover { background:rgba(255,255,255,.2); transform:scale(1.05); }

    .conv-search { padding:.5rem 1.25rem .75rem; }
    .conv-search input {
      width:100%; padding:.6rem 1rem; border-radius:12px;
      border:none; background:rgba(255,255,255,.08);
      color:#fff; font-size:.82rem; outline:none;
    }
    .conv-search input::placeholder { color:rgba(255,255,255,.35); }
    .conv-search input:focus { background:rgba(255,255,255,.14); }

    .conv-list { flex:1; overflow-y:auto; padding-bottom:1rem; }
    .conv-list::-webkit-scrollbar { width:3px; }
    .conv-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12); border-radius:3px; }

    .conv-empty { text-align:center; padding:3rem 1rem; color:rgba(255,255,255,.4); }
    .conv-empty div { font-size:2rem; margin-bottom:.75rem; }
    .conv-empty p { font-size:.82rem; }

    .section-label {
      padding:.75rem 1.25rem .35rem; font-size:.68rem; font-weight:700;
      color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:1px;
    }

    .conv-item {
      display:flex; align-items:center; gap:.85rem;
      padding:.75rem 1.25rem; cursor:pointer; transition:.15s;
      border-left:3px solid transparent;
    }
    .conv-item:hover { background:rgba(255,255,255,.06); }
    .conv-item.active { background:rgba(255,255,255,.1); border-left-color:#4361ee; }

    .conv-avatar {
      width:44px; height:44px; border-radius:14px;
      background:linear-gradient(135deg,#4361ee,#7c3aed);
      color:#fff; display:flex; align-items:center; justify-content:center;
      font-size:.82rem; font-weight:700; flex-shrink:0; overflow:hidden; position:relative;
    }
    .conv-avatar.has-unread::after {
      content:''; position:absolute; top:-1px; right:-1px;
      width:12px; height:12px; background:#22c55e;
      border-radius:50%; border:2px solid #1a2340;
    }
    .avatar-img { width:100%; height:100%; object-fit:cover; }

    .conv-info { flex:1; min-width:0; }
    .conv-name { font-weight:600; color:#fff; font-size:.88rem; }
    .conv-last { font-size:.74rem; color:rgba(255,255,255,.4); margin-top:.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    .conv-right { display:flex; flex-direction:column; align-items:flex-end; gap:.35rem; flex-shrink:0; }
    .conv-time { font-size:.68rem; color:rgba(255,255,255,.3); }
    .unread-dot {
      background:#4361ee; color:#fff; font-size:.62rem; font-weight:700;
      min-width:18px; height:18px; border-radius:9px; padding:0 4px;
      display:flex; align-items:center; justify-content:center;
    }

    /* Users panel */
    .users-panel { background:rgba(255,255,255,.04); border-top:1px solid rgba(255,255,255,.08); max-height:300px; display:flex; flex-direction:column; }
    .users-search { padding:.6rem 1.25rem; border-bottom:1px solid rgba(255,255,255,.06); }
    .users-search input { width:100%; padding:.5rem .85rem; border-radius:10px; border:none; background:rgba(255,255,255,.08); color:#fff; font-size:.8rem; outline:none; }
    .users-search input::placeholder { color:rgba(255,255,255,.3); }
    .users-list { overflow-y:auto; flex:1; }
    .user-item { display:flex; align-items:center; gap:.85rem; padding:.65rem 1.25rem; cursor:pointer; transition:.15s; }
    .user-item:hover { background:rgba(255,255,255,.07); }

    /* ── CHAT AREA ── */
    .chat-panel { flex:1; display:flex; flex-direction:column; background:#f0f4f8; }

    .chat-header {
      padding:.9rem 1.75rem; background:#fff;
      border-bottom:1px solid #e8edf5;
      display:flex; align-items:center; gap:1rem;
      box-shadow:0 1px 0 rgba(0,0,0,.05);
    }
    .avatar {
      width:42px; height:42px; border-radius:14px;
      background:linear-gradient(135deg,#4361ee,#7c3aed);
      color:#fff; display:flex; align-items:center; justify-content:center;
      font-size:.8rem; font-weight:700; flex-shrink:0; overflow:hidden;
    }
    .avatar.sm { width:42px; height:42px; }
    .chat-header-info { flex:1; }
    .chat-name { font-weight:700; color:#0f1729; font-size:.98rem; }
    .chat-status { font-size:.72rem; color:#22c55e; font-weight:600; margin-top:1px; }

    .header-actions { display:flex; gap:.5rem; }
    .icon-btn {
      width:36px; height:36px; border-radius:10px;
      background:#f5f7ff; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      color:#64748b; font-size:.95rem; transition:.2s;
    }
    .icon-btn:hover { background:#eef2ff; color:#4361ee; }

    /* Messages */
    .messages-wrap { flex:1; overflow-y:auto; padding:1.5rem 2rem; }
    .messages-wrap::-webkit-scrollbar { width:4px; }
    .messages-wrap::-webkit-scrollbar-thumb { background:#d1d9f0; border-radius:4px; }

    .loading { display:flex; justify-content:center; padding:2rem; }
    .spinner { width:28px; height:28px; border:3px solid #e2e8f0; border-top-color:#4361ee; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .day-sep {
      text-align:center; font-size:.7rem; color:#94a3b8; margin:1.5rem 0;
      display:flex; align-items:center; gap:.75rem;
    }
    .day-sep::before,.day-sep::after { content:''; flex:1; height:1px; background:#e2e8f0; }
    .day-sep span { white-space:nowrap; background:#f0f4f8; padding:0 .5rem; }

    .msg-group { display:flex; align-items:flex-end; gap:.6rem; margin-bottom:1.25rem; }
    .msg-group.mine { flex-direction:row-reverse; }

    .msg-avatar {
      width:32px; height:32px; border-radius:10px;
      background:linear-gradient(135deg,#4361ee,#7c3aed);
      color:#fff; display:flex; align-items:center; justify-content:center;
      font-size:.62rem; font-weight:700; flex-shrink:0; overflow:hidden;
    }

    .msg-bubble { max-width:58%; display:flex; flex-direction:column; }

    .msg-sender { font-size:.68rem; color:#94a3b8; margin-bottom:.25rem; padding-left:.25rem; }
    .mine .msg-sender { text-align:right; padding-right:.25rem; }

    .msg-body {
      background:#fff; padding:.75rem 1.1rem;
      border-radius:16px 16px 16px 4px;
      font-size:.88rem; color:#1a2340; line-height:1.6;
      box-shadow:0 1px 4px rgba(0,0,0,.06); word-break:break-word;
    }
    .mine .msg-body {
      background:#4361ee; color:#fff;
      border-radius:16px 16px 4px 16px;
      box-shadow:0 2px 12px rgba(67,97,238,.25);
    }

    .msg-time { font-size:.65rem; color:#94a3b8; margin-top:.3rem; padding:0 .35rem; }
    .mine .msg-time { text-align:right; }

    .empty-chat { text-align:center; padding:5rem 2rem; color:#94a3b8; }
    .empty-chat div { font-size:3.5rem; margin-bottom:1.25rem; }
    .empty-chat h4 { color:#1E3A5F; font-size:1.1rem; margin-bottom:.5rem; }
    .empty-chat p { font-size:.85rem; max-width:260px; margin:0 auto; line-height:1.6; }

    /* Input */
    .chat-input {
      padding:1rem 1.75rem 1.25rem; background:#fff;
      border-top:1px solid #e8edf5;
      display:flex; align-items:flex-end; gap:.85rem;
    }
    .chat-input textarea {
      flex:1; border:1.5px solid #e8edf5; border-radius:16px;
      padding:.75rem 1.25rem; font-size:.9rem; resize:none; outline:none;
      font-family:inherit; max-height:120px; background:#f8faff;
      color:#1a2340; line-height:1.5; transition:.2s;
    }
    .chat-input textarea:focus { border-color:#4361ee; background:#fff; box-shadow:0 0 0 3px rgba(67,97,238,.08); }
    .chat-input textarea::placeholder { color:#94a3b8; }

    .send-btn {
      width:46px; height:46px; border-radius:14px;
      background:#4361ee; color:#fff; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center; transition:.2s;
      box-shadow:0 4px 14px rgba(67,97,238,.3); flex-shrink:0;
    }
    .send-btn:hover:not(:disabled) { background:#3451d1; transform:translateY(-1px); box-shadow:0 6px 18px rgba(67,97,238,.38); }
    .send-btn:active:not(:disabled) { transform:translateY(0); }
    .send-btn:disabled { opacity:.4; cursor:not-allowed; box-shadow:none; }

    /* Empty state */
    .empty-state {
      align-items:center; justify-content:center; flex-direction:column; gap:1.25rem;
      color:#94a3b8; background:#f0f4f8;
    }
    .empty-icon {
      width:80px; height:80px; border-radius:24px; background:#eef2ff;
      display:flex; align-items:center; justify-content:center; font-size:2.5rem;
    }
    .empty-state h3 { margin:0; color:#1E3A5F; font-size:1.3rem; font-weight:700; }
    .empty-state p { margin:0; font-size:.88rem; max-width:260px; text-align:center; line-height:1.7; }
    .empty-cta { background:#4361ee; color:#fff; border:none; border-radius:12px; padding:.65rem 1.5rem; font-size:.88rem; font-weight:600; cursor:pointer; margin-top:.5rem; }
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
      this.http.get<any>('http://localhost:8001/api/teachers').subscribe({
        next: (teachers: any[]) => {
          const users = teachers
            .filter((u: any) => (u.auth_id || u.id) != myId)
            .map((u: any) => ({
              id: u.auth_id || u.id,
              name: u.name,
              email: u.email,
              role: 'teacher',
              avatar_url: u.avatar ? `/storage/${u.avatar}` : null
            }));
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
    this.http.get<any[]>('http://localhost:8009/api/messaging/conversations', {
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

    this.http.get<any[]>(`http://localhost:8009/api/messaging/conversations/${conv.id}/messages`, {
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
      `http://localhost:8009/api/messaging/conversations/${convId}/stream?lastId=${lastId}&X-User-Data=${encodeURIComponent(userData)}`
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

    this.http.post<any>(`http://localhost:8009/api/messaging/conversations/${this.activeConv.id}/messages`,
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

    this.http.post<any>('http://localhost:8009/api/messaging/conversations',
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
