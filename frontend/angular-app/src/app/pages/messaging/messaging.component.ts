import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">
        <div class="messenger">

          <!-- LEFT PANEL -->
          <div class="conv-panel">
            <div class="conv-header">
              <h2>💬 Messages</h2>
              <span class="unread-badge" *ngIf="totalUnread > 0">{{ totalUnread }}</span>
              <button class="new-conv-btn" *ngIf="currentUser?.role !== 'teacher'" (click)="toggleNewConv()" title="Nouveau message">✏️</button>
            </div>

            <div class="users-panel" *ngIf="showNewConv && currentUser?.role !== 'teacher'">
              <div class="users-search">
                <input type="text" [(ngModel)]="userSearch" placeholder="🔍 Rechercher un utilisateur..." (input)="filterUsers()" autofocus/>
              </div>
              <div class="users-list">
                <div class="user-item" *ngFor="let u of filteredUsers" (click)="startOrOpenConv(u.id, u.name, u.avatar_url)">
                  <div class="conv-avatar">
                    <img *ngIf="u.avatar_url" [src]="u.avatar_url" class="avatar-img" alt=""/>
                    <span *ngIf="!u.avatar_url">{{ getInitials(u.name) }}</span>
                  </div>
                  <div class="conv-info">
                    <div class="conv-name">{{ u.name }}</div>
                    <div class="conv-last">{{ u.role === 'teacher' ? '👨‍🏫 Professeur' : '👤 Étudiant' }}</div>
                  </div>
                </div>
                <div class="conv-empty" *ngIf="filteredUsers.length === 0 && !loadingUsers">
                  <p>Aucun utilisateur trouvé</p>
                </div>
                <div class="conv-empty" *ngIf="loadingUsers">
                  <div class="spinner-sm"></div>
                </div>
              </div>
            </div>

            <div class="conv-search">
              <input type="text" [(ngModel)]="convSearch" placeholder="🔍 Rechercher..."/>
            </div>

            <div class="conv-list">
              <div class="conv-empty" *ngIf="conversations.length === 0 && !loadingConvs">
                <div>💬</div>
                <p>Aucune conversation</p>
                <button class="empty-cta-sm" *ngIf="currentUser?.role !== 'teacher'" (click)="toggleNewConv()">Démarrer une discussion</button>
              </div>
              <div class="conv-empty" *ngIf="loadingConvs">
                <div class="spinner-sm"></div>
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
                  <div class="conv-name" [class.bold]="conv.unread > 0">{{ conv.other_name }}</div>
                  <div class="conv-last" [class.unread-text]="conv.unread > 0">
                    {{ conv.last_message | slice:0:38 }}{{ conv.last_message?.length > 38 ? '...' : '' }}
                  </div>
                </div>
                <div class="conv-right">
                  <div class="conv-time">{{ formatTime(conv.last_message_time) }}</div>
                  <span class="unread-dot" *ngIf="conv.unread > 0">{{ conv.unread }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- CHAT PANEL -->
          <div class="chat-panel" *ngIf="activeConv">
            <div class="chat-header">
              <div class="avatar sm">
                <img *ngIf="activeConv.other_avatar" [src]="activeConv.other_avatar" class="avatar-img" alt=""/>
                <span *ngIf="!activeConv.other_avatar">{{ getInitials(activeConv.other_name) }}</span>
              </div>
              <div class="chat-header-info">
                <div class="chat-name">{{ activeConv.other_name }}</div>
                <div class="chat-status" [ngClass]="activeConv.is_online ? 'online' : 'offline'">
                  {{ activeConv.is_online ? '● En ligne' : '○ Hors ligne' }}
                </div>
              </div>
              <div class="header-actions">
                <button class="icon-btn" title="Rechercher" (click)="toggleSearch()">🔍</button>
                <button class="icon-btn" title="Supprimer la conversation" (click)="deleteConv()">🗑️</button>
                <button class="icon-btn" title="Infos" (click)="toggleInfo()">ℹ️</button>
              <div class="info-panel" *ngIf="showInfo">
                <div class="info-avatar"><img *ngIf="activeConv.other_avatar" [src]="activeConv.other_avatar" class="avatar-img" alt=""/><span *ngIf="!activeConv.other_avatar">{{ getInitials(activeConv.other_name) }}</span></div>
                <div class="info-name">{{ activeConv.other_name }}</div>
                <div class="info-role">{{ currentUser?.role === "student" ? "👨‍🏫 Formateur" : "👤 Étudiant" }}</div>
                <button class="info-close" (click)="showInfo=false">✕</button>
              </div>
              </div>
            </div>

            <div class="search-bar" *ngIf="showSearch">
              <input type="text" [(ngModel)]="searchQuery" (input)="searchMessages()" placeholder="🔍 Rechercher dans les messages..." autofocus/>
              <span class="search-count" *ngIf="searchQuery">{{ searchResults.length }} résultat(s)</span>
              <button (click)="showSearch=false; searchQuery=''; searchResults=[]">✕</button>
            </div>
            <div class="messages-wrap" #messagesWrap>
              <div class="loading" *ngIf="loadingMessages">
                <div class="spinner"></div>
              </div>
              <div class="messages" *ngIf="!loadingMessages">
                <div class="day-sep"><span>{{ todayLabel }}</span></div>

                <ng-container *ngFor="let msg of messages; let i = index">
                  <div class="day-sep" *ngIf="i > 0 && isDifferentDay(messages[i-1].created_at, msg.created_at)">
                    <span>{{ formatDate(msg.created_at) }}</span>
                  </div>
                  <div class="msg-group" [class.mine]="msg.sender_id === currentUser?.myId" [class.highlight]="searchResults.includes(msg)">
                    <div class="msg-avatar" *ngIf="msg.sender_id !== currentUser?.myId">
                      <img *ngIf="msg.sender_avatar" [src]="msg.sender_avatar" class="avatar-img" alt=""/>
                      <span *ngIf="!msg.sender_avatar">{{ getInitials(msg.sender_name) }}</span>
                    </div>
                    <div class="msg-bubble">
                      <div class="msg-body file-msg" *ngIf="msg.body.startsWith('📎 ')" (click)="downloadFile(msg.body)">
                        <span class="file-msg-icon">📄</span>
                        <span class="file-msg-name">{{ getFileName(msg.body) }}</span>
                        <span class="file-dl-icon">⬇️</span>
                      </div>
                      <div class="msg-body" *ngIf="!msg.body.startsWith('📎 ') && !msg.body.startsWith('[Fichier:')">{{ msg.body }}</div>
                      <div class="msg-body file-msg" *ngIf="msg.body.startsWith('[Fichier:')">
                        <span class="file-msg-icon">📄</span>
                        <span class="file-msg-name">{{ msg.body }}</span>
                      </div>
                      <div class="msg-time">
                        {{ formatTime(msg.created_at) }}
                        <span class="msg-read" *ngIf="msg.sender_id === currentUser?.myId">
                          {{ msg.read_at ? ' ✓✓' : ' ✓' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </ng-container>

                <div class="msg-group typing-group" *ngIf="otherIsTyping">
                  <div class="msg-avatar">
                    <img *ngIf="activeConv.other_avatar" [src]="activeConv.other_avatar" class="avatar-img" alt=""/>
                    <span *ngIf="!activeConv.other_avatar">{{ getInitials(activeConv.other_name) }}</span>
                  </div>
                  <div class="typing-bubble">
                    <span></span><span></span><span></span>
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
              <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*,.pdf,.doc,.docx" style="display:none"/><button class="attach-btn" title="Joindre un fichier" (click)="fileInput.click()">📎</button>
              <div class="file-preview" *ngIf="pendingFile">
                <span class="file-icon">📄</span>
                <span class="file-name">{{ pendingFile.name }}</span>
                <span class="file-size">{{ pendingFile.size }}</span>
                <button class="file-remove" (click)="pendingFile=null">✕</button>
              </div>
              <textarea
                [(ngModel)]="newMessage"
                (keydown.enter)="onEnter($event)"
                (input)="onTyping()"
                placeholder="Écrivez un message... (Entrée pour envoyer)"
                rows="1"></textarea>
              <button class="emoji-btn" title="Emoji" (click)="toggleEmoji()">😊</button>
              <button class="send-btn" (click)="sendMessage()" [disabled]="(!newMessage.trim() && !pendingFile) || sending">
                <div class="spinner-send" *ngIf="sending"></div>
                <svg *ngIf="!sending" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>

            <div class="emoji-picker" *ngIf="showEmoji">
              <span *ngFor="let e of emojis" (click)="insertEmoji(e)">{{ e }}</span>
            </div>
          </div>

          <!-- Empty state -->
          <div class="chat-panel empty-state" *ngIf="!activeConv" style="display:flex;">
            <div class="empty-icon">💬</div>
            <h3>Vos messages</h3>
            <p>Sélectionnez une conversation ou démarrez-en une nouvelle</p>
            <button class="empty-cta" *ngIf="currentUser?.role !== 'teacher'" (click)="toggleNewConv()">✏️ Nouveau message</button>
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

    .conv-panel { width:340px; min-width:340px; display:flex; flex-direction:column; background:#1a2340; }
    .conv-header { padding:1.5rem 1.25rem 1rem; display:flex; align-items:center; gap:.75rem; }
    .conv-header h2 { color:#fff; font-size:1.2rem; font-weight:700; flex:1; letter-spacing:-.3px; }
    .unread-badge { background:#ef4444; color:#fff; font-size:.68rem; font-weight:700; padding:2px 8px; border-radius:20px; animation:pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.7} }
    .new-conv-btn { width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15); color:#fff; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:.2s; }
    .new-conv-btn:hover { background:rgba(255,255,255,.2); transform:scale(1.05); }

    .conv-search { padding:.5rem 1.25rem .75rem; }
    .conv-search input { width:100%; padding:.6rem 1rem; border-radius:12px; border:none; background:rgba(255,255,255,.08); color:#fff; font-size:.82rem; outline:none; transition:.2s; }
    .conv-search input::placeholder { color:rgba(255,255,255,.35); }
    .conv-search input:focus { background:rgba(255,255,255,.14); }

    .conv-list { flex:1; overflow-y:auto; padding-bottom:1rem; }
    .conv-list::-webkit-scrollbar { width:3px; }
    .conv-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12); border-radius:3px; }

    .conv-empty { text-align:center; padding:2.5rem 1rem; color:rgba(255,255,255,.4); }
    .conv-empty div { font-size:2rem; margin-bottom:.75rem; }
    .conv-empty p { font-size:.82rem; margin-bottom:.75rem; }
    .empty-cta-sm { background:rgba(67,97,238,.4); color:#fff; border:1px solid rgba(67,97,238,.6); border-radius:8px; padding:.4rem 1rem; font-size:.78rem; cursor:pointer; transition:.2s; }
    .empty-cta-sm:hover { background:rgba(67,97,238,.6); }

    .section-label { padding:.75rem 1.25rem .35rem; font-size:.68rem; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:1px; }

    .conv-item { display:flex; align-items:center; gap:.85rem; padding:.75rem 1.25rem; cursor:pointer; transition:.15s; border-left:3px solid transparent; }
    .conv-item:hover { background:rgba(255,255,255,.06); }
    .conv-item.active { background:rgba(255,255,255,.1); border-left-color:#4361ee; }

    .conv-avatar { width:44px; height:44px; border-radius:14px; background:linear-gradient(135deg,#4361ee,#7c3aed); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.82rem; font-weight:700; flex-shrink:0; overflow:hidden; position:relative; }
    .conv-avatar.has-unread::after { content:''; position:absolute; top:-1px; right:-1px; width:12px; height:12px; background:#22c55e; border-radius:50%; border:2px solid #1a2340; }
    .avatar-img { width:100%; height:100%; object-fit:cover; }

    .conv-info { flex:1; min-width:0; }
    .conv-name { font-weight:600; color:#fff; font-size:.88rem; }
    .conv-name.bold { font-weight:800; }
    .conv-last { font-size:.74rem; color:rgba(255,255,255,.4); margin-top:.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .conv-last.unread-text { color:rgba(255,255,255,.75); font-weight:600; }

    .conv-right { display:flex; flex-direction:column; align-items:flex-end; gap:.35rem; flex-shrink:0; }
    .conv-time { font-size:.68rem; color:rgba(255,255,255,.3); }
    .unread-dot { background:#4361ee; color:#fff; font-size:.62rem; font-weight:700; min-width:18px; height:18px; border-radius:9px; padding:0 4px; display:flex; align-items:center; justify-content:center; }

    .users-panel { background:rgba(255,255,255,.04); border-top:1px solid rgba(255,255,255,.08); max-height:280px; display:flex; flex-direction:column; animation:slideDown .2s ease; }
    @keyframes slideDown { from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)} }
    .users-search { padding:.6rem 1.25rem; border-bottom:1px solid rgba(255,255,255,.06); }
    .users-search input { width:100%; padding:.5rem .85rem; border-radius:10px; border:none; background:rgba(255,255,255,.08); color:#fff; font-size:.8rem; outline:none; }
    .users-search input::placeholder { color:rgba(255,255,255,.3); }
    .users-list { overflow-y:auto; flex:1; }
    .user-item { display:flex; align-items:center; gap:.85rem; padding:.65rem 1.25rem; cursor:pointer; transition:.15s; }
    .user-item:hover { background:rgba(255,255,255,.07); }

    .spinner-sm { width:20px; height:20px; border:2px solid rgba(255,255,255,.15); border-top-color:#4361ee; border-radius:50%; animation:spin 1s linear infinite; margin:1rem auto; }

    .chat-panel { flex:1; display:flex; flex-direction:column; background:#f0f4f8; position:relative; }

    .chat-header { padding:.9rem 1.75rem; background:#fff; border-bottom:1px solid #e8edf5; display:flex; align-items:center; gap:1rem; box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .avatar { width:42px; height:42px; border-radius:14px; background:linear-gradient(135deg,#4361ee,#7c3aed); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700; flex-shrink:0; overflow:hidden; }
    .chat-header-info { flex:1; }
    .chat-name { font-weight:700; color:#0f1729; font-size:.98rem; }
    .chat-status { font-size:.72rem; color:#22c55e; font-weight:600; margin-top:1px; }
    .chat-status.offline { color:#94a3b8; }

    .header-actions { display:flex; gap:.5rem; }
    .icon-btn { width:36px; height:36px; border-radius:10px; background:#f5f7ff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:.95rem; transition:.2s; }
    .icon-btn:hover { background:#eef2ff; color:#4361ee; transform:scale(1.05); }

    .messages-wrap { flex:1; overflow-y:auto; padding:1.5rem 2rem; }
    .messages-wrap::-webkit-scrollbar { width:4px; }
    .messages-wrap::-webkit-scrollbar-thumb { background:#d1d9f0; border-radius:4px; }

    .loading { display:flex; justify-content:center; padding:2rem; }
    .spinner { width:28px; height:28px; border:3px solid #e2e8f0; border-top-color:#4361ee; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }

    .day-sep { text-align:center; font-size:.7rem; color:#94a3b8; margin:1.5rem 0; display:flex; align-items:center; gap:.75rem; }
    .day-sep::before,.day-sep::after { content:''; flex:1; height:1px; background:#e2e8f0; }
    .day-sep span { white-space:nowrap; background:#f0f4f8; padding:0 .5rem; }

    .msg-group { display:flex; align-items:flex-end; gap:.6rem; margin-bottom:.85rem; animation:msgIn .2s ease; }
    @keyframes msgIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
    .msg-group.mine { flex-direction:row-reverse; }

    .msg-avatar { width:32px; height:32px; border-radius:10px; background:linear-gradient(135deg,#4361ee,#7c3aed); color:#fff; display:flex; align-items:center; justify-content:center; font-size:.62rem; font-weight:700; flex-shrink:0; overflow:hidden; }
    .msg-bubble { max-width:58%; display:flex; flex-direction:column; }
    .msg-body { background:#fff; padding:.7rem 1rem; border-radius:16px 16px 16px 4px; font-size:.88rem; color:#1a2340; line-height:1.6; box-shadow:0 1px 4px rgba(0,0,0,.06); word-break:break-word; }
    .mine .msg-body { background:linear-gradient(135deg,#4361ee,#5a72f5); color:#fff; border-radius:16px 16px 4px 16px; box-shadow:0 2px 12px rgba(67,97,238,.3); }
    .msg-time { font-size:.65rem; color:#94a3b8; margin-top:.3rem; padding:0 .35rem; display:flex; align-items:center; gap:.2rem; }
    .mine .msg-time { justify-content:flex-end; }
    .msg-read { color:#a5b4fc; font-size:.7rem; }

    .typing-bubble { background:#fff; padding:.7rem 1rem; border-radius:16px 16px 16px 4px; box-shadow:0 1px 4px rgba(0,0,0,.06); display:flex; align-items:center; gap:4px; }
    .typing-bubble span { width:7px; height:7px; border-radius:50%; background:#94a3b8; animation:bounce 1.2s infinite; }
    .typing-bubble span:nth-child(2){animation-delay:.2s}
    .typing-bubble span:nth-child(3){animation-delay:.4s}
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)} }

    .empty-chat { text-align:center; padding:5rem 2rem; color:#94a3b8; }
    .empty-chat div { font-size:3.5rem; margin-bottom:1.25rem; }
    .empty-chat h4 { color:#1E3A5F; font-size:1.1rem; margin-bottom:.5rem; }
    .empty-chat p { font-size:.85rem; max-width:260px; margin:0 auto; line-height:1.6; }

    .chat-input { padding:.85rem 1.5rem 1rem; background:#fff; border-top:1px solid #e8edf5; display:flex; align-items:flex-end; gap:.6rem; }
    .chat-input textarea { flex:1; border:1.5px solid #e8edf5; border-radius:16px; padding:.7rem 1.1rem; font-size:.9rem; resize:none; outline:none; font-family:inherit; max-height:120px; background:#f8faff; color:#1a2340; line-height:1.5; transition:.2s; }
    .chat-input textarea:focus { border-color:#4361ee; background:#fff; box-shadow:0 0 0 3px rgba(67,97,238,.08); }
    .chat-input textarea::placeholder { color:#94a3b8; }

    .attach-btn, .emoji-btn { width:38px; height:38px; border-radius:12px; background:#f5f7ff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.1rem; transition:.2s; flex-shrink:0; }
    .attach-btn:hover, .emoji-btn:hover { background:#eef2ff; transform:scale(1.05); }

    .send-btn { width:44px; height:44px; border-radius:14px; background:#4361ee; color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:.2s; box-shadow:0 4px 14px rgba(67,97,238,.3); flex-shrink:0; }
    .send-btn:hover:not(:disabled) { background:#3451d1; transform:translateY(-1px); }
    .send-btn:disabled { opacity:.4; cursor:not-allowed; box-shadow:none; }
    .spinner-send { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin 1s linear infinite; }

    .emoji-picker { position:absolute; bottom:80px; right:100px; background:#fff; border-radius:16px; padding:.75rem; box-shadow:0 8px 30px rgba(0,0,0,.12); border:1px solid #e8edf5; display:flex; flex-wrap:wrap; gap:.3rem; width:220px; animation:slideDown .15s ease; z-index:10; }
    .emoji-picker span { font-size:1.4rem; cursor:pointer; padding:.2rem; border-radius:6px; transition:.15s; }
    .emoji-picker span:hover { background:#f0f4f8; transform:scale(1.2); }

    .empty-state { align-items:center; justify-content:center; flex-direction:column; gap:1.25rem; color:#94a3b8; background:#f0f4f8; }
    .empty-icon { width:80px; height:80px; border-radius:24px; background:#eef2ff; display:flex; align-items:center; justify-content:center; font-size:2.5rem; }
    .empty-state h3 { margin:0; color:#1E3A5F; font-size:1.3rem; font-weight:700; }
    .empty-state p { margin:0; font-size:.88rem; max-width:260px; text-align:center; line-height:1.7; }
    .empty-cta { background:#4361ee; color:#fff; border:none; border-radius:12px; padding:.65rem 1.5rem; font-size:.88rem; font-weight:600; cursor:pointer; transition:.2s; margin-top:.5rem; }
    .empty-cta:hover { background:#3451d1; transform:translateY(-1px); }
    .info-panel { position:absolute; top:70px; right:10px; background:#fff; border-radius:16px; padding:1.5rem; box-shadow:0 8px 30px rgba(0,0,0,.12); border:1px solid #e8edf5; width:220px; z-index:10; text-align:center; animation:slideDown .2s ease; }
    .info-avatar { width:70px; height:70px; border-radius:20px; background:linear-gradient(135deg,#4361ee,#7c3aed); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; overflow:hidden; margin:0 auto .75rem; }
    .info-name { font-weight:700; color:#0f1729; font-size:1rem; margin-bottom:.25rem; }
    .info-role { font-size:.8rem; color:#64748b; margin-bottom:.75rem; }
    .info-close { background:#f5f7ff; border:none; border-radius:8px; padding:.35rem .85rem; font-size:.8rem; cursor:pointer; color:#64748b; }
    .info-close:hover { background:#eef2ff; color:#4361ee; }
    .file-preview { display:flex; align-items:center; gap:.4rem; background:#eef2ff; border-radius:10px; padding:.4rem .75rem; font-size:.78rem; color:#4361ee; max-width:200px; }
    .file-name { font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:120px; }
    .file-size { color:#94a3b8; font-size:.7rem; }
    .file-remove { background:none; border:none; cursor:pointer; color:#94a3b8; font-size:.8rem; padding:0; }
    .file-remove:hover { color:#ef4444; }
    .search-bar { padding:.6rem 1.5rem; background:#fff; border-bottom:1px solid #e8edf5; display:flex; align-items:center; gap:.75rem; }
    .search-bar input { flex:1; border:1.5px solid #e8edf5; border-radius:10px; padding:.5rem 1rem; font-size:.85rem; outline:none; background:#f8faff; }
    .search-bar input:focus { border-color:#4361ee; }
    .search-count { font-size:.75rem; color:#94a3b8; white-space:nowrap; }
    .search-bar button { background:none; border:none; cursor:pointer; color:#94a3b8; font-size:1rem; }
    .search-bar button:hover { color:#ef4444; }
    .msg-group.highlight .msg-body { box-shadow:0 0 0 2px #4361ee; }
    .file-msg { display:flex; align-items:center; gap:.5rem; cursor:pointer; }
    .file-msg-icon { font-size:1.3rem; }
    .file-msg-name { font-weight:600; text-decoration:underline; word-break:break-all; }
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
  users: any[] = [];
  filteredUsers: any[] = [];
  userSearch = '';
  loadingMessages = false;
  loadingConvs = false;
  loadingUsers = false;
  totalUnread = 0;
  currentUser: any;
  sending = false;
  showEmoji = false;
  showInfo = false;
  pendingFile: any = null;
  showSearch = false;
  searchQuery = '';
  searchResults: any[] = [];
  pinnedConvs: number[] = [];
  otherIsTyping = false;
  todayLabel = "Aujourd'hui";

  emojis = ['😊','😂','❤️','👍','🙏','😍','🎉','🔥','😢','😎','🤔','👏','✅','💡','📚','🚀'];

  private pollInterval: any = null;
  private convPollInterval: any = null;
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
    private route: ActivatedRoute,
    private confirmSvc: ConfirmService
  ) {}

  ngOnInit() {
    this.currentUser = this.auth.getCurrentUser();
    this.currentUser.myId = this.currentUser?.auth_id || this.currentUser?.id;
    this.loadConversations();
    this.convPollInterval = setInterval(() => this.loadConversations(), 15000);
    this.route.queryParams.subscribe(params => {
      if (params['with'] && params['name']) {
        this.startOrOpenConv(+params['with'], params['name'], params['avatar'] || null);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.convPollInterval) clearInterval(this.convPollInterval);
  }

  getUserHeader(): string {
    const u = this.currentUser;
    if (!u) return '';
    return btoa(unescape(encodeURIComponent(JSON.stringify({
      id: u.auth_id || u.id, name: u.name, role: u.role, avatar_url: u.avatar_url || null
    }))));
  }

  toggleNewConv() {
    this.showNewConv = !this.showNewConv;
    if (this.showNewConv && this.users.length === 0) {
      this.loadingUsers = true;
      const myId = this.currentUser?.auth_id || this.currentUser?.id;
      const role = this.currentUser?.role;
      const url = role === 'teacher' ? '/api/students' : '/api/teachers';
      const targetRole = role === 'teacher' ? 'student' : 'teacher';
      this.http.get<any[]>(url).subscribe({
        next: (users: any[]) => {
          this.loadingUsers = false;
          this.users = users
            .filter((u: any) => (u.auth_id || u.id) != myId)
            .map((u: any) => ({
              id: u.auth_id || u.id, name: u.name, email: u.email, role: targetRole,
              avatar_url: u.avatar_url || (u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `/storage/${u.avatar}`) : null)
            }));
          this.filteredUsers = [...this.users];
        },
        error: () => { this.loadingUsers = false; }
      });
    }
  }

  filterUsers() {
    const q = this.userSearch.toLowerCase();
    this.filteredUsers = q
      ? this.users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      : [...this.users];
  }

  loadConversations() {
    this.loadingConvs = this.conversations.length === 0;
    this.http.get<any[]>('/api/messaging/conversations', {
      headers: { 'X-User-Data': this.getUserHeader() }
    }).subscribe({
      next: (convs) => {
        this.loadingConvs = false;
        this.conversations = convs;
        this.totalUnread = convs.reduce((acc, c) => acc + (c.unread || 0), 0);
      }
    });
  }

  openConv(conv: any) {
    this.activeConv = conv;
    this.loadingMessages = true;
    this.showEmoji = false;
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
    this.http.get<any[]>(`/api/messaging/conversations/${conv.id}/messages`, {
      headers: { 'X-User-Data': this.getUserHeader() }
    }).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.loadingMessages = false;
        this.shouldScroll = true;
        conv.unread = 0;
        this.totalUnread = this.conversations.reduce((acc, c) => acc + (c.unread || 0), 0);
        const maxId = msgs.length > 0 ? Math.max(...msgs.map((m: any) => m.id)) : 0;
        this.startPolling(conv.id, maxId);
      }
    });
  }

  startPolling(convId: number, lastId: number) {
    let lastMsgId = lastId;
    this.pollInterval = setInterval(() => {
      this.http.get<any[]>(`/api/messaging/conversations/${convId}/messages`, {
        headers: { 'X-User-Data': this.getUserHeader() }
      }).subscribe({
        next: (msgs) => {
          const newMsgs = msgs.filter(m => m.id > lastMsgId);
          if (newMsgs.length > 0) {
            newMsgs.forEach(m => this.messages.push(m));
            lastMsgId = Math.max(...msgs.map(m => m.id));
            this.shouldScroll = true;
            const conv = this.conversations.find(c => c.id === convId);
            if (conv) {
              conv.last_message = newMsgs[newMsgs.length - 1].body;
              conv.last_message_time = newMsgs[newMsgs.length - 1].created_at;
            }
          }
        }
      });
    }, 5000);
  }

  sendMessage() {
    if ((!this.newMessage.trim() && !this.pendingFile) || !this.activeConv || this.sending) return;
    const body = this.pendingFile
      ? (this.newMessage.trim() ? this.newMessage.trim() + '\n📎 ' + this.pendingFile.name + '||' + this.pendingFile.url : '📎 ' + this.pendingFile.name + '||' + this.pendingFile.url)
      : this.newMessage.trim();
    this.newMessage = '';
    this.pendingFile = null;
    this.sending = true;
    this.showEmoji = false;
    this.http.post<any>(`/api/messaging/conversations/${this.activeConv.id}/messages`,
      { body }, { headers: { 'X-User-Data': this.getUserHeader() } }
    ).subscribe({
      next: () => {
        this.sending = false;
        this.activeConv.last_message = body;
        this.activeConv.last_message_time = new Date().toISOString();
      },
      error: () => { this.sending = false; this.newMessage = body; }
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
        conv.other_id = otherId; conv.other_name = otherName;
        conv.other_avatar = otherAvatar; conv.last_message = ''; conv.unread = 0;
        this.conversations.unshift(conv);
        this.openConv(conv);
      }
    });
  }

  onTyping() {}

  toggleInfo() { this.showInfo = !this.showInfo; }

  toggleSearch() { this.showSearch = !this.showSearch; if (!this.showSearch) { this.searchQuery = ''; this.searchResults = []; } }

  searchMessages() {
    if (!this.searchQuery.trim()) { this.searchResults = []; return; }
    const q = this.searchQuery.toLowerCase();
    this.searchResults = this.messages.filter(m => m.body?.toLowerCase().includes(q));
  }

  togglePin() {
    if (!this.activeConv) return;
    const idx = this.pinnedConvs.indexOf(this.activeConv.id);
    if (idx === -1) {
      this.pinnedConvs.push(this.activeConv.id);
      this.activeConv.pinned = true;
    } else {
      this.pinnedConvs.splice(idx, 1);
      this.activeConv.pinned = false;
    }
    this.conversations.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }

  async deleteConv() {
    if (!this.activeConv) return;
    const ok = await this.confirmSvc.open({
      title: 'Supprimer la conversation',
      message: `Voulez-vous supprimer la conversation avec ${this.activeConv.other_name} ? Cette action est irréversible.`,
      icon: '🗑️',
      okLabel: 'Supprimer',
      okColor: '#ef4444'
    });
    if (!ok) return;
    this.http.delete(`/api/messaging/conversations/${this.activeConv.id}`,
      { headers: { 'X-User-Data': this.getUserHeader() } }
    ).subscribe({
      next: () => {
        this.conversations = this.conversations.filter(c => c.id !== this.activeConv.id);
        this.activeConv = null;
        if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
      },
      error: () => {
        this.conversations = this.conversations.filter(c => c.id !== this.activeConv.id);
        this.activeConv = null;
      }
    });
  }

  getFileName(body: string): string {
    const parts = body.replace('📎 ', '').split('||');
    return parts[0];
  }

  downloadFile(body: string) {
    const parts = body.replace("📎 ", "").split("||");
    if (parts[1]) {
      const a = document.createElement("a");
      a.href = parts[1];
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Fichier trop volumineux (max 10MB)"); return; }
    const fname = file.name;
    const fsize = (file.size / 1024).toFixed(1) + " KB";
    this.pendingFile = { name: fname, size: fsize, url: null, uploading: true };
    const formData = new FormData();
    formData.append('file', file);
    this.http.post<any>('/api/messaging/upload', formData, {
      headers: { 'X-User-Data': this.getUserHeader() }
    }).subscribe({
      next: (res) => { this.pendingFile = { name: res.name, size: fsize, url: res.url, uploading: false }; },
      error: () => { this.pendingFile = null; alert("Erreur upload fichier"); }
    });
  }
  toggleEmoji() { this.showEmoji = !this.showEmoji; }
  insertEmoji(emoji: string) { this.newMessage += emoji; }
  onEnter(e: Event) {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }
  scrollToBottom() {
    try { const el = this.messagesWrap.nativeElement; el.scrollTop = el.scrollHeight; } catch {}
  }
  isDifferentDay(date1: string, date2: string): boolean {
    if (!date1 || !date2) return false;
    return new Date(date1).toDateString() !== new Date(date2).toDateString();
  }
  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  }
  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
