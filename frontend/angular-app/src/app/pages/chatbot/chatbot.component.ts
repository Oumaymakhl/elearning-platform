import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ChatService } from '../../services/chat.service';

interface Message { role: string; content: string; time: Date; }
interface Conversation { id: number; title: string; updated_at: string; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  styles: [`
    :host { display:block; height:100vh; overflow:hidden; }
    .content { display:flex; height:100vh; margin-left:260px; overflow:hidden; background:#f4f6fb; }

    /* Panneau conversations */
    .conv-panel { flex-shrink:0; background:#fff; border-right:1px solid #e8ecf3; display:flex; flex-direction:column; overflow:hidden; transition:width .25s ease; width:52px; }
    .conv-panel.open { width:280px; }
    .panel-top { padding:.75rem .6rem; border-bottom:1px solid #e8ecf3; display:flex; flex-direction:column; gap:.5rem; }
    .toggle-btn { background:none; border:1px solid #e8ecf3; color:#5a6a85; font-size:1rem; cursor:pointer; padding:.45rem; border-radius:8px; width:100%; transition:.2s; }
    .toggle-btn:hover { background:#f0f4ff; color:#4361ee; border-color:#4361ee; }
    .new-btn { background:#4361ee; color:#fff; border:none; border-radius:8px; padding:.5rem .7rem; cursor:pointer; font-size:.82rem; font-weight:600; width:100%; white-space:nowrap; overflow:hidden; }
    .new-btn:hover { background:#3451d1; }
    .conv-list { flex:1; overflow-y:auto; padding:.5rem; display:flex; flex-direction:column; gap:.25rem; }
    .conv-item { display:flex; align-items:center; justify-content:space-between; padding:.55rem .7rem; border-radius:8px; cursor:pointer; color:#5a6a85; font-size:.82rem; transition:.15s; white-space:nowrap; overflow:hidden; }
    .conv-item:hover { background:#f0f4ff; color:#4361ee; }
    .conv-item.active { background:#eef1fd; color:#4361ee; font-weight:600; border-left:3px solid #4361ee; }
    .conv-title { flex:1; overflow:hidden; text-overflow:ellipsis; }
    .del-btn { background:none; border:none; cursor:pointer; color:#c5cde0; font-size:.75rem; padding:0 2px; flex-shrink:0; }
    .del-btn:hover { color:#e74c3c; }
    .no-conv { color:#b0bcd4; font-size:.8rem; text-align:center; padding:1.5rem .5rem; }
    .conv-list::-webkit-scrollbar { width:4px; }
    .conv-list::-webkit-scrollbar-thumb { background:#e0e6f0; border-radius:4px; }

    /* Zone chat */
    .chat-area { flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }
    .chat-header { padding:1rem 1.5rem; background:#fff; border-bottom:1px solid #e8ecf3; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    .header-left { display:flex; align-items:center; gap:.75rem; }
    .ai-avatar { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,#4361ee,#7b5ea7); display:flex; align-items:center; justify-content:center; font-size:1.1rem; }
    .header-title { font-weight:700; color:#1a2340; font-size:.95rem; }
    .header-sub { font-size:.75rem; color:#8a9bbf; margin-top:1px; }
    .conv-badge { background:#eef1fd; color:#4361ee; font-size:.75rem; padding:.25rem .6rem; border-radius:20px; font-weight:600; }

    /* Messages */
    .messages { flex:1; overflow-y:auto; padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .messages::-webkit-scrollbar { width:5px; }
    .messages::-webkit-scrollbar-thumb { background:#e0e6f0; border-radius:4px; }
    .welcome { text-align:center; margin:auto; padding:2rem; }
    .welcome-icon { font-size:3rem; margin-bottom:1rem; }
    .welcome h3 { color:#1a2340; font-size:1.2rem; margin-bottom:.5rem; }
    .welcome p { color:#8a9bbf; font-size:.9rem; }
    .welcome-chips { display:flex; flex-wrap:wrap; gap:.5rem; justify-content:center; margin-top:1rem; }
    .chip { background:#eef1fd; color:#4361ee; padding:.3rem .8rem; border-radius:20px; font-size:.8rem; cursor:pointer; border:1px solid #d5dcf9; }
    .chip:hover { background:#4361ee; color:#fff; }

    .message { display:flex; gap:.75rem; max-width:80%; }
    .message.user { align-self:flex-end; flex-direction:row-reverse; }
    .message.assistant { align-self:flex-start; }
    .msg-avatar { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:.85rem; flex-shrink:0; }
    .message.user .msg-avatar { background:linear-gradient(135deg,#4361ee,#7b5ea7); color:#fff; }
    .message.assistant .msg-avatar { background:#f0f4ff; font-size:1rem; }
    .msg-body { display:flex; flex-direction:column; gap:.25rem; }
    .message.user .msg-body { align-items:flex-end; }
    .bubble { padding:.75rem 1rem; border-radius:12px; font-size:.88rem; line-height:1.6; white-space:pre-wrap; word-break:break-word; }
    .message.user .bubble { background:linear-gradient(135deg,#4361ee,#5a77f5); color:#fff; border-bottom-right-radius:3px; box-shadow:0 2px 8px rgba(67,97,238,.3); }
    .message.assistant .bubble { background:#fff; color:#2d3a52; border-bottom-left-radius:3px; box-shadow:0 1px 4px rgba(0,0,0,.06); border:1px solid #e8ecf3; }
    .time { font-size:.68rem; color:#b0bcd4; }

    .typing { display:flex; gap:5px; align-items:center; padding:.75rem 1rem; background:#fff; border-radius:12px; border:1px solid #e8ecf3; width:fit-content; box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .typing span { width:7px; height:7px; background:#4361ee; border-radius:50%; animation:bounce .9s infinite; opacity:.6; }
    .typing span:nth-child(2){animation-delay:.2s} .typing span:nth-child(3){animation-delay:.4s}
    @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}

    /* Input */
    .input-area { padding:1rem 1.5rem; background:#fff; border-top:1px solid #e8ecf3; display:flex; gap:.75rem; align-items:flex-end; flex-shrink:0; }
    .input-wrap { flex:1; background:#f4f6fb; border:1.5px solid #e8ecf3; border-radius:12px; display:flex; align-items:center; padding:.5rem .75rem; transition:.2s; }
    .input-wrap:focus-within { border-color:#4361ee; background:#fff; box-shadow:0 0 0 3px rgba(67,97,238,.1); }
    textarea { flex:1; background:none; border:none; outline:none; resize:none; font-family:inherit; font-size:.9rem; color:#2d3a52; line-height:1.5; }
    textarea::placeholder { color:#b0bcd4; }
    .send-btn { width:42px; height:42px; background:linear-gradient(135deg,#4361ee,#5a77f5); color:#fff; border:none; border-radius:10px; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; transition:.2s; flex-shrink:0; box-shadow:0 2px 8px rgba(67,97,238,.3); }
    .send-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(67,97,238,.4); }
    .send-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }
  `],
  template: `
    <app-sidebar></app-sidebar>
    <div class="content">

      <!-- Panneau conversations -->
      <div class="conv-panel" [class.open]="panelOpen">
        <div class="panel-top">
          <button class="toggle-btn" (click)="panelOpen = !panelOpen">{{ panelOpen ? "◀" : "☰" }}</button>
          <button class="new-btn" *ngIf="panelOpen" (click)="newConversation()">＋ Nouvelle conversation</button>
        </div>
        <div class="conv-list" *ngIf="panelOpen">
          <div class="conv-item" *ngFor="let c of conversations"
            [class.active]="currentConvId === c.id"
            (click)="loadConversation(c.id)">
            <span class="conv-title">💬 {{ c.title }}</span>
            <button class="del-btn" (click)="deleteConversation(c.id, $event)">✕</button>
          </div>
          <div class="no-conv" *ngIf="conversations.length === 0">Aucune conversation</div>
        </div>
      </div>

      <!-- Zone chat -->
      <div class="chat-area">
        <div class="chat-header">
          <div class="header-left">
            <div class="ai-avatar">🤖</div>
            <div>
              <div class="header-title">Assistant IA</div>
              <div class="header-sub">Powered by Llama 3.1</div>
            </div>
          </div>
          <span class="conv-badge" *ngIf="currentConvId"># {{ currentConvId }}</span>
        </div>

        <div class="messages" #messagesContainer>
          <div class="welcome" *ngIf="messages.length === 0">
            <div class="welcome-icon">🤖</div>
            <h3>Comment puis-je vous aider ?</h3>
            <p>Posez vos questions sur les langages de programmation</p>
            <div class="welcome-chips">
              <span class="chip" (click)="quickAsk('Explique moi Python')">Python</span>
              <span class="chip" (click)="quickAsk('C est quoi Java ?')">Java</span>
              <span class="chip" (click)="quickAsk('Intro au JavaScript')">JavaScript</span>
              <span class="chip" (click)="quickAsk('C est quoi PHP ?')">PHP</span>
              <span class="chip" (click)="quickAsk('Bases du C++')">C++</span>
            </div>
          </div>

          <div class="message" *ngFor="let msg of messages" [class]="msg.role">
            <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
            <div class="msg-body">
              <div class="bubble">{{ msg.content }}</div>
              <span class="time">{{ msg.time | date:"HH:mm" }}</span>
            </div>
          </div>
          <div class="typing" *ngIf="loading">
            <span></span><span></span><span></span>
          </div>
        </div>

        <div class="input-area">
          <div class="input-wrap">
            <textarea [(ngModel)]="userMessage" placeholder="Posez votre question..."
              (keydown.enter)="onEnter($event)" rows="1"></textarea>
          </div>
          <button class="send-btn" (click)="sendMessage()" [disabled]="loading || !userMessage.trim()">➤</button>
        </div>
      </div>
    </div>
  `
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild("messagesContainer") messagesContainer!: ElementRef;
  messages: Message[] = [];
  conversations: Conversation[] = [];
  currentConvId: number | null = null;
  userMessage = "";
  loading = false;
  panelOpen = true;

