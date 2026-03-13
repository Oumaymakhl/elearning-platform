import {
  Component, Input, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, SecurityContext
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { CodeBlockComponent } from '../code-block/code-block.component';

interface Block { type: 'html' | 'code'; content: string; lang?: string; }

@Component({
  selector: 'app-lesson-content',
  standalone: true,
  imports: [CommonModule, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lc-body">
      <ng-container *ngFor="let block of blocks">
        <app-code-block *ngIf="block.type === 'code'" [code]="block.content" [lang]="block.lang || 'plaintext'"></app-code-block>
        <div *ngIf="block.type === 'html'" class="lc-prose" [innerHTML]="safe(block.content)"></div>
      </ng-container>
      <p class="lc-empty" *ngIf="blocks.length === 0">Aucun contenu disponible pour cette leçon.</p>
    </div>
  `,
  styles: [`
    .lc-body { font-size:.83rem; color:#4a5568; line-height:1.75; }
    .lc-prose ::ng-deep h1,.lc-prose ::ng-deep h2,.lc-prose ::ng-deep h3 { color:#1a2340; font-weight:700; margin:1.1rem 0 .45rem; }
    .lc-prose ::ng-deep h1 { font-size:1.2rem; }
    .lc-prose ::ng-deep h2 { font-size:1.05rem; }
    .lc-prose ::ng-deep h3 { font-size:.95rem; }
    .lc-prose ::ng-deep p  { margin:.5rem 0; }
    .lc-prose ::ng-deep ul,.lc-prose ::ng-deep ol { padding-left:1.4rem; margin:.5rem 0; }
    .lc-prose ::ng-deep li { margin:.22rem 0; }
    .lc-prose ::ng-deep strong { color:#2d3a52; }
    .lc-prose ::ng-deep a { color:#4361ee; }
    .lc-prose ::ng-deep blockquote { border-left:3px solid #4361ee; margin:.75rem 0; padding:.4rem .9rem; background:#f0f4ff; border-radius:0 6px 6px 0; color:#3451d1; font-style:italic; }
    .lc-prose ::ng-deep code { background:#1a2332; color:#e2e8f0; font-family:'Fira Code','Courier New',monospace; font-size:.8em; padding:.1em .38em; border-radius:4px; }
    .lc-prose ::ng-deep pre { display:none; }
    .lc-empty { color:#8a9bbf; font-style:italic; font-size:.83rem; }
  `]
})
export class LessonContentComponent implements OnChanges {
  @Input() html = '';
  blocks: Block[] = [];

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['html']) this.parse(this.html ?? '');
  }

  private parse(raw: string): void {
    if (!raw.trim()) { this.blocks = []; return; }
    const result: Block[] = [];
    const rx = /<pre[^>]*>\s*<code(?:[^>]*class="[^"]*language-(\w+)[^"]*"[^>]*)?>([^]*?)<\/code>\s*<\/pre>/gi;
    let cursor = 0;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(raw)) !== null) {
      const before = raw.slice(cursor, m.index).trim();
      if (before) result.push({ type: 'html', content: before });
      result.push({ type: 'code', lang: (m[1] || 'plaintext').toLowerCase(), content: this.decodeEntities(m[2]) });
      cursor = m.index + m[0].length;
    }
    const tail = raw.slice(cursor).trim();
    if (tail) result.push({ type: 'html', content: tail });
    if (result.length === 0) result.push({ type: 'html', content: raw });
    this.blocks = result;
  }

  safe(html: string): string { return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? ''; }

  private decodeEntities(encoded: string): string {
    if (typeof document === 'undefined') return encoded;
    const el = document.createElement('textarea');
    el.innerHTML = encoded;
    return el.value;
  }
}
