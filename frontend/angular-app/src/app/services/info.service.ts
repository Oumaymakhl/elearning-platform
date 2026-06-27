import { Injectable, signal } from '@angular/core';

export interface InfoOptions {
  title: string;
  message: string;
  icon?: string;
  okLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class InfoService {
  visible = signal(false);
  options = signal<InfoOptions>({ title: '', message: '' });
  private resolveFn?: () => void;

  open(opts: InfoOptions): Promise<void> {
    this.options.set(opts);
    this.visible.set(true);
    return new Promise(resolve => (this.resolveFn = resolve));
  }

  close(): void {
    this.visible.set(false);
    this.resolveFn?.();
  }
}
