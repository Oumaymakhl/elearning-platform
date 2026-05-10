import { ConfirmService } from '../../services/confirm.service';
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

  activeTab: 'dashboard' | 'users' = 'dashboard';

  stats: any = null;
  statsLoading = true;
  statsError = false;

  users: any[] = [];
  selectedRole: string = 'all';
  searchQuery: string = '';

  get filteredUsers(): any[] {
    return this.users.filter(u => {
      const matchRole = this.selectedRole === 'all' || u.role === this.selectedRole;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private confirmSvc: ConfirmService
  ) {}

  get isAdmin() { return this.auth.isAdmin(); }

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
  }

  loadStats() {
    this.statsLoading = true;
    this.statsError = false;
    this.http.get<any>('/api/admin/stats').subscribe({
      next: (res) => { this.stats = res; this.statsLoading = false; },
      error: () => { this.statsError = true; this.statsLoading = false; }
    });
  }

  loadUsers() {
    this.http.get<any>('/api/admin/users').subscribe({
      next: (res: any) => { this.users = res.data || res; },
      error: () => {}
    });
  }

  get userStats() { return this.stats?.users || {}; }
  get courseStats() { return this.stats?.courses || {}; }
  get quizStats() { return this.stats?.quizzes || {}; }
  get recentUsers() { return this.stats?.users?.recent_users || []; }

  getActiveRate(): number {
    const total = this.userStats.total_users || 0;
    const active = this.userStats.active_users || 0;
    return total ? Math.round((active / total) * 100) : 0;
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

  async deleteUser(userId: number) {
    const ok = await this.confirmSvc.open({
      icon: '🗑️',
      title: 'Supprimer cet utilisateur ?',
      message: 'Cet utilisateur sera supprimé définitivement.',
      okLabel: 'Supprimer',
      okColor: '#e53e3e'
    });
    if (!ok) return;
    this.http.delete(`/api/admin/users/${userId}`).subscribe({
      next: () => { this.users = this.users.filter(u => u.id !== userId); },
      error: (e) => { alert(e.error?.message || 'Erreur'); }
    });
  }

  editUser: any = null;
  openEdit(user: any) { this.editUser = { ...user }; }
  closeEdit() { this.editUser = null; }

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

  toggleActive(user: any) {
    this.http.patch(`/api/admin/users/${user.id}/toggle`, {}).subscribe({
      next: (res: any) => {
        user.is_active = res.is_active;
        if (this.stats?.users) {
          this.stats.users.active_users = this.users.filter(u => u.is_active).length;
          this.stats.users.inactive_users = this.users.filter(u => !u.is_active).length;
        }
      },
      error: (e) => { alert(e.error?.message || 'Erreur'); }
    });
  }

  getRoleClass(role: string): string {
    const classes: Record<string, string> = { admin: 'role-admin', teacher: 'role-teacher', student: 'role-student' };
    return classes[role] || '';
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = { admin: 'Admin', teacher: 'Formateur', student: 'Étudiant' };
    return labels[role] || role;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
