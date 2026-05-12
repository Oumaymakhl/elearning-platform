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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
 
    * { box-sizing: border-box; }
 
    .chatbot-layout {
      display: flex;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
    }
 
    .main {
      margin-left: 260px;
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: linear-gradient(135deg, #eef2f7 0%, #e8eef5 100%);
    }
 
    /* ── Top header bar ── */
    .chat-topbar {
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      height: 58px;
      background: white; box-shadow: 0 2px 12px rgba(30,58,95,0.08);
      border-bottom: 1px solid #dde3ec;
      flex-shrink: 0;
    }
 
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
 
    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #e8e4ff;
      color: #4b3fcf;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid #cbc4f0;
    }
 
    .ai-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6C63FF;
      animation: pulse 2s infinite;
    }
 
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
 
    .topbar-subject {
      font-size: 0.95rem;
      font-weight: 500;
      color: #1A1A2E;
    }
 
    .topbar-subject span {
      color: #6C63FF;
    }
 
    /* ── Main content area ── */
    .chat-container {
      display: flex;
      flex: 1;
      overflow: hidden;
      padding: 1rem;
      gap: 1rem;
    }
 
    /* ── Conversation sidebar ── */
    .sidebar-conv {
      width: 240px;
      min-width: 240px;
      background: #f0f4f8;
      border-radius: 14px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid #dde3ec;
      overflow-y: auto;
      transition: all 0.25s ease;
      flex-shrink: 0;
     box-shadow: 2px 0 12px rgba(0,0,0,0.03);
    }
 
    .sidebar-conv.collapsed {
      width: 52px;
      min-width: 52px;
      padding: 0.75rem 0.5rem;
      overflow: hidden;
      align-items: center;
    }
 
    .sidebar-conv.collapsed .conv-item,
    .sidebar-conv.collapsed .new-btn,
    .sidebar-conv.collapsed .conv-label {
      display: none;
    }
 
    .toggle-btn {
      background: none;
      border: 1px solid #ECEAE4;
      cursor: pointer;
      font-size: 1rem;
      color: #6C63FF;
      align-self: flex-end;
      padding: 4px 8px;
      border-radius: 8px;
      transition: all 0.2s;
      flex-shrink: 0;
    }
 
    .toggle-btn:hover {
      background: #e8e4ff;
      border-color: #D8D3F8;
    }
 
    .conv-label {
      font-size: 0.7rem;
      color: #9B97A8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      padding: 4px 4px 2px;
      margin-top: 4px;
    }
 
    .new-btn {
      background: #5A52E0;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 0.55rem 1rem;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      width: 100%;
      font-family: 'Inter', sans-serif;
      transition: background 0.2s, transform 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 4px 10px rgba(108, 99, 255, 0.2);
    }
 
    .new-btn:hover {
      background: #5A52E0;
      transform: translateY(-1px);
    }
 
    .conv-item {
      padding: 0.55rem 0.75rem;
      border-radius: 9px;
      cursor: pointer;
      font-size: 0.85rem;
      color: #444;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.15s;
      gap: 6px;
      box-shadow: 0 4px 10px rgba(108, 99, 255, 0.2);
    }
 
    .conv-item:hover { background: #F7F6F3; }
    .conv-item.active {
      background: #e8e4ff;
      color: #4b3fcf;
      font-weight: 500;
    }
 
    .conv-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
 
    .del-btn {
      background: none;
      border: none;
      color: #C9C6D3;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 2px 4px;
      border-radius: 4px;
      flex-shrink: 0;
      transition: color 0.15s;
      line-height: 1;
    }
 
    .del-btn:hover { color: #E05252; }
 
    .empty-conv {
      color: #C9C6D3;
      font-size: 0.82rem;
      text-align: center;
      margin-top: 1rem;
      padding: 0 0.5rem;
    }
 
    /* ── Chat panel ── */
    .chat-panel {
      box-shadow: 0 8px 30px rgba(108, 99, 255, 0.08);
      box-shadow: 0 8px 30px rgba(108, 99, 255, 0.08);
      flex: 1;
      background: #e8edf3;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      border: 1px solid #ECEAE4;
      overflow: hidden;
     box-shadow: 0 8px 30px rgba(108, 99, 255, 0.08);
    }
 
    /* ── Messages ── */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      scroll-behavior: smooth;
    }
 
    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-track { background: transparent; }
    .messages::-webkit-scrollbar-thumb { background: #E0DDF5; border-radius: 4px; }
 
    .welcome {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      flex: 1;
      padding: 3rem 2rem;
      gap: 12px;
    }
 
    .welcome-illustration {
      width: auto;
      height: auto;
      background: #e8e4ff;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      
    }
 
    .welcome h2 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #1A1A2E;
      margin: 0;
    }
 
    .welcome p {
      font-size: 0.9rem;
      color: #9B97A8;
      margin: 0;
      max-width: 280px;
      line-height: 1.6;
    }
 
    /* ── Message bubbles ── */
    .msg-row {
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }
 
    .msg-row.user { flex-direction: row-reverse; }
 
    .msg-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
 
    .msg-avatar.ai {
      background: #e8e4ff;
      color: #6C63FF;
      border: 1px solid #cbc4f0;
    }
 
    .msg-avatar.user-av {
      background: #6C63FF;
      color: #fff;
    }
 
    .msg-bubble {
      max-width: 72%;
      border-radius: 16px;
      font-size: 0.9rem;
      line-height: 1.65;
    }
 
    .msg-bubble.user {
      background: linear-gradient(135deg, #6C63FF, #5A52E0);
      color: #fff;
      border-bottom-right-radius: 4px;
      padding: 0.75rem 1.1rem;
    
      box-shadow: 0 4px 12px rgba(108, 99, 255, 0.25);
    
      box-shadow: 0 4px 12px rgba(108, 99, 255, 0.25);
     box-shadow: 0 4px 12px rgba(108, 99, 255, 0.25);
    }
 
    .msg-bubble.assistant {
      background: #f0edff;
      color: #1A1A2E;
      border-bottom-left-radius: 4px;
      padding: 0.75rem 1.1rem;
      border:  1px solid #ddd8f0;
    
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
     box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
 
    .msg-time {
      font-size: 0.68rem;
      opacity: 0.55;
      margin-top: 5px;
      font-family: 'JetBrains Mono', monospace;
    }
 
    .msg-bubble.user .msg-time { text-align: right; }
 
    /* code blocks inside messages */
    .msg-bubble pre, .msg-bubble code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
    }
 
    .msg-bubble.assistant pre {
      background: #ECEAE4;
      border-radius: 8px;
      padding: 0.75rem;
      overflow-x: auto;
      margin: 0.5rem 0 0;
    }
 
    /* ── Typing indicator ── */
    .typing-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }
 
    .typing-bubble {
      background: #F7F6F3;
      border: 1px solid #ECEAE4;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }
 
    .typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6C63FF;
      animation: bounce 1.2s infinite;
    }
 
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
 
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-5px); opacity: 1; }
    }
 
    /* ── Input area ── */
    .input-area {
      padding: 1rem 1.25rem;
      border-top: 1px solid #ECEAE4;
      background: #FAFAF8;
    }
 
    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #e8edf3;
      border:  1.5px solid #d8d3f8;
      border-radius: 12px;
      padding: 6px 6px 6px 14px;
      transition: border-color 0.2s;
    }
 
    .input-wrapper:focus-within {
      border-color: #6C63FF;
      box-shadow:  0 0 0 3px rgba(108, 99, 255, 0.15);
    }
 
    .input-wrapper input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 0.92rem;
      font-family: 'Inter', sans-serif;
      color: #1A1A2E;
      background: transparent;
      padding: 4px 0;
    }
 
    .input-wrapper input::placeholder { color: #C0BBD0; }
 
    .send-btn {
      background: #6C63FF;
      color: #fff;
      border: none;
      border-radius: 9px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s, transform 0.15s;
    }
 
    .send-btn:hover:not(:disabled) {
      background: #5A52E0;
      transform: scale(1.05);
    }
 
    .send-btn:disabled {
      background: #D8D3F8;
      cursor: not-allowed;
      transform: none;
    }
 
    .input-hint {
      font-size: 0.72rem;
      color: #C0BBD0;
      margin-top: 6px;
      padding-left: 2px;
    }

    .bot-salut {
      display: flex;
      align-items: center;
      margin-right: 8px;
      animation: wave 2s ease-in-out infinite;
    }
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-10deg); }
      75% { transform: rotate(10deg); }
    }
  
    .bot-salut {
      display: flex;
      align-items: center;
      margin-right: 8px;
      animation: wave 2s ease-in-out infinite;
    }
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-12deg); }
      75% { transform: rotate(12deg); }
    }
    /* ── DARK MODE ── */
    :host-context(body.dark) .chatbot-layout { background: #0f172a; }
    :host-context(body.dark) .chat-topbar { background: #1e293b; box-shadow: 0 2px 12px rgba(0,0,0,.3); color: #e2e8f0; border-bottom: 1px solid #1e2d42; }
    :host-context(body.dark) .sidebar-conv { background: #1a2540; border-right: 1px solid #1e2d42; }
    :host-context(body.dark) .conv-label { color: #64748b; }
    :host-context(body.dark) .conv-item { background: transparent; border-bottom-color: #1e2d42; }
    :host-context(body.dark) .conv-item:hover { background: #1e2d42; }
    :host-context(body.dark) .conv-item.active { background: #263650; }
    :host-context(body.dark) .conv-name { color: #cbd5e1; }
    :host-context(body.dark) .new-chat-btn { background: #4361ee; }
    :host-context(body.dark) .new-chat-btn:hover { background: #3451d1; }
    :host-context(body.dark) .chat-panel { background: #111827; }
    :host-context(body.dark) .messages { background: #111827; }
    :host-context(body.dark) .messages::-webkit-scrollbar-thumb { background: #2d3f55; }
    :host-context(body.dark) .msg-bubble.assistant { background: #1e293b; color: #e2e8f0; border: 1px solid #2d3f55; box-shadow: 0 2px 10px rgba(0,0,0,.3); }
    :host-context(body.dark) .msg-bubble.assistant pre { background: #0f172a; color: #e2e8f0; border: 1px solid #2d3f55; }
    :host-context(body.dark) .msg-bubble code { background: #0f172a; color: #93c5fd; }
    :host-context(body.dark) .msg-time { color: #4a5568; }
    :host-context(body.dark) .msg-avatar.ai { background: #263650; }
    :host-context(body.dark) .chat-input-area { background: #1e293b; border-top: 1px solid #1e2d42; }
    :host-context(body.dark) .input-wrapper { background: #111827; border-color: #2d3f55; box-shadow: none; }
    :host-context(body.dark) .input-wrapper:focus-within { border-color: #4361ee; box-shadow: 0 0 0 3px rgba(67,97,238,.15); }
    :host-context(body.dark) .input-wrapper input { background: #111827; color: #e2e8f0; }
    :host-context(body.dark) .input-wrapper input::placeholder { color: #4a5568; }
    :host-context(body.dark) .input-hint { color: #4a5568; }
    :host-context(body.dark) .input-box { background: #111827; border-color: #2d3f55; color: #e2e8f0; }
    :host-context(body.dark) .input-box:focus { border-color: #4361ee; }
    :host-context(body.dark) .input-box::placeholder { color: #4a5568; }
    :host-context(body.dark) .send-btn { background: #4361ee; }
    :host-context(body.dark) .send-btn:hover { background: #3451d1; }
    :host-context(body.dark) .hint { color: #4a5568; background: #111827; }
    :host-context(body.dark) .typing-indicator { background: #1e293b; border-color: #2d3f55; }

  `],
  template: `
    <div class="chatbot-layout">
      <app-sidebar></app-sidebar>
      <div class="main">
 
        <!-- Top bar -->
        <div class="chat-topbar">
          <div class="topbar-left">
            <div class="bot-salut">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- tête -->
                <rect x="7" y="8" width="22" height="18" rx="9" fill="#6C63FF" stroke="#5A52E0" stroke-width="1.5"/>
                <!-- yeux -->
                <circle cx="14" cy="17" r="2.5" fill="white"/>
                <circle cx="22" cy="17" r="2.5" fill="white"/>
                <circle cx="14" cy="17" r="1.2" fill="#1A1A2E"/>
                <circle cx="22" cy="17" r="1.2" fill="#1A1A2E"/>
                <!-- sourire -->
                <path d="M13 22 Q18 27 23 22" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <!-- bras levé (salut) -->
                <path d="M7 15 L2 10" stroke="#6C63FF" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="1.5" cy="9" r="2" fill="#FFD166" stroke="#E6B800" stroke-width="1"/>
                <!-- antenne -->
                <line x1="18" y1="8" x2="18" y2="3" stroke="#5A52E0" stroke-width="2" stroke-linecap="round"/>
                <circle cx="18" cy="2.5" r="2" fill="#FFD166"/>
              </svg>
            </div>
            <div class="ai-badge">
              <span class="ai-dot"></span>
              Assistant IA
            </div>
            <span class="topbar-subject" *ngIf="currentConv">
              — <span>{{ currentConv.title }}</span>
            </span>
          </div>
        </div>
 
        <div class="chat-container">
 
          <!-- Conversations sidebar -->
          <div class="sidebar-conv" [class.collapsed]="sidebarCollapsed">
            <button class="toggle-btn" (click)="sidebarCollapsed=!sidebarCollapsed"
              [title]="sidebarCollapsed ? 'Ouvrir' : 'Réduire'">
              {{ sidebarCollapsed ? '›' : '‹' }}
            </button>
 
            <ng-container *ngIf="!sidebarCollapsed">
              <button class="new-btn" (click)="newConversation()">＋ Nouvelle</button>
 
              <div class="conv-label">Conversations</div>
 
              <div *ngFor="let c of conversations"
                   class="conv-item" [class.active]="currentConvId === c.id"
                   (click)="switchConversation(c.id)">
                <span class="conv-name">{{ c.title }}</span>
                <button class="del-btn" (click)="deleteConversation(c.id, $event)">✕</button>
              </div>
 
              <div *ngIf="conversations.length === 0" class="empty-conv">
                Aucune conversation
              </div>
            </ng-container>
          </div>
 
          <!-- Chat panel -->
          <div class="chat-panel">
            <div class="messages" #messagesContainer>
 
              <!-- Welcome state -->
              <div class="welcome" *ngIf="messages.length === 0">
                <div class="welcome-illustration">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="60" cy="60" r="55" fill="#F0EDFF" stroke="#D8D3F8" stroke-width="2"/>
              <path d="M45 45V75" stroke="#6C63FF" stroke-width="4" stroke-linecap="round"/>
              <path d="M75 45V75" stroke="#6C63FF" stroke-width="4" stroke-linecap="round"/>
              <path d="M45 50L60 42L75 50V70L60 62L45 70V50Z" fill="#6C63FF" fill-opacity="0.2" stroke="#6C63FF" stroke-width="3" stroke-linejoin="round"/>
              <path d="M90 40L92.5 47.5L100 50L92.5 52.5L90 60L87.5 52.5L80 50L87.5 47.5L90 40Z" fill="#FFD166"/>
              <circle cx="35" cy="75" r="10" fill="#FFD166" stroke="#E6B800" stroke-width="2"/>
              <path d="M35 85V90" stroke="#E6B800" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
                <h2>Bonjour !</h2>
                <p>Je suis votre assistant pédagogique. Posez-moi une question pour commencer.</p>
              </div>
 
              <!-- Messages -->
              <div *ngFor="let msg of messages" class="msg-row" [class.user]="msg.role === 'user'">
                <div class="msg-avatar" [class.ai]="msg.role === 'assistant'" [class.user-av]="msg.role === 'user'">
                  {{ msg.role === 'assistant' ? 'IA' : 'Moi' }}
                </div>
                <div class="msg-bubble" [class]="msg.role">
                  <div>{{ msg.content }}</div>
                  <div class="msg-time">{{ msg.time | date:'HH:mm' }}</div>
                </div>
              </div>
 
              <!-- Typing indicator -->
              <div class="typing-row" *ngIf="loading">
                <div class="msg-avatar ai">IA</div>
                <div class="typing-bubble">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
 
            </div>
 
            <!-- Input area -->
            <div class="input-area">
              <div class="input-wrapper">
                <input
                  type="text"
                  [(ngModel)]="userMessage"
                  placeholder="Posez votre question..."
                  (keyup.enter)="sendMessage()"
                />
                <button class="send-btn" (click)="sendMessage()" [disabled]="loading || !userMessage.trim()">
                  ➤
                </button>
              </div>
              <div class="input-hint">Appuyez sur Entrée pour envoyer</div>
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
 
  sendMessage() {
    const msg = this.userMessage.trim();
    if (!msg || this.loading) return;
 
    if (!this.currentConv) { this.newConversation(); }
 
    const userMsg: Message = { role: 'user', content: msg, time: new Date() };
    this.messages = [...this.messages, userMsg];
    if (this.currentConv) {
      this.currentConv.messages = this.messages;
      if (this.currentConv.messages.length === 1) {
        this.currentConv.title = msg.substring(0, 30) + (msg.length > 30 ? '...' : '');
      }
    }
    this.userMessage = '';
    this.loading = true;
 
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
