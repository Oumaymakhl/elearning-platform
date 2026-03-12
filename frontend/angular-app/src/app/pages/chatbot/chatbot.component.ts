import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../services/chat.service';

interface Message { role: 'user'|'assistant'; content: string; time: Date; }

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule, RouterLink],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      <main class="main">
        <div class="chat-header">
          <h1>🤖 Assistant IA</h1>
          <p>Posez vos questions sur les langages de programmation</p>
          <button class="clear-btn" (click)="clearHistory()">🗑️ Nouvelle conversation</button>
        </div>
        <div class="chat-container">
          <div class="messages" #messagesContainer>
            <div class="welcome" *ngIf="messages.length === 0">
              <div class="welcome-icon">🤖</div>
              <h2>Bonjour ! Je suis votre assistant IA</h2>
              <p>Je peux vous aider avec Python, Java, C++, PHP, JavaScript et plus encore.</p>
              <div class="suggestions">
                <button *ngFor="let s of suggestions" (click)="sendSuggestion(s)">{{ s }}</button>
              </div>
            </div>
            <div class="message" *ngFor="let msg of messages" [class]="msg.role">
              <div class="bubble">
                <div class="content" [innerHTML]="formatMessage(msg.content)"></div>
                <div class="time">{{ msg.time | date:'HH:mm' }}</div>
              </div>
            </div>
            <div class="typing" *ngIf="loading">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div class="input-area">
            <textarea
              [(ngModel)]="input"
              (keydown.enter)="onEnter($event)"
              placeholder="Posez votre question... (Entrée pour envoyer)"
              rows="1"
              [disabled]="loading">
            </textarea>
            <button (click)="send()" [disabled]="loading || !input.trim()">
              {{ loading ? '⏳' : '➤' }}
            </button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout { display:flex; min-height:100vh; }
    .sidebar { width:260px; background:#1E3A5F; color:white; display:flex; flex-direction:column; position:fixed; height:100vh; }
    .logo { padding:1.5rem; font-size:1.3rem; font-weight:700; border-bottom:1px solid rgba(255,255,255,.1); }
    nav { flex:1; padding:1rem 0; }
    .nav-item { display:block; padding:.75rem 1.5rem; color:rgba(255,255,255,.8); text-decoration:none; }
    .nav-item:hover, .nav-item.active { background:rgba(255,255,255,.1); color:white; }
    .main { margin-left:260px; flex:1; display:flex; flex-direction:column; height:100vh; background:#f8f9fa; }
    .chat-header { padding:1.5rem 2rem; background:white; border-bottom:1px solid #eee; display:flex; align-items:center; gap:1rem; }
    .chat-header h1 { margin:0; color:#1E3A5F; }
    .chat-header p { margin:0; color:#666; flex:1; }
    .clear-btn { padding:.5rem 1rem; background:#f0f4f8; border:none; border-radius:6px; cursor:pointer; color:#1E3A5F; }
    .chat-container { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .messages { flex:1; overflow-y:auto; padding:1.5rem 2rem; }
    .welcome { text-align:center; padding:3rem 1rem; }
    .welcome-icon { font-size:4rem; margin-bottom:1rem; }
    .welcome h2 { color:#1E3A5F; }
    .welcome p { color:#666; }
    .suggestions { display:flex; flex-wrap:wrap; gap:.5rem; justify-content:center; margin-top:1.5rem; }
    .suggestions button { padding:.5rem 1rem; background:white; border:1px solid #ddd; border-radius:20px; cursor:pointer; color:#1E3A5F; font-size:.85rem; }
    .suggestions button:hover { background:#1E3A5F; color:white; }
    .message { display:flex; margin-bottom:1rem; }
    .message.user { justify-content:flex-end; }
    .message.assistant { justify-content:flex-start; }
    .bubble { max-width:70%; padding:1rem 1.25rem; border-radius:16px; }
    .message.user .bubble { background:#1E3A5F; color:white; border-bottom-right-radius:4px; }
    .message.assistant .bubble { background:white; color:#333; border-bottom-left-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .time { font-size:.7rem; opacity:.6; margin-top:.25rem; text-align:right; }
    .content { white-space:pre-wrap; line-height:1.6; }
    .typing { display:flex; gap:.3rem; padding:.5rem; }
    .typing span { width:8px; height:8px; background:#ccc; border-radius:50%; animation:bounce .8s infinite; }
    .typing span:nth-child(2) { animation-delay:.15s; }
    .typing span:nth-child(3) { animation-delay:.3s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }
    .input-area { padding:1rem 2rem; background:white; border-top:1px solid #eee; display:flex; gap:1rem; align-items:flex-end; }
    textarea { flex:1; padding:.75rem 1rem; border:1px solid #ddd; border-radius:12px; resize:none; font-size:1rem; font-family:inherit; max-height:120px; }
    textarea:focus { outline:none; border-color:#1E3A5F; }
    .input-area button { padding:.75rem 1.25rem; background:#1E3A5F; color:white; border:none; border-radius:12px; cursor:pointer; font-size:1.2rem; }
    .input-area button:disabled { opacity:.5; cursor:not-allowed; }
  `]
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  messages: Message[] = [];
  input = '';
  loading = false;
  suggestions = [
    'Explique les boucles en Python',
    'Différence entre classe et interface en Java',
    'Comment fonctionne les pointeurs en C++?',
    'Qu\'est-ce que la récursivité?'
  ];

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    try { this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight; } catch {}
  }

  onEnter(e: any) {
    if (!e.shiftKey) { e.preventDefault(); this.send(); }
  }

  sendSuggestion(s: string) { this.input = s; this.send(); }

  send() {
    if (!this.input.trim() || this.loading) return;
    const msg = this.input.trim();
    this.input = '';
    this.messages.push({ role: 'user', content: msg, time: new Date() });
    this.loading = true;

    const history = this.messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

    this.chatService.sendMessage(msg, history).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.reply, time: new Date() });
        this.loading = false;
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: 'Désolé, une erreur est survenue. Veuillez réessayer.', time: new Date() });
        this.loading = false;
      }
    });
  }

  formatMessage(content: string): string {
    return content.replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>').replace(/\n/g, '<br>');
  }

  clearHistory() { this.messages = []; }
}
