import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
      <div class="split">
        <div class="illus-side">
          <div class="illus-card">
            <svg viewBox="0 0 340 280" xmlns="http://www.w3.org/2000/svg" class="illus-svg">
              <circle cx="170" cy="140" r="110" fill="#4A90D9" opacity=".12"/>
              <circle cx="170" cy="140" r="75" fill="#4A90D9" opacity=".1"/>
              <rect x="90" y="60" width="160" height="120" rx="12" fill="white" opacity=".9"/>
              <rect x="90" y="60" width="160" height="28" rx="12" fill="#1E3A5F" opacity=".85"/>
              <rect x="90" y="74" width="160" height="14" rx="0" fill="#1E3A5F" opacity=".85"/>
              <circle cx="103" cy="74" r="4" fill="#ef4444" opacity=".8"/>
              <circle cx="116" cy="74" r="4" fill="#f59e0b" opacity=".8"/>
              <circle cx="129" cy="74" r="4" fill="#10b981" opacity=".8"/>
              <rect x="105" y="100" width="130" height="7" rx="3" fill="#4A90D9" opacity=".4"/>
              <rect x="105" y="115" width="100" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="105" y="129" width="110" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="105" y="143" width="80" height="6" rx="3" fill="#e2e8f0"/>
              <rect x="105" y="158" width="60" height="14" rx="7" fill="#4A90D9" opacity=".85"/>
              <circle cx="268" cy="105" r="32" fill="#4A90D9" opacity=".12"/>
              <circle cx="268" cy="99"  r="13" fill="#FFD7B5"/>
              <rect x="255" y="112" width="26" height="32" rx="7" fill="#4A90D9" opacity=".65"/>
              <rect x="246" y="116" width="13" height="22" rx="5" fill="#4A90D9" opacity=".45"/>
              <rect x="281" y="116" width="13" height="22" rx="5" fill="#4A90D9" opacity=".45"/>
              <circle cx="92" cy="210" r="24" fill="#4A90D9" opacity=".12"/>
              <circle cx="92" cy="204" r="10" fill="#FFD7B5"/>
              <rect x="82"  y="214" width="20" height="24" rx="5" fill="#1E3A5F" opacity=".45"/>
              <path d="M200 185 Q232 162 254 188" stroke="#4A90D9" stroke-width="2" fill="none" opacity=".35" stroke-dasharray="4,3"/>
              <text x="282" y="72"  font-size="14" fill="#4A90D9" opacity=".5">✦</text>
              <text x="63"  y="158" font-size="10" fill="#1E3A5F" opacity=".3">✦</text>
              <text x="222" y="242" font-size="12" fill="#4A90D9" opacity=".4">✦</text>
            </svg>
            <h2>Rejoignez notre plateforme !</h2>
            <p>Créez votre compte et commencez à apprendre ou à enseigner dès aujourd'hui.</p>
          </div>
        </div>

        <div class="form-side">
          <div class="form-card">
            <div class="brand">🎓 <span>E-Learning</span></div>
            <h3>Inscription</h3>
            <p class="sub">Créez votre compte en quelques secondes.</p>

            <div class="error-box" *ngIf="error">
              <svg viewBox="0 0 20 20" width="16" fill="none"><circle cx="10" cy="10" r="8" stroke="#ef4444" stroke-width="1.5"/><path d="M10 6v4M10 14h.01" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ error }}
            </div>
            <div class="success-box" *ngIf="success">
              <svg viewBox="0 0 20 20" width="16" fill="none"><circle cx="10" cy="10" r="8" stroke="#10b981" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5 4-4" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ success }}
            </div>

            <form (ngSubmit)="onSubmit()" #f="ngForm">
              <div class="field">
                <label>Nom complet</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="#94a3b8" stroke-width="1.5"/><path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input type="text" [(ngModel)]="name" name="name" required placeholder="Votre nom complet"/>
                </div>
              </div>

              <div class="field">
                <label>Email</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 0l7 5 7-5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input type="email" [(ngModel)]="email" name="email" required placeholder="votre@email.com"/>
                </div>
              </div>

              <div class="field">
                <label>Mot de passe</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><rect x="5" y="9" width="10" height="8" rx="2" stroke="#94a3b8" stroke-width="1.5"/><path d="M7 9V7a3 3 0 016 0v2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="password" name="password" required placeholder="Min. 6 caractères"/>
                  <button type="button" class="eye" (click)="showPw=!showPw">
                    <svg viewBox="0 0 20 20" fill="none" width="18"><path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" stroke="#94a3b8" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="#94a3b8" stroke-width="1.5"/></svg>
                  </button>
                </div>
              </div>

              <div class="field">
                <label>Confirmer le mot de passe</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><rect x="5" y="9" width="10" height="8" rx="2" stroke="#94a3b8" stroke-width="1.5"/><path d="M7 9V7a3 3 0 016 0v2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input [type]="showPw2 ? 'text' : 'password'" [(ngModel)]="password_confirmation" name="password_confirmation" required placeholder="Répétez le mot de passe"/>
                  <button type="button" class="eye" (click)="showPw2=!showPw2">
                    <svg viewBox="0 0 20 20" fill="none" width="18"><path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" stroke="#94a3b8" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="#94a3b8" stroke-width="1.5"/></svg>
                  </button>
                </div>
              </div>

              <div class="field">
                <label>Rôle</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><path d="M9 12l2 2 4-4" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" stroke="#94a3b8" stroke-width="1.5"/></svg>
                  <select [(ngModel)]="role" name="role" class="select-input">
                    <option value="student">👨‍🎓 Étudiant</option>
                    <option value="teacher">👨‍🏫 Enseignant</option>
                  </select>
                </div>
              </div>

              <div class="field cv-field" *ngIf="role === 'teacher'">
                <label>
                  CV
                  <span class="required-badge">obligatoire</span>
                </label>
                <div class="cv-upload" (click)="cvInput.click()" [class.has-file]="cvFile">
                  <div class="cv-inner">
                    <svg *ngIf="!cvFile" viewBox="0 0 24 24" fill="none" width="28" style="margin-bottom:.4rem;opacity:.5"><path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="#4A90D9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="3" width="18" height="18" rx="4" stroke="#4A90D9" stroke-width="1.5"/></svg>
                    <svg *ngIf="cvFile" viewBox="0 0 24 24" fill="none" width="28" style="margin-bottom:.4rem"><circle cx="12" cy="12" r="9" fill="#dcfce7"/><path d="M8 12l2.5 2.5L16 9" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span *ngIf="!cvFile">Cliquez pour uploader votre CV<br><small>PDF, DOC, DOCX — max 5 MB</small></span>
                    <span *ngIf="cvFile" class="file-name">{{ cvFile.name }}</span>
                  </div>
                </div>
                <input #cvInput type="file" accept=".pdf,.doc,.docx" (change)="onCvChange($event)" style="display:none"/>
                <p class="cv-hint">Votre CV sera examiné par l'administrateur avant activation de votre compte.</p>
              </div>

              <button type="submit" [disabled]="loading || (role === 'teacher' && !cvFile)" class="btn-submit">
                <span *ngIf="!loading">Créer mon compte</span>
                <span *ngIf="loading" class="spinner"></span>
              </button>
            </form>

            <p class="switch">Déjà un compte ? <a routerLink="/login">Se connecter</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { min-height:100vh; background:#e8f0fb; position:relative; overflow:hidden; display:flex; align-items:stretch; }
    .circle { position:absolute; border-radius:50%; background:#4A90D9; opacity:.13; }
    .c1 { width:500px; height:500px; top:-180px; left:-150px; }
    .c2 { width:350px; height:350px; bottom:-120px; right:-80px; }
    .c3 { width:200px; height:200px; top:55%; left:38%; opacity:.08; }
    .split { display:flex; width:100%; min-height:100vh; position:relative; z-index:1; }

    .illus-side { flex:1; display:flex; align-items:center; justify-content:center; padding:3rem 2rem; }
    .illus-card { text-align:center; max-width:340px; }
    .illus-svg { width:100%; max-width:300px; margin-bottom:1.75rem; filter:drop-shadow(0 8px 24px rgba(74,144,217,.18)); }
    .illus-card h2 { color:#1E3A5F; font-size:1.5rem; font-weight:700; margin-bottom:.75rem; }
    .illus-card p { color:#64748b; font-size:.95rem; line-height:1.7; }

    .form-side { flex:0 0 500px; display:flex; align-items:center; justify-content:center; padding:2rem; overflow-y:auto; }
    .form-card { background:white; border-radius:20px; box-shadow:0 8px 40px rgba(30,58,95,.10); padding:2.5rem; width:100%; max-width:440px; }
    .brand { text-align:center; font-size:1.25rem; font-weight:800; color:#1E3A5F; margin-bottom:.4rem; }
    .brand span { color:#4A90D9; }
    h3 { text-align:center; font-size:1.6rem; color:#1E3A5F; font-weight:700; margin-bottom:.2rem; }
    .sub { text-align:center; color:#64748b; font-size:.88rem; margin-bottom:1.5rem; }

    .field { margin-bottom:1rem; }
    label { display:flex; align-items:center; gap:.4rem; font-size:.82rem; font-weight:600; color:#374151; margin-bottom:.4rem; }
    .required-badge { background:#fef2f2; color:#ef4444; border:1px solid #fecaca; font-size:.72rem; padding:1px 7px; border-radius:10px; font-weight:600; }

    .input-wrap { position:relative; display:flex; align-items:center; }
    .ico { position:absolute; left:.85rem; width:17px; height:17px; flex-shrink:0; }
    .input-wrap input,
    .select-input {
      width:100%; padding:.78rem .78rem .78rem 2.6rem;
      border:1.5px solid #e2e8f0; border-radius:10px;
      font-size:.92rem; outline:none;
      transition:border-color .2s, box-shadow .2s;
      background:#f8fafc; color:#1e293b;
      appearance:none;
    }
    .input-wrap input:focus,
    .select-input:focus { border-color:#4A90D9; box-shadow:0 0 0 3px rgba(74,144,217,.12); background:white; }
    .eye { position:absolute; right:.75rem; background:none; border:none; cursor:pointer; padding:0; display:flex; }

    .cv-field label { margin-bottom:.5rem; }
    .cv-upload {
      border:2px dashed #cbd5e1; border-radius:12px; padding:1.25rem;
      text-align:center; cursor:pointer; transition:all .2s; background:#f8fafc;
    }
    .cv-upload:hover { border-color:#4A90D9; background:#eff6ff; }
    .cv-upload.has-file { border-color:#10b981; background:#f0fdf4; }
    .cv-inner { display:flex; flex-direction:column; align-items:center; color:#64748b; font-size:.85rem; line-height:1.5; }
    .cv-inner small { color:#94a3b8; font-size:.78rem; margin-top:.2rem; }
    .file-name { color:#10b981; font-weight:600; font-size:.88rem; }
    .cv-hint { font-size:.76rem; color:#94a3b8; margin-top:.4rem; line-height:1.4; }

    .error-box { display:flex; align-items:center; gap:.5rem; background:#fef2f2; border:1px solid #fecaca; color:#ef4444; padding:.65rem .85rem; border-radius:8px; font-size:.85rem; margin-bottom:1rem; }
    .success-box { display:flex; align-items:center; gap:.5rem; background:#f0fdf4; border:1px solid #bbf7d0; color:#15803d; padding:.65rem .85rem; border-radius:8px; font-size:.85rem; margin-bottom:1rem; }

    .btn-submit { width:100%; padding:.9rem; background:#4A90D9; color:white; border:none; border-radius:10px; font-size:1rem; font-weight:600; cursor:pointer; transition:background .2s,transform .1s; display:flex; align-items:center; justify-content:center; min-height:48px; margin-top:.5rem; }
    .btn-submit:hover:not(:disabled) { background:#1E3A5F; transform:translateY(-1px); }
    .btn-submit:disabled { opacity:.6; cursor:not-allowed; }
    .spinner { width:20px; height:20px; border:2px solid rgba(255,255,255,.4); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .switch { text-align:center; margin-top:1.25rem; color:#64748b; font-size:.88rem; }
    .switch a { color:#4A90D9; font-weight:600; text-decoration:none; }
    .switch a:hover { color:#1E3A5F; }

    @media(max-width:768px) { .illus-side { display:none; } .form-side { flex:1; } }
  `]
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  password_confirmation = '';
  role = 'student';
  cvFile: File | null = null;
  showPw = false;
  showPw2 = false;
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  onCvChange(event: any) {
    const file = event.target.files[0];
    if (file) this.cvFile = file;
  }

  onSubmit() {
    this.error = '';
    this.success = '';

    if (!this.name.trim()) { this.error = 'Le nom est obligatoire.'; return; }
    if (!this.email.trim()) { this.error = 'L\'email est obligatoire.'; return; }
    if (this.password.length < 6) { this.error = 'Le mot de passe doit contenir au moins 6 caractères.'; return; }
    if (this.password !== this.password_confirmation) { this.error = 'Les mots de passe ne correspondent pas.'; return; }
    if (this.role === 'teacher' && !this.cvFile) {
      this.error = 'Veuillez uploader votre CV pour vous inscrire en tant qu\'enseignant.';
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('password_confirmation', this.password_confirmation);
    formData.append('role', this.role);
    if (this.cvFile) formData.append('cv', this.cvFile);

    this.auth.registerWithFormData(formData).subscribe({
      next: () => {
        this.success = this.role === 'teacher'
          ? '✅ Compte créé ! Vérifiez votre email puis attendez l\'approbation de l\'administrateur.'
          : '✅ Compte créé ! Vérifiez votre email pour activer votre compte.';
        this.loading = false;
        this.name = ''; this.email = ''; this.password = ''; this.password_confirmation = ''; this.cvFile = null;
      },
      error: (err) => {
        this.error = err.error?.email?.[0] || err.error?.message || 'Erreur lors de l\'inscription.';
        this.loading = false;
      }
    });
  }
}