  constructor(private chatService: ChatService, private http: HttpClient) {}

  ngOnInit() { this.loadConversations(); }

  ngAfterViewChecked() {
    try { this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight; } catch {}
  }

  getHeaders() {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadConversations() {
    this.http.get<Conversation[]>("http://localhost:8007/api/conversations", { headers: this.getHeaders() })
      .subscribe({ next: (c) => this.conversations = c, error: () => {} });
  }

  loadConversation(id: number) {
    this.currentConvId = id;
    this.http.get<any>(`http://localhost:8007/api/conversations/${id}`, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.messages = data.messages.map((m: any) => ({
            role: m.role, content: m.content, time: new Date(m.created_at)
          }));
        }
      });
  }

  newConversation() { this.currentConvId = null; this.messages = []; }

  deleteConversation(id: number, e: Event) {
    e.stopPropagation();
    this.http.delete(`http://localhost:8007/api/conversations/${id}`, { headers: this.getHeaders() })
      .subscribe({ next: () => {
        this.conversations = this.conversations.filter(c => c.id !== id);
        if (this.currentConvId === id) { this.currentConvId = null; this.messages = []; }
      }});
  }

  quickAsk(msg: string) { this.userMessage = msg; this.sendMessage(); }
  onEnter(e: any) { if (!e.shiftKey) { e.preventDefault(); this.sendMessage(); } }

  sendMessage() {
    const msg = this.userMessage.trim();
    if (!msg || this.loading) return;
    this.userMessage = "";
    this.loading = true;
    this.messages.push({ role: "user", content: msg, time: new Date() });
    this.chatService.sendMessage(msg, this.currentConvId).subscribe({
      next: (res: any) => {
        this.messages.push({ role: "assistant", content: res.reply, time: new Date() });
        if (res.conversation_id) { this.currentConvId = res.conversation_id; this.loadConversations(); }
        this.loading = false;
      },
      error: () => {
        this.messages.push({ role: "assistant", content: "Désolé, une erreur est survenue.", time: new Date() });
        this.loading = false;
      }
    });
  }
}
