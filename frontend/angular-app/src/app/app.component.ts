import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { InfoDialogComponent } from './shared/info-dialog/info-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfirmDialogComponent, InfoDialogComponent],
  template: `<router-outlet></router-outlet><app-confirm-dialog></app-confirm-dialog><app-info-dialog></app-info-dialog>`,
})
export class AppComponent {}
