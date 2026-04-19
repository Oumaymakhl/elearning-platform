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

      <div class="popup-overlay" *ngIf="successMsg">
        <div class="popup-box">
          <div class="popup-icon">{{ role === "teacher" ? "⏳" : "🎉" }}</div>
          <h3>{{ role === "teacher" ? "Demande envoyée !" : "Inscription réussie !" }}</h3>
          <p>{{ successMsg }}</p>
          <div *ngIf="role === 'teacher'" class="popup-steps">
            <div class="step"><span class="step-icon">📧</span><span>Vérifiez votre email</span></div>
            <div class="step"><span class="step-icon">🔍</span><span>L'admin examine votre CV</span></div>
            <div class="step"><span class="step-icon">✅</span><span>Votre compte sera activé</span></div>
          </div>
          <button class="popup-btn" (click)="goToLogin()">Compris !</button>
        </div>
      </div>

      <div class="split">
        <div class="illus-side">
          <div class="illus-card">
            <svg viewBox="0 0 340 280" xmlns="http://www.w3.org/2000/svg" class="illus-svg">
              <circle cx="170" cy="140" r="110" fill="#4A90D9" opacity=".12"/>
              <circle cx="170" cy="140" r="75" fill="#4A90D9" opacity=".1"/>
              <rect x="80" y="130" width="60" height="80" rx="6" fill="#4A90D9" opacity=".7"/>
              <rect x="85" y="135" width="50" height="70" rx="4" fill="white" opacity=".9"/>
              <rect x="90" y="145" width="40" height="4" rx="2" fill="#4A90D9" opacity=".5"/>
              <rect x="90" y="155" width="30" height="4" rx="2" fill="#e2e8f0"/>
              <rect x="90" y="165" width="35" height="4" rx="2" fill="#e2e8f0"/>
              <rect x="90" y="175" width="25" height="4" rx="2" fill="#e2e8f0"/>
              <rect x="148" y="145" width="55" height="65" rx="6" fill="#1E3A5F" opacity=".7"/>
              <rect x="153" y="150" width="45" height="55" rx="4" fill="white" opacity=".9"/>
              <rect x="158" y="160" width="35" height="4" rx="2" fill="#1E3A5F" opacity=".5"/>
              <rect x="158" y="170" width="25" height="4" rx="2" fill="#e2e8f0"/>
              <rect x="158" y="180" width="30" height="4" rx="2" fill="#e2e8f0"/>
              <rect x="135" y="75" width="60" height="8" rx="2" fill="#1E3A5F" opacity=".85"/>
              <polygon points="165,55 195,75 135,75" fill="#1E3A5F" opacity=".75"/>
              <line x1="195" y1="75" x2="200" y2="95" stroke="#4A90D9" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="200" cy="98" r="4" fill="#4A90D9" opacity=".9"/>
              <circle cx="255" cy="115" r="22" fill="#4A90D9" opacity=".12"/>
              <circle cx="255" cy="109" r="10" fill="#FFD7B5"/>
              <rect x="245" y="119" width="20" height="26" rx="5" fill="#4A90D9" opacity=".65"/>
              <circle cx="95" cy="220" r="20" fill="#4A90D9" opacity=".1"/>
              <circle cx="95" cy="214" r="8" fill="#FFD7B5"/>
              <rect x="87" y="222" width="16" height="22" rx="4" fill="#1E3A5F" opacity=".5"/>
              <text x="75" y="100" font-size="14" fill="#4A90D9" opacity=".5">✦</text>
              <text x="270" y="200" font-size="10" fill="#1E3A5F" opacity=".3">✦</text>
              <text x="210" y="245" font-size="12" fill="#4A90D9" opacity=".4">✦</text>
            </svg>
            <h2>Rejoignez-nous !</h2>
            <p>Créez votre compte et accédez à des centaines de cours dispensés par des experts.</p>
            <div class="stats">
              <div class="stat"><span class="stat-num">12k+</span><span class="stat-label">Étudiants</span></div>
              <div class="stat-div"></div>
              <div class="stat"><span class="stat-num">800+</span><span class="stat-label">Cours</span></div>
              <div class="stat-div"></div>
              <div class="stat"><span class="stat-num">200+</span><span class="stat-label">Enseignants</span></div>
            </div>
          </div>
        </div>

        <div class="form-side">
          <div class="form-card">
            <div class="brand">🎓 <span>E-Learning</span></div>
            <h3>Créer un compte</h3>
            <p class="sub">Remplissez les informations ci-dessous</p>

            <div class="error-box" *ngIf="error">
              <svg viewBox="0 0 20 20" width="16" fill="none"><circle cx="10" cy="10" r="8" stroke="#ef4444" stroke-width="1.5"/><path d="M10 6v4M10 14h.01" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ error }}
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
                <label>Adresse email</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 0l7 5 7-5" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input type="email" [(ngModel)]="email" name="email" required placeholder="votre@email.com"/>
                </div>
              </div>

              <div class="field">
                <label>Mot de passe</label>
                <div class="input-wrap">
                  <svg class="ico" viewBox="0 0 20 20" fill="none"><rect x="5" y="9" width="10" height="8" rx="2" stroke="#94a3b8" stroke-width="1.5"/><path d="M7 9V7a3 3 0 016 0v2" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="password" name="password" required placeholder="Min. 6 caractères" (input)="checkStrength(password)"/>
                  <button type="button" class="eye" (click)="showPw=!showPw">
                    <svg viewBox="0 0 20 20" fill="none" width="18"><path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" stroke="#94a3b8" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="#94a3b8" stroke-width="1.5"/></svg>
                  </button>
                </div>
                <div class="strength-wrap" *ngIf="password">
                  <div class="strength-bars">
                    <span class="bar" [class.active]="pwStrength>=1" [class.weak]="pwStrength===1" [class.medium]="pwStrength===2" [class.strong]="pwStrength>=3"></span>
                    <span class="bar" [class.active]="pwStrength>=2" [class.medium]="pwStrength===2" [class.strong]="pwStrength>=3"></span>
                    <span class="bar" [class.active]="pwStrength>=3" [class.strong]="pwStrength>=3"></span>
                  </div>
                  <div class="strength-checks">
                    <span [class.ok]="has6Chars">{{ has6Chars ? "✅" : "❌" }} 6 caractères minimum</span>
                    <span [class.ok]="hasUpper">{{ hasUpper ? "✅" : "❌" }} Une majuscule</span>
                    <span [class.ok]="hasDigit">{{ hasDigit ? "✅" : "❌" }} Un chiffre</span>
                  </div>
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
                <div class="match-hint" *ngIf="password_confirmation">
                  <span *ngIf="password === password_confirmation" class="match-ok">✅ Les mots de passe correspondent</span>
                  <span *ngIf="password !== password_confirmation" class="match-no">❌ Les mots de passe ne correspondent pas</span>
                </div>
              </div>

              <div class="field">
                <label>Vous êtes</label>
                <div class="role-toggle">
                  <button type="button" class="role-btn" [class.active]="role==='student'" (click)="role='student'">
                    <span class="role-icon">👨‍🎓</span>
                    <span class="role-label">Étudiant</span>
                  </button>
                  <button type="button" class="role-btn" [class.active]="role==='teacher'" (click)="role='teacher'">
                    <span class="role-icon">👨‍🏫</span>
                    <span class="role-label">Enseignant</span>
                  </button>
                </div>
              </div>

              <div class="field cv-field" *ngIf="role === 'teacher'">
                <label>CV <span class="badge-required">obligatoire</span></label>
                <div class="cv-upload" (click)="cvInput.click()" [class.has-file]="cvFile">
                  <div class="cv-inner">
                    <svg *ngIf="!cvFile" viewBox="0 0 24 24" fill="none" width="28"><path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="#4A90D9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="3" width="18" height="18" rx="4" stroke="#4A90D9" stroke-width="1.5"/></svg>
                    <svg *ngIf="cvFile" viewBox="0 0 24 24" fill="none" width="28"><circle cx="12" cy="12" r="9" fill="#dcfce7"/><path d="M8 12l2.5 2.5L16 9" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span *ngIf="!cvFile" class="cv-text">Cliquez pour uploader votre CV<br><small>PDF, DOC, DOCX — max 5 MB</small></span>
                    <span *ngIf="cvFile" class="file-name">📄 {{ cvFile.name }}</span>
                  </div>
                </div>
                <input #cvInput type="file" accept=".pdf,.doc,.docx" (change)="onCvChange($event)" style="display:none"/>
                <p class="cv-hint">⚠️ Votre CV sera examiné par l'administrateur avant activation.</p>
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
    .illus-card p { color:#64748b; font-size:.95rem; line-height:1.7; margin-bottom:1.5rem; }
    .stats { display:flex; align-items:center; justify-content:center; gap:1.25rem; }
    .stat { display:flex; flex-direction:column; align-items:center; }
    .stat-num { font-size:1.2rem; font-weight:800; color:#1E3A5F; }
    .stat-label { font-size:.75rem; color:#64748b; }
    .stat-div { width:1px; height:30px; background:#cbd5e1; }
    .form-side { flex:0 0 500px; display:flex; align-items:center; justify-content:center; padding:2rem; overflow-y:auto; }
    .form-card { background:white; border-radius:20px; box-shadow:0 8px 40px rgba(30,58,95,.10); padding:2.5rem; width:100%; max-width:440px; }
    .brand { text-align:center; font-size:1.25rem; font-weight:800; color:#1E3A5F; margin-bottom:.4rem; }
    .brand span { color:#4A90D9; }
    h3 { text-align:center; font-size:1.6rem; color:#1E3A5F; font-weight:700; margin-bottom:.2rem; }
    .sub { text-align:center; color:#64748b; font-size:.88rem; margin-bottom:1.5rem; }
    .field { margin-bottom:1rem; }
    label { display:flex; align-items:center; gap:.35rem; font-size:.82rem; font-weight:600; color:#374151; margin-bottom:.4rem; }
    .badge-required { background:#fef2f2; color:#ef4444; border:1px solid #fecaca; font-size:.68rem; padding:1px 7px; border-radius:10px; font-weight:600; }
    .input-wrap { position:relative; display:flex; align-items:center; }
    .ico { position:absolute; left:.85rem; width:17px; height:17px; flex-shrink:0; }
    .input-wrap input { width:100%; padding:.78rem .78rem .78rem 2.6rem; border:1.5px solid #e2e8f0; border-radius:10px; font-size:.92rem; outline:none; transition:border-color .2s,box-shadow .2s; background:#f8fafc; color:#1e293b; }
    .input-wrap input:focus { border-color:#4A90D9; box-shadow:0 0 0 3px rgba(74,144,217,.12); background:white; }
    .eye { position:absolute; right:.75rem; background:none; border:none; cursor:pointer; padding:0; display:flex; opacity:.5; transition:opacity .2s; }
    .eye:hover { opacity:1; }
    .role-toggle { display:flex; gap:.75rem; }
    .role-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:.3rem; padding:.75rem; border:1.5px solid #e2e8f0; border-radius:10px; background:#f8fafc; cursor:pointer; transition:all .2s; }
    .role-btn:hover { border-color:#4A90D9; background:#eff6ff; }
    .role-btn.active { border-color:#4A90D9; background:#eff6ff; box-shadow:0 0 0 3px rgba(74,144,217,.12); }
    .role-icon { font-size:1.4rem; }
    .role-label { font-size:.8rem; font-weight:600; color:#374151; }
    .role-btn.active .role-label { color:#1E3A5F; }
    .strength-wrap { margin:.5rem 0 .2rem; }
    .strength-bars { display:flex; gap:4px; margin-bottom:.4rem; }
    .bar { flex:1; height:4px; border-radius:2px; background:#e2e8f0; transition:background .3s; }
    .bar.active.weak { background:#ef4444; }
    .bar.active.medium { background:#f59e0b; }
    .bar.active.strong { background:#10b981; }
    .strength-checks { display:flex; flex-direction:column; gap:.2rem; }
    .strength-checks span { font-size:.76rem; color:#94a3b8; }
    .strength-checks span.ok { color:#10b981; }
    .match-hint { margin-top:.4rem; font-size:.76rem; }
    .match-ok { color:#10b981; }
    .match-no { color:#ef4444; }
    .cv-upload { border:1.5px dashed #cbd5e1; border-radius:10px; padding:1.2rem; text-align:center; cursor:pointer; transition:all .2s; background:#f8fafc; }
    .cv-upload:hover { border-color:#4A90D9; background:#eff6ff; }
    .cv-upload.has-file { border-color:#10b981; border-style:solid; background:#f0fdf4; }
    .cv-inner { display:flex; flex-direction:column; align-items:center; gap:.35rem; }
    .cv-text { color:#64748b; font-size:.85rem; line-height:1.5; }
    .cv-inner small { color:#94a3b8; font-size:.78rem; }
    .file-name { color:#10b981; font-weight:700; font-size:.88rem; }
    .cv-hint { font-size:.75rem; color:#f59e0b; margin-top:.4rem; line-height:1.4; }
    .error-box { display:flex; align-items:center; gap:.5rem; background:#fef2f2; border:1px solid #fecaca; color:#ef4444; padding:.65rem .85rem; border-radius:8px; font-size:.85rem; margin-bottom:1rem; }
    .btn-submit { width:100%; padding:.9rem; margin-top:.5rem; background:#4A90D9; color:white; border:none; border-radius:10px; font-size:1rem; font-weight:600; cursor:pointer; transition:background .2s,transform .1s; display:flex; align-items:center; justify-content:center; min-height:48px; }
    .btn-submit:hover:not(:disabled) { background:#1E3A5F; transform:translateY(-1px); }
    .btn-submit:disabled { opacity:.6; cursor:not-allowed; }
    .spinner { width:20px; height:20px; border:2px solid rgba(255,255,255,.4); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .switch { text-align:center; margin-top:1.25rem; color:#64748b; font-size:.88rem; }
    .switch a { color:#4A90D9; font-weight:600; text-decoration:none; }
    .switch a:hover { color:#1E3A5F; }
    .popup-overlay { position:fixed; inset:0; background:rgba(15,37,68,.55); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); animation:fadeIn .2s; }
    .popup-box { background:white; border-radius:20px; padding:2.5rem 2rem; max-width:380px; width:90%; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,.2); animation:slideUp .3s cubic-bezier(.34,1.56,.64,1); }
    .popup-icon { font-size:3rem; margin-bottom:.75rem; }
    .popup-box h3 { color:#1E3A5F; font-size:1.3rem; font-weight:700; margin-bottom:.6rem; }
    .popup-box p { color:#64748b; font-size:.92rem; line-height:1.65; margin-bottom:1.75rem; }
    .popup-btn { background:#4A90D9; color:white; border:none; border-radius:10px; padding:.8rem 2rem; font-size:.95rem; font-weight:600; cursor:pointer; }
    .popup-btn:hover { background:#1E3A5F; }
    .popup-steps { display:flex; flex-direction:column; gap:.75rem; margin-bottom:1.75rem; text-align:left; }
    .step { display:flex; align-items:center; gap:.75rem; background:#f8fafc; border-radius:10px; padding:.65rem 1rem; }
    .step-icon { font-size:1.2rem; }
    .step span:last-child { font-size:.88rem; color:#374151; font-weight:500; }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { transform:translateY(30px) scale(.96); opacity:0 } to { transform:translateY(0) scale(1); opacity:1 } }
    @media(max-width:900px) { .illus-side { display:none; } .form-side { flex:1; } }
    @media(max-width:480px) { .form-card { padding:1.75rem 1.25rem; } }
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
  successMsg = '';
  has6Chars = false;
  hasUpper = false;
  hasDigit = false;
  pwStrength = 0;

  constructor(private auth: AuthService, private router: Router) {}

  checkStrength(pw: string) {
    this.has6Chars = pw.length >= 6;
    this.hasUpper = /[A-Z]/.test(pw);
    this.hasDigit = /[0-9]/.test(pw);
    this.pwStrength = [this.has6Chars, this.hasUpper, this.hasDigit].filter(Boolean).length;
  }

  onCvChange(event: any) {
    const file = event.target.files[0];
    if (file) this.cvFile = file;
  }

  goToLogin() {
    this.successMsg = '';
    this.router.navigate(['/login']);
  }

  onSubmit() {
    this.error = '';
    this.successMsg = '';
    if (!this.name.trim()) { this.error = 'Le nom est obligatoire.'; return; }
    if (!this.email.trim()) { this.error = "L'email est obligatoire."; return; }
    if (this.password.length < 6) { this.error = 'Le mot de passe doit contenir au moins 6 caractères.'; return; }
    if (this.password !== this.password_confirmation) { this.error = 'Les mots de passe ne correspondent pas.'; return; }
    if (this.role === 'teacher' && !this.cvFile) { this.error = "Veuillez uploader votre CV pour vous inscrire en tant qu'enseignant."; return; }
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
        this.successMsg = this.role === 'teacher'
          ? "Vérifiez votre email puis attendez l'approbation de l'administrateur."
          : 'Vérifiez votre email pour activer votre compte.';
        this.loading = false;
        this.name = ''; this.email = ''; this.password = ''; this.password_confirmation = ''; this.cvFile = null;
      },
      error: (err) => {
        this.error = err.error?.email?.[0] || err.error?.message || "Erreur lors de l'inscription.";
        this.loading = false;
      }
    });
  }
}
