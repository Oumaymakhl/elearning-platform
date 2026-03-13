import {
  Component, Input, OnChanges, AfterViewInit,
  ViewChild, ElementRef, SimpleChanges, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

declare const Prism: any;

@Component({
  selector: 'app-code-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cb-wrapper">
      <div class="cb-header">
        <span class="cb-lang">{{ langLabel }}</span>
        <button class="cb-copy" (click)="copy()" [class.copied]="copied">
          {{ copied ? '✓ Copié !' : '⎘ Copier' }}
        </button>
      </div>
      <pre class="cb-pre"><code #codeEl [class]="'language-' + normalizedLang">{{ code }}</code></pre>
    </div>
  `,
  styles: [`
    .cb-wrapper { border-radius:10px; overflow:hidden; margin:.9rem 0; border:1px solid #2d3f55; }
    .cb-header { display:flex; justify-content:space-between; align-items:center; background:#1e2a3a; padding:.3rem .85rem; border-bottom:1px solid #2d3f55; }
    .cb-lang { color:#64748b; font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; }
    .cb-copy { background:transparent; border:1px solid #374151; color:#64748b; border-radius:5px; padding:.15rem .5rem; font-size:.7rem; cursor:pointer; transition:all .18s; font-family:inherit; }
    .cb-copy:hover { background:#2d3f55; color:#e2e8f0; border-color:#4b6380; }
    .cb-copy.copied { border-color:#22c55e; color:#22c55e; }
    .cb-pre { margin:0 !important; border-radius:0 !important; background:#1a2332 !important; padding:.85rem 1rem !important; overflow-x:auto; line-height:1.65; font-size:.82rem; }
    .cb-pre code { font-family:'Fira Code','Cascadia Code','Courier New',monospace !important; font-size:.82rem !important; background:transparent !important; text-shadow:none !important; }
  `]
})
export class CodeBlockComponent implements OnChanges, AfterViewInit {
  @Input() code = '';
  @Input() lang = 'plaintext';
  @ViewChild('codeEl') codeEl!: ElementRef<HTMLElement>;
  copied = false;

  private readonly LABELS: Record<string, string> = {
    python:'Python', javascript:'JavaScript', js:'JavaScript',
    typescript:'TypeScript', ts:'TypeScript', php:'PHP',
    java:'Java', cpp:'C++', c:'C', bash:'Bash', sh:'Shell',
    sql:'SQL', html:'HTML', css:'CSS', json:'JSON',
    markup:'HTML', plaintext:'Texte', text:'Texte',
  };

  get langLabel(): string { return this.LABELS[this.lang.toLowerCase()] ?? this.lang.toUpperCase(); }
  get normalizedLang(): string {
    const map: Record<string,string> = { js:'javascript', ts:'typescript', sh:'bash', text:'plaintext' };
    return map[this.lang.toLowerCase()] ?? this.lang.toLowerCase();
  }

  ngAfterViewInit(): void { this.highlight(); }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['code'] || changes['lang']) && this.codeEl) {
      setTimeout(() => {
        if (this.codeEl?.nativeElement) {
          this.codeEl.nativeElement.removeAttribute('data-highlighted');
          this.codeEl.nativeElement.className = `language-${this.normalizedLang}`;
        }
        this.highlight();
      }, 0);
    }
  }

  private highlight(): void {
    if (typeof Prism === 'undefined' || !this.codeEl?.nativeElement) return;
    try { Prism.highlightElement(this.codeEl.nativeElement); } catch (_) {}
  }

  copy(): void {
    navigator.clipboard.writeText(this.code).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = this.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }
}
