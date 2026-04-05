import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  editMode = false;
  saving = false;
  success = false;
  form: any = {};

  // Avatar
  avatarPreview: string | null = null;
  avatarFile: File | null = null;
  uploadingAvatar = false;
  avatarError = '';

  private readonly USER_API = 'http://localhost:8001/api';

  constructor(private auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.auth.currentUser$.subscribe(u => {
      if (u) {
        this.user = u;
        this.form = { name: u.name, bio: u.bio || '', speciality: u.speciality || '' };
      }
    });
    this.http.get(`${this.USER_API}/me`, { headers: this.headers() }).subscribe({
      next: (u: any) => {
        this.user = { ...this.user, ...u };
        this.form = { name: u.name, bio: u.bio || '', speciality: u.speciality || '' };
      },
      error: () => {}
    });
  }

  // ── Avatar ────────────────────────────────────────────────────────────────

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.avatarError = '';

    // Validation taille (2 Mo max)
    if (file.size > 2 * 1024 * 1024) {
      this.avatarError = 'Image trop grande (max 2 Mo)';
      return;
    }

    // Validation type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.avatarError = 'Format non supporté (jpg, png, webp uniquement)';
      return;
    }

    this.avatarFile = file;

    // Prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  uploadAvatar(): void {
    if (!this.avatarFile || this.uploadingAvatar) return;
    this.uploadingAvatar = true;
    this.avatarError = '';

    const formData = new FormData();
    formData.append('avatar', this.avatarFile);

    this.http.post<any>(`${this.USER_API}/me/avatar`, formData, { headers: this.headersNoContent() }).subscribe({
      next: (res) => {
        this.user = { ...this.user, avatar_url: res.avatar_url };
        this.avatarPreview = null;
        this.avatarFile = null;
        this.uploadingAvatar = false;
        this.success = true;
        setTimeout(() => (this.success = false), 3000);
      },
      error: (e) => {
        this.avatarError = e.error?.message || 'Erreur upload';
        this.uploadingAvatar = false;
      }
    });
  }

  cancelAvatarPreview(): void {
    this.avatarPreview = null;
    this.avatarFile = null;
    this.avatarError = '';
  }

  // ── Profil ────────────────────────────────────────────────────────────────

  saveProfile(): void {
    this.saving = true;
    this.http.put(`${this.USER_API}/me`, this.form, { headers: this.headers() }).subscribe({
      next: (u: any) => {
        this.user = { ...this.user, ...u };
        this.saving = false;
        this.editMode = false;
        this.success = true;
        setTimeout(() => (this.success = false), 3000);
      },
      error: () => { this.saving = false; }
    });
  }

  getRoleLabel(): string {
    const labels: Record<string, string> = {
      admin:   '⚙️ Administrateur',
      teacher: '👨‍🏫 Formateur',
      student: '🎓 Étudiant',
    };
    return labels[this.user?.role] || this.user?.role;
  }

  getInitials(): string {
    return (this.user?.name || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // Pour FormData, ne pas mettre Content-Type (le browser le gère)
  private headersNoContent(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
