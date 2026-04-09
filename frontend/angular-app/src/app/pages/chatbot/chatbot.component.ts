import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

interface Message { role: 'user' | 'assistant'; content: string; time: Date; }
interface Conversation { id: number; title: string; messages: Message[]; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  styles: [`
    .chatbot-layout { display:flex; min-height:100vh; }
    .main { margin-left:260px; flex:1; display:flex; flex-direction:column; height:100vh; background:#f0f4ff; }
    .chat-container { display:flex; flex:1; overflow:hidden; margin:1rem; gap:1rem; position:relative; z-index:1; pointer-events:all; }
    .sidebar-conv { width:260px; min-width:260px; background:#fff; border-radius:16px; padding:1rem;
      display:flex; flex-direction:column; gap:0.5rem; box-shadow:0 2px 12px rgba(0,0,0,0.08); overflow-y:auto;
      transition:all 0.3s ease; }
    .sidebar-conv.collapsed { width:48px; min-width:48px; padding:0.5rem; overflow:hidden; }
    .sidebar-conv.collapsed .conv-item, .sidebar-conv.collapsed .new-btn,
    .sidebar-conv.collapsed h3 { display:none; }
    .toggle-btn { background:none; border:none; cursor:pointer; font-size:1.2rem; color:#6c63ff;
      align-self:flex-end; padding:4px 6px; border-radius:6px; transition:0.2s; }
    .toggle-btn:hover { background:#f0f4ff; }
    .sidebar-conv h3 { font-size:0.85rem; color:#888; text-transform:uppercase; letter-spacing:1px; margin:0 0 0.5rem; }
    .new-btn { background:#6c63ff; color:#fff; border:none; border-radius:10px;
      padding:0.6rem 1rem; cursor:pointer; font-size:0.9rem; width:100%; }
    .conv-item { padding:0.6rem 0.8rem; border-radius:10px; cursor:pointer; font-size:0.85rem;
      color:#333; display:flex; justify-content:space-between; align-items:center;
      transition:background 0.2s; }
    .conv-item:hover { background:#f0f4ff; }
    .conv-item.active { background:#e8e5ff; color:#6c63ff; font-weight:600; }
    .del-btn { background:none; border:none; color:#bbb; cursor:pointer; font-size:0.9rem; padding:0 4px; }
    .del-btn:hover { color:#e74c3c; }
    .chat-panel { flex:1; background:#fff; border-radius:16px; display:flex;
      flex-direction:column; box-shadow:0 2px 12px rgba(0,0,0,0.08); overflow:hidden; }
    .chat-header { padding:1rem 1.5rem; border-bottom:1px solid #f0f4ff;
      font-weight:600; color:#333; font-size:1rem; }
    .messages { flex:1; overflow-y:auto; padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .welcome { text-align:center; color:#aaa; margin-top:3rem; }
    .welcome h2 { color:#6c63ff; }
    .message { max-width:75%; padding:0.8rem 1.2rem; border-radius:16px; font-size:0.95rem; line-height:1.5; }
    .message.user { align-self:flex-end; background:#6c63ff; color:#fff; border-bottom-right-radius:4px; }
    .message.assistant { align-self:flex-start; background:#f0f4ff; color:#333; border-bottom-left-radius:4px; }
    .msg-time { font-size:0.7rem; opacity:0.6; margin-top:4px; }
    .input-area { padding:1rem 1.5rem; border-top:1px solid #f0f4ff; display:flex; gap:0.8rem; }
    .input-area textarea { flex:1; border:1px solid #e0e6f0; border-radius:12px; padding:0.8rem 1rem;
      font-size:0.95rem; resize:none; outline:none; font-family:inherit; }
    .input-area textarea:focus { border-color:#6c63ff; }
    .send-btn { background:#6c63ff; color:#fff; border:none; border-radius:12px;
      padding:0.8rem 1.5rem; cursor:pointer; font-size:1rem; }
    .send-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .typing { align-self:flex-start; background:#f0f4ff; border-radius:16px;
      padding:0.8rem 1.2rem; color:#999; font-style:italic; }
  `],
  template: `
    <div class="chatbot-layout">
      <app-sidebar></app-sidebar>
      <div class="main">
        <div class="chat-container">
          <!-- Panneau conversations -->
          <div class="sidebar-conv" [class.collapsed]="sidebarCollapsed">
            <button class="toggle-btn" (click)="sidebarCollapsed=!sidebarCollapsed"
              [title]="sidebarCollapsed ? 'Ouvrir' : 'Réduire'">
              {{ sidebarCollapsed ? '›' : '‹' }}
            </button>
            <h3>Conversations</h3>
            <button class="new-btn" (click)="newConversation()">＋ Nouvelle</button>
            <div *ngFor="let c of conversations"
                 class="conv-item" [class.active]="currentConvId === c.id"
                 (click)="switchConversation(c.id)">
              <span>{{ c.title }}</span>
              <button class="del-btn" (click)="deleteConversation(c.id, $event)">✕</button>
            </div>
            <div *ngIf="conversations.length === 0" style="color:#bbb;font-size:0.85rem;text-align:center;margin-top:1rem;">
              Aucune conversation
            </div>
          </div>

          <!-- Panneau chat -->
          <div class="chat-panel">
            <div class="chat-header">
              🤖 Assistant IA pédagogique
              <span *ngIf="currentConv" style="color:#6c63ff;margin-left:0.5rem;">— {{ currentConv.title }}</span>
            </div>
            <div class="messages" #messagesContainer>
              <div class="welcome" *ngIf="messages.length === 0">
                <h2>👋 Bonjour !</h2>
                <p>Je suis votre assistant pédagogique. Posez-moi vos questions.</p>
              </div>
              <div class="message" *ngFor="let msg of messages" [class]="msg.role">
                <div>{{ msg.content }}</div>
                <div class="msg-time">{{ msg.time | date:'HH:mm' }}</div>
              </div>
              <div class="typing" *ngIf="loading">Assistant est en train d'écrire...</div>
            </div>
            <div class="input-area">
              <input type="text" [(ngModel)]="userMessage" placeholder="Posez votre question..." (keyup.enter)="sendMessage()" style="flex:1;border:1px solid #e0e6f0;border-radius:12px;padding:0.8rem 1rem;font-size:0.95rem;outline:none;z-index:999;position:relative;">
              <button class="send-btn" (click)="sendMessage()" [disabled]="loading || !userMessage.trim()">➤</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  conversations: Conversation[] = [];
  currentConvId: number | null = null;
  messages: Message[] = [];
  userMessage = '';
  sidebarCollapsed = false;
  loading = false;
  private nextId = 1;

  get currentConv(): Conversation | undefined {
    return this.conversations.find(c => c.id === this.currentConvId);
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadFromStorage();
    if (this.conversations.length === 0) { this.newConversation(); }
    else { this.switchConversation(this.conversations[0].id); }
  }

  private saveToStorage() {
    const data = {
      conversations: this.conversations.map(c => ({
        ...c,
        messages: c.messages.map(m => ({ ...m, time: m.time.toISOString() }))
      })),
      currentConvId: this.currentConvId,
      nextId: this.nextId
    };
    localStorage.setItem('chatbot_data', JSON.stringify(data));
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem('chatbot_data');
      if (!raw) return;
      const data = JSON.parse(raw);
      this.conversations = data.conversations.map((c: any) => ({
        ...c,
        messages: c.messages.map((m: any) => ({ ...m, time: new Date(m.time) }))
      }));
      this.nextId = data.nextId || 1;
      this.currentConvId = data.currentConvId;
    } catch { this.conversations = []; }
  }

  ngAfterViewChecked() {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  newConversation() {
    const conv: Conversation = {
      id: this.nextId++,
      title: `Conversation ${this.conversations.length + 1}`,
      messages: []
    };
    this.conversations.unshift(conv);
    this.switchConversation(conv.id);
    this.saveToStorage();
  }

  switchConversation(id: number) {
    this.currentConvId = id;
    this.messages = this.currentConv?.messages ?? [];
  }

  deleteConversation(id: number, e: Event) {
    e.stopPropagation();
    this.conversations = this.conversations.filter(c => c.id !== id);
    this.saveToStorage();
    if (this.currentConvId === id) {
      if (this.conversations.length > 0) {
        this.switchConversation(this.conversations[0].id);
      } else {
        this.newConversation();
      }
    }
  }

  onEnter(e: any) {
    if (!e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  sendMessage() {
    const msg = this.userMessage.trim();
    if (!msg || this.loading) return;

    // Créer une conversation si aucune
    if (!this.currentConv) { this.newConversation(); }

    const userMsg: Message = { role: 'user', content: msg, time: new Date() };
    this.messages = [...this.messages, userMsg];
    if (this.currentConv) {
      this.currentConv.messages = this.messages;
      // Titre = premier message tronqué
      if (this.currentConv.messages.length === 1) {
        this.currentConv.title = msg.substring(0, 30) + (msg.length > 30 ? '...' : '');
      }
    }
    this.userMessage = '';
    this.loading = true;

    // Historique pour le backend (sans le dernier message user déjà dans "message")
    const history = this.messages.slice(0, -1).map(m => ({
      role: m.role, content: m.content
    }));

    this.http.post<any>('/api/chat', { message: msg, history }, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          const assistantMsg: Message = {
            role: 'assistant',
            content: res.reply || 'Pas de réponse.',
            time: new Date()
          };
          this.messages = [...this.messages, assistantMsg];
          if (this.currentConv) this.currentConv.messages = [...this.messages];
          this.loading = false;
          this.saveToStorage();
          this.cdr.detectChanges();
        },
        error: () => {
          this.messages.push({
            role: 'assistant',
            content: '❌ Erreur de connexion au service IA.',
            time: new Date()
          });
          this.loading = false;
        }
      });
  }
}
