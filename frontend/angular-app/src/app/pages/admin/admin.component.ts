import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  stats: any = null;
  adminStats: any = null;
  users: any[] = [];
  loading = true;
  activeTab = 'stats';

  constructor(private http: HttpClient, private auth: AuthService) {}

  get isAdmin() { return this.auth.isAdmin(); }

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
  }

  loadStats() {
    this.http.get('/api/admin/stats').subscribe({
      next: (s) => { this.stats = s; this.adminStats = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadUsers() {
    this.http.get<any[]>('/api/admin/users').subscribe({
      next: (res: any) => { this.users = res.data || res; },
      error: () => {}
    });
  }

  changeRole(userId: number, role: string) {
    this.http.put(`/api/admin/users/${userId}`, { role }).subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) user.role = role;
      },
      error: (e) => { alert(e.error?.message || 'Erreur'); }
    });
  }

  deleteUser(userId: number) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    this.http.delete(`/api/admin/users/${userId}`).subscribe({
      next: () => { this.users = this.users.filter(u => u.id !== userId); },
      error: (e) => { alert(e.error?.message || 'Erreur'); }
    });
  }

  editUser: any = null;

  openEdit(user: any) {
    this.editUser = { ...user };
  }

  closeEdit() {
    this.editUser = null;
  }

  saveEdit() {
    this.http.put(`/api/admin/users/${this.editUser.id}`, {
      name: this.editUser.name,
      email: this.editUser.email,
      role: this.editUser.role
    }).subscribe({
      next: () => {
        const idx = this.users.findIndex(u => u.id === this.editUser.id);
        if (idx !== -1) this.users[idx] = { ...this.users[idx], ...this.editUser };
        this.closeEdit();
      },
      error: (e) => { alert(e.error?.message || 'Erreur'); }
    });
  }

  getRoleClass(role: string): string {
    const classes: Record<string, string> = { admin: 'role-admin', teacher: 'role-teacher', student: 'role-student' };
    return classes[role] || '';
  }
}
