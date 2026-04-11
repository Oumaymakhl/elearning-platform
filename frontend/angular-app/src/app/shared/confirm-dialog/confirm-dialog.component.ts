import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="cs.visible()" (click)="cs.cancel()">
      <div class="box" (click)="$event.stopPropagation()">
        <div class="icon">{{ cs.options().icon || '⚠️' }}</div>
        <div class="title">{{ cs.options().title }}</div>
        <div class="msg">{{ cs.options().message }}</div>
        <div class="actions">
          <button class="btn-cancel" (click)="cs.cancel()">Annuler</button>
          <button class="btn-ok" [style.background]="cs.options().okColor || '#e53e3e'" (click)="cs.confirm()">
            {{ cs.options().okLabel || 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay { position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;animation:fade-in .15s ease }
    @keyframes fade-in { from{opacity:0} to{opacity:1} }
    .box { background:#fff;border-radius:18px;padding:32px 28px;width:320px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25);animation:pop-in .2s cubic-bezier(.34,1.56,.64,1) }
    @keyframes pop-in { from{opacity:0;transform:scale(.85) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
    .icon  { font-size:36px;margin-bottom:12px }
    .title { font-size:16px;font-weight:700;color:#1a202c;margin-bottom:6px }
    .msg   { font-size:13px;color:#718096;line-height:1.55;margin-bottom:24px }
    .actions { display:flex;gap:10px;justify-content:center }
    .btn-cancel { padding:9px 22px;border-radius:9px;border:1.5px solid #e2e8f0;background:#f7fafc;color:#4a5568;font-size:13px;font-weight:600;cursor:pointer }
    .btn-cancel:hover { background:#edf2f7 }
    .btn-ok { padding:9px 22px;border-radius:9px;border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer }
    .btn-ok:hover { filter:brightness(.88) }
  `]
})
export class ConfirmDialogComponent {
  constructor(public cs: ConfirmService) {}
}
