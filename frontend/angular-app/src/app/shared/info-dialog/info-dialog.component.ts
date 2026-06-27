import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoService } from '../../services/info.service';

@Component({
  selector: 'app-info-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="is.visible()" (click)="is.close()">
      <div class="box" (click)="$event.stopPropagation()">
        <div class="icon">{{ is.options().icon || 'ℹ️' }}</div>
        <div class="title">{{ is.options().title }}</div>
        <div class="msg">{{ is.options().message }}</div>
        <div class="actions">
          <button class="btn-ok" (click)="is.close()">
            {{ is.options().okLabel || 'OK' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;animation:fade-in .15s ease}
    @keyframes fade-in{from{opacity:0}to{opacity:1}}
    .box{background:#fff;border-radius:18px;padding:32px 28px;width:320px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25);animation:pop-in .2s cubic-bezier(.34,1.56,.64,1)}
    @keyframes pop-in{from{opacity:0;transform:scale(.85) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
    .icon{font-size:36px;margin-bottom:12px}
    .title{font-size:16px;font-weight:700;color:#1a202c;margin-bottom:6px}
    .msg{font-size:13px;color:#718096;line-height:1.55;margin-bottom:24px}
    .actions{display:flex;justify-content:center}
    .btn-ok{padding:9px 32px;border-radius:9px;border:none;background:#4361ee;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
    .btn-ok:hover{filter:brightness(.88)}
  `]
})
export class InfoDialogComponent {
  constructor(public is: InfoService) {}
}
