import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  icon?: string;
  okLabel?: string;
  okColor?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  visible = signal(false);
  options = signal<ConfirmOptions>({ title: '', message: '' });
  private resolveFn?: (val: boolean) => void;

  open(opts: ConfirmOptions): Promise<boolean> {
    this.options.set(opts);
    this.visible.set(true);
    return new Promise(resolve => this.resolveFn = resolve);
  }

  confirm(): void { this.visible.set(false); this.resolveFn?.(true); }
  cancel(): void  { this.visible.set(false); this.resolveFn?.(false); }
}
