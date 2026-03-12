import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

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

  constructor(private auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.auth.currentUser$.subscribe(u => { if(u) { this.user = u; this.form = { name: u.name, bio: u.bio || '', speciality: u.speciality || '' }; } });
    // Charger profil complet depuis user-service
    this.http.get('http://localhost:8001/api/me').subscribe({
      next: (u: any) => {
        this.user = { ...this.user, ...u };
        this.form = { name: u.name, bio: u.bio || '', speciality: u.speciality || '' };
      },
      error: () => {}
    });
  }

  saveProfile() {
    this.saving = true;
    this.http.put('http://localhost:8001/api/me', this.form).subscribe({
      next: (u: any) => {
        this.user = { ...this.user, ...u };
        this.saving = false;
        this.editMode = false;
        this.success = true;
        setTimeout(() => this.success = false, 3000);
      },
      error: () => { this.saving = false; }
    });
  }

  getRoleLabel(): string {
    const labels: Record<string, string> = { admin: '⚙️ Administrateur', teacher: '👨‍🏫 Formateur', student: '🎓 Étudiant' };
    return labels[this.user?.role] || this.user?.role;
  }

  getInitials(): string {
    return (this.user?.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
