import {
  Component, forwardRef, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectionStrategy,
  ChangeDetectorRef, NgZone
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare const Prism: any;

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RichEditorComponent),
    multi: true
  }],
  template: `
    <div class="re-root" [class.re-focused]="isFocused">
      <div class="re-toolbar">
        <div class="re-toolbar-group">
          <button type="button" class="re-btn" title="Gras (Ctrl+B)" (mousedown)="cmd($event,'bold')">
            <svg viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/></svg>
          </button>
          <button type="button" class="re-btn" title="Italique (Ctrl+I)" (mousedown)="cmd($event,'italic')">
            <svg viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
          </button>
          <button type="button" class="re-btn" title="Souligné (Ctrl+U)" (mousedown)="cmd($event,'underline')">
            <svg viewBox="0 0 24 24"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
          </button>
        </div>
        <div class="re-sep"></div>
        <div class="re-toolbar-group">
          <button type="button" class="re-btn" title="Titre H2" (mousedown)="cmdFormat($event,'h2')">
            <span class="re-label">H2</span>
          </button>
          <button type="button" class="re-btn" title="Titre H3" (mousedown)="cmdFormat($event,'h3')">
            <span class="re-label">H3</span>
          </button>
          <button type="button" class="re-btn" title="Paragraphe" (mousedown)="cmdFormat($event,'p')">
            <svg viewBox="0 0 24 24"><path d="M13 4a4 4 0 0 1 0 8H7V4z"/><line x1="7" y1="4" x2="7" y2="20"/><line x1="11" y1="4" x2="11" y2="20"/></svg>
          </button>
        </div>
        <div class="re-sep"></div>
        <div class="re-toolbar-group">
          <button type="button" class="re-btn" title="Liste" (mousedown)="cmd($event,'insertUnorderedList')">
            <svg viewBox="0 0 24 24"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
          </button>
          <button type="button" class="re-btn" title="Citation" (mousedown)="cmd($event,'formatBlock','blockquote')">
            <svg viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
          </button>
        </div>
        <div class="re-sep"></div>
        <div class="re-toolbar-group re-code-group" style="position:relative">
          <button type="button" class="re-btn re-btn-code" title="Bloc de code" (mousedown)="toggleCodePanel($event)">
            <svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span class="re-label">Code</span>
          </button>
          <div class="re-code-panel" *ngIf="showCodePanel" (click)="$event.stopPropagation()">
            <div class="re-cp-header">Insérer un bloc de code</div>
            <div class="re-cp-row">
              <label>Langage</label>
              <select [(ngModel)]="codeBlockLang">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="php">PHP</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="bash">Bash</option>
                <option value="sql">SQL</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="plaintext">Texte brut</option>
              </select>
            </div>
            <div class="re-cp-row">
              <label>Code</label>
              <textarea [(ngModel)]="codeBlockContent" rows="6" placeholder="Collez votre code ici..."></textarea>
            </div>
            <div class="re-cp-actions">
              <button type="button" class="re-cp-insert" (click)="insertCodeBlock()">Inserer</button>
              <button type="button" class="re-cp-cancel" (click)="showCodePanel=false">Annuler</button>
            </div>
          </div>
        </div>
        <div class="re-sep"></div>
        <div class="re-toolbar-group">
          <button type="button" class="re-btn" title="Ligne horizontale" (mousedown)="insertHR($event)">
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" stroke-width="2"/></svg>
          </button>
          <button type="button" class="re-btn re-btn-danger" title="Effacer tout" (mousedown)="clearContent($event)">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
        <div class="re-sep"></div>
        <div class="re-toolbar-group" style="position:relative">
          <button type="button" class="re-btn re-btn-media" title="Inserer une image" (mousedown)="toggleImagePanel($event)">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span class="re-label">Image</span>
          </button>
          <div class="re-code-panel" *ngIf="showImagePanel" (click)="$event.stopPropagation()">
            <div class="re-cp-header">Inserer une image</div>
            <div class="re-cp-row">
              <label>URL de l'image</label>
              <input type="text" [(ngModel)]="imageUrl" placeholder="https://..." style="width:100%;padding:.4rem .65rem;border:1px solid #d1d9e6;border-radius:7px;font-size:.82rem;box-sizing:border-box"/>
            </div>
            <div class="re-cp-row">
              <label>Ou uploader</label>
              <input type="file" accept="image/*" (change)="onImageFile($event)" style="font-size:.82rem"/>
            </div>
            <div class="re-cp-actions">
              <button type="button" class="re-cp-insert" (click)="insertImage()">Inserer</button>
              <button type="button" class="re-cp-cancel" (click)="showImagePanel=false">Annuler</button>
            </div>
          </div>
        </div>
        <div class="re-toolbar-group" style="position:relative">
          <button type="button" class="re-btn re-btn-media" title="Inserer une video" (mousedown)="toggleVideoPanel($event)">
            <svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            <span class="re-label">Video</span>
          </button>
          <div class="re-code-panel" *ngIf="showVideoPanel" (click)="$event.stopPropagation()">
            <div class="re-cp-header">Inserer une video</div>
            <div class="re-cp-row">
              <label>URL YouTube ou lien direct</label>
              <input type="text" [(ngModel)]="videoUrl" placeholder="https://youtube.com/watch?v=..." style="width:100%;padding:.4rem .65rem;border:1px solid #d1d9e6;border-radius:7px;font-size:.82rem;box-sizing:border-box"/>
            </div>
            <div class="re-cp-actions">
              <button type="button" class="re-cp-insert" (click)="insertVideo()">Inserer</button>
              <button type="button" class="re-cp-cancel" (click)="showVideoPanel=false">Annuler</button>
            </div>
          </div>
        </div>
      </div>
      <div #editorEl class="re-editor" contenteditable="true"
           [attr.data-placeholder]="placeholder"
           (input)="onInput()" (focus)="isFocused=true" (blur)="onBlur()"
           (keydown)="onKeyDown($event)"></div>
      <div class="re-status">
        <span>{{ wordCount }} mots</span>
        <span>{{ codeBlockCount }} bloc(s) de code</span>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block}
    .re-root{border:1.5px solid #d1d9e6;border-radius:12px;overflow:visible;background:#fff;transition:border-color .2s,box-shadow .2s;font-family:'Segoe UI',system-ui,sans-serif}
    .re-root.re-focused{border-color:#4361ee;box-shadow:0 0 0 3px rgba(67,97,238,.12)}
    .re-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:2px;padding:7px 10px;background:#f6f8fc;border-bottom:1px solid #e2e8f0;border-radius:11px 11px 0 0}
    .re-toolbar-group{display:flex;align-items:center;gap:2px}
    .re-sep{width:1px;height:22px;background:#d1d9e6;margin:0 4px}
    .re-btn{display:flex;align-items:center;justify-content:center;gap:4px;width:32px;height:30px;background:transparent;border:1px solid transparent;border-radius:7px;cursor:pointer;color:#4a5568;transition:all .15s;padding:0 6px}
    .re-btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
    .re-btn:hover{background:#e8edf7;border-color:#cdd5e0;color:#1e3a5f}
    .re-btn:active{background:#dce3f7;transform:scale(.95)}
    .re-label{font-size:.72rem;font-weight:700;letter-spacing:.02em;white-space:nowrap}
    .re-btn-code{width:auto;padding:0 10px;gap:5px;background:#1a2332;color:#e2e8f0;border-color:#2d3f55}
    .re-btn-code:hover{background:#2d3f55;color:#fff}
    .re-btn-code svg{stroke:#64b5f6}
    .re-btn-danger:hover{background:#fef2f2;border-color:#fca5a5;color:#dc2626}
    .re-code-group{position:relative}
    .re-code-panel{position:absolute;top:calc(100% + 8px);left:0;z-index:200;width:380px;background:#fff;border:1.5px solid #2d3f55;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.18);padding:14px 16px 12px}
    .re-cp-header{font-size:.82rem;font-weight:700;color:#1a2332;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e8ecf3}
    .re-cp-row{margin-bottom:10px}
    .re-cp-row label{display:block;font-size:.75rem;font-weight:600;color:#475569;margin-bottom:4px}
    .re-cp-row select{width:100%;padding:.4rem .65rem;border:1px solid #d1d9e6;border-radius:7px;font-size:.82rem;background:#f8fafc;outline:none}
    .re-cp-row textarea{width:100%;padding:.5rem .7rem;border:1px solid #d1d9e6;border-radius:7px;font-family:'Courier New',monospace;font-size:.78rem;resize:vertical;min-height:110px;outline:none;background:#1a2332;color:#e2e8f0;line-height:1.6;box-sizing:border-box}
    .re-cp-actions{display:flex;gap:8px;margin-top:4px}
    .re-cp-insert{flex:1;padding:.45rem 1rem;background:#4361ee;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:600}
    .re-cp-insert:hover{background:#3451d1}
    .re-cp-cancel{padding:.45rem 1rem;background:#f0f4ff;color:#4361ee;border:1px solid #d5dcf9;border-radius:8px;cursor:pointer;font-size:.82rem}
    .re-editor{min-height:180px;max-height:500px;overflow-y:auto;padding:14px 16px;outline:none;font-size:.88rem;color:#2d3a52;line-height:1.75;caret-color:#4361ee}
    .re-editor:empty::before{content:attr(data-placeholder);color:#a0aec0;pointer-events:none;font-style:italic}
    .re-editor ::ng-deep h2{font-size:1.1rem;font-weight:700;color:#1a2340;margin:1rem 0 .4rem}
    .re-editor ::ng-deep h3{font-size:.95rem;font-weight:700;color:#1a2340;margin:.8rem 0 .3rem}
    .re-editor ::ng-deep p{margin:.4rem 0}
    .re-editor ::ng-deep ul,.re-editor ::ng-deep ol{padding-left:1.4rem;margin:.4rem 0}
    .re-editor ::ng-deep blockquote{border-left:3px solid #4361ee;margin:.6rem 0;padding:.4rem .9rem;background:#f0f4ff;border-radius:0 6px 6px 0;color:#3451d1;font-style:italic}
    .re-editor ::ng-deep strong{color:#1e3a5f}
    .re-editor ::ng-deep hr{border:none;border-top:2px solid #e2e8f0;margin:1rem 0}
    .re-editor ::ng-deep code{background:#1a2332;color:#e2e8f0;font-family:'Courier New',monospace;font-size:.8em;padding:.1em .38em;border-radius:4px}
    .re-editor ::ng-deep .re-code-block{border-radius:10px;overflow:hidden;margin:.9rem 0;border:1px solid #2d3f55;user-select:none}
    .re-editor ::ng-deep .re-cb-header{display:flex;justify-content:space-between;align-items:center;background:#1e2a3a;padding:5px 12px;border-bottom:1px solid #2d3f55}
    .re-editor ::ng-deep .re-cb-lang{color:#64748b;font-size:.7rem;font-weight:700;text-transform:uppercase;font-family:monospace}
    .re-editor ::ng-deep .re-cb-del{background:transparent;border:none;color:#64748b;cursor:pointer;font-size:.75rem;padding:2px 6px;border-radius:4px}
    .re-editor ::ng-deep .re-cb-del:hover{background:#e53e3e;color:#fff}
    .re-editor ::ng-deep .re-cb-pre{margin:0!important;background:#1a2332!important;padding:.85rem 1rem!important;overflow-x:auto;line-height:1.65;font-size:.8rem}
    .re-editor ::ng-deep .re-cb-pre code{font-family:'Courier New',monospace!important;font-size:.8rem!important;background:transparent!important;color:#e2e8f0;padding:0}
    .re-btn-media{width:auto;padding:0 10px;gap:5px;background:#0ea5e9;color:#fff;border-color:#0284c7}
    .re-btn-media:hover{background:#0284c7;color:#fff}
    .re-editor ::ng-deep .re-img{max-width:100%;border-radius:8px;margin:.5rem 0;display:block}
    .re-editor ::ng-deep .re-video-wrap{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:.5rem 0}
    .re-editor ::ng-deep .re-video-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%}
    .re-status{display:flex;justify-content:flex-end;gap:12px;padding:5px 12px;background:#f6f8fc;border-top:1px solid #e2e8f0;border-radius:0 0 10px 10px;font-size:.7rem;color:#94a3b8}
  `]
})
export class RichEditorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;
  placeholder = "Ecrivez votre contenu ici. Utilisez la barre d outils pour formater le texte ou inserer un bloc de code...";
  isFocused = false;
  showCodePanel = false;
  codeBlockLang = 'python';
  codeBlockContent = '';
  showImagePanel = false;
  imageUrl = '';
  showVideoPanel = false;
  videoUrl = '';
  wordCount = 0;
  codeBlockCount = 0;
  private _value = '';
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};
  private savedRange: Range | null = null;
  private clickOutside = (e: MouseEvent) => {
    if (this.showCodePanel && !this.editorEl?.nativeElement?.closest('.re-root')?.contains(e.target as Node)) {
      this.showCodePanel = false;
      this.cdr.markForCheck();
    }
  };
  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}
  ngAfterViewInit(): void {
    document.addEventListener('click', this.clickOutside);
    if (this._value) this.editorEl.nativeElement.innerHTML = this._value;
    this.updateStats();
  }
  ngOnDestroy(): void { document.removeEventListener('click', this.clickOutside); }
  writeValue(val: string): void {
    this._value = val || '';
    if (this.editorEl) {
      this.editorEl.nativeElement.innerHTML = this._value;
      this.updateStats();
      this.cdr.markForCheck();
    }
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  onInput(): void {
    const html = this.serializeHTML();
    this._value = html;
    this.onChange(html);
    this.updateStats();
  }
  onBlur(): void { this.isFocused = false; this.onTouched(); this.cdr.markForCheck(); }
  onKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); document.execCommand('bold'); }
      if (e.key === 'i') { e.preventDefault(); document.execCommand('italic'); }
      if (e.key === 'u') { e.preventDefault(); document.execCommand('underline'); }
    }
    if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;'); }
  }
  cmd(e: MouseEvent, command: string, value?: string): void {
    e.preventDefault();
    this.editorEl.nativeElement.focus();
    document.execCommand(command, false, value);
    this.onInput();
  }
  cmdFormat(e: MouseEvent, tag: string): void {
    e.preventDefault();
    this.editorEl.nativeElement.focus();
    document.execCommand('formatBlock', false, tag);
    this.onInput();
  }
  insertHR(e: MouseEvent): void {
    e.preventDefault();
    this.editorEl.nativeElement.focus();
    document.execCommand('insertHTML', false, '<hr/>');
    this.onInput();
  }
  clearContent(e: MouseEvent): void {
    e.preventDefault();
    if (!confirm('Effacer tout le contenu ?')) return;
    this.editorEl.nativeElement.innerHTML = '';
    this.onInput();
  }
  toggleCodePanel(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) this.savedRange = sel.getRangeAt(0).cloneRange();
    this.showCodePanel = !this.showCodePanel;
    this.codeBlockContent = '';
    this.cdr.markForCheck();
  }
  insertCodeBlock(): void {
    if (!this.codeBlockContent.trim()) { this.showCodePanel = false; return; }
    const langLabels: Record<string,string> = {
      python:'Python', javascript:'JavaScript', typescript:'TypeScript',
      php:'PHP', java:'Java', cpp:'C++', c:'C', bash:'Bash',
      sql:'SQL', html:'HTML', css:'CSS', json:'JSON', plaintext:'Texte'
    };
    const label = langLabels[this.codeBlockLang] ?? this.codeBlockLang.toUpperCase();
    const escaped = this.escapeHtml(this.codeBlockContent);
    const delBtn = "this.closest('.re-code-block').remove()";
    const blockHTML = [
      '<div class="re-code-block" contenteditable="false" data-lang="' + this.codeBlockLang + '">',
      '  <div class="re-cb-header">',
      '    <span class="re-cb-lang">' + label + '</span>',
      '    <button class="re-cb-del" onclick="' + delBtn + '">X Suppr</button>',
      '  </div>',
      '  <pre class="re-cb-pre"><code class="language-' + this.codeBlockLang + '">' + escaped + '</code></pre>',
      '</div><p><br></p>'
    ].join('');
    this.editorEl.nativeElement.focus();
    if (this.savedRange) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(this.savedRange); }
    }
    document.execCommand('insertHTML', false, blockHTML);
    setTimeout(() => {
      if (typeof Prism !== 'undefined') {
        this.editorEl.nativeElement.querySelectorAll('code[class*="language-"]').forEach((el: any) => {
          el.removeAttribute('data-highlighted');
          try { Prism.highlightElement(el); } catch (_) {}
        });
      }
      this.onInput();
    }, 50);
    this.showCodePanel = false;
    this.codeBlockContent = '';
    this.cdr.markForCheck();
  }
  private escapeHtml(str: string): string {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  private serializeHTML(): string {
    if (!this.editorEl) return '';
    const clone = this.editorEl.nativeElement.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.re-cb-del').forEach(el => el.remove());
    clone.querySelectorAll('.re-code-block').forEach((block: any) => {
      const lang = block.getAttribute('data-lang') || 'plaintext';
      const codeEl = block.querySelector('code');
      const content = codeEl ? codeEl.textContent || '' : '';
      const esc = this.escapeHtml(content);
      const pre = document.createElement('pre');
      pre.innerHTML = '<code class="language-' + lang + '">' + esc + '</code>';
      block.replaceWith(pre);
    });
    return clone.innerHTML;
  }
  toggleImagePanel(e: MouseEvent): void {
    e.preventDefault(); e.stopPropagation();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) this.savedRange = sel.getRangeAt(0).cloneRange();
    this.showImagePanel = !this.showImagePanel;
    this.showVideoPanel = false;
    this.imageUrl = '';
    this.cdr.markForCheck();
  }

  toggleVideoPanel(e: MouseEvent): void {
    e.preventDefault(); e.stopPropagation();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) this.savedRange = sel.getRangeAt(0).cloneRange();
    this.showVideoPanel = !this.showVideoPanel;
    this.showImagePanel = false;
    this.videoUrl = '';
    this.cdr.markForCheck();
  }

  onImageFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      this.imageUrl = ev.target?.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  insertImage(): void {
    if (!this.imageUrl.trim()) { this.showImagePanel = false; return; }
    const img = document.createElement('img');
    img.src = this.imageUrl;
    img.className = 're-img';
    img.alt = 'image';
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    this.editorEl.nativeElement.appendChild(img);
    this.editorEl.nativeElement.appendChild(p);
    this.onInput();
    this.showImagePanel = false;
    this.imageUrl = '';
    this.cdr.markForCheck();
  }

  insertVideo(): void {
    if (!this.videoUrl.trim()) { this.showVideoPanel = false; return; }
    let embedUrl = this.videoUrl;
    const ytMatch = this.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) embedUrl = 'https://www.youtube.com/embed/' + ytMatch[1];
    const html = '<div class="re-video-wrap" contenteditable="false"><iframe src="' + embedUrl + '" frameborder="0" allowfullscreen></iframe></div><p><br></p>';
    this.editorEl.nativeElement.focus();
    if (this.savedRange) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(this.savedRange); }
    }
    document.execCommand('insertHTML', false, html);
    this.onInput();
    this.showVideoPanel = false;
    this.videoUrl = '';
    this.cdr.markForCheck();
  }

  private updateStats(): void {
    if (!this.editorEl) return;
    const text = this.editorEl.nativeElement.innerText || '';
    this.wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.codeBlockCount = this.editorEl.nativeElement.querySelectorAll('.re-code-block').length;
    this.cdr.markForCheck();
  }
}
