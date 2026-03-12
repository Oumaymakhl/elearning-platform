import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, FormsModule],
  templateUrl: './courses-list.component.html',
  styleUrls: ['./courses-list.component.scss']
})
export class CoursesListComponent implements OnInit {
  courses: any[] = [];
  filteredCourses: any[] = [];
  searchTerm = '';
  selectedLevel = '';
  search = '';
  loading = true;

  get isStudent() { return this.auth.isStudent(); }
  get isTeacher() { return this.auth.isTeacher(); }
  get isAdmin() { return this.auth.isAdmin(); }

  constructor(private courseService: CourseService, private auth: AuthService) {}

  ngOnInit() {
    this.courseService.getCourses().subscribe({
      next: (courses) => { this.courses = courses; this.filteredCourses = courses; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  deleteCourse(id: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm('Supprimer ce cours ?')) return;
    this.courseService.deleteCourse(id).subscribe({
      next: () => {
        this.courses = this.courses.filter(c => c.id !== id);
        this.filteredCourses = this.filteredCourses.filter(c => c.id !== id);
      },
      error: (e) => { alert('Erreur : ' + (e.error?.message || 'Suppression échouée')); }
    });
  }

  filterByLevel(level: string) {
    this.selectedLevel = level;
    this.filterCourses();
  }

  getCourseColor(id: number): string {
    const colors = [
      'linear-gradient(135deg,#1E3A5F,#4A90D9)',
      'linear-gradient(135deg,#2d6a4f,#52b788)',
      'linear-gradient(135deg,#6a0572,#ab47bc)',
      'linear-gradient(135deg,#b5451b,#e57c23)',
      'linear-gradient(135deg,#0f3460,#533483)',
    ];
    return colors[id % colors.length];
  }

  getCourseIcon(title: string): string {
    const t = title.toLowerCase();
    if (t.includes('python')) return '🐍';
    if (t.includes('java')) return '☕';
    if (t.includes('web') || t.includes('html')) return '🌐';
    if (t.includes('data') || t.includes('ml')) return '🤖';
    if (t.includes('mobile') || t.includes('flutter')) return '📱';
    return '📘';
  }

  filterCourses() {
    this.filteredCourses = this.courses.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchLevel = this.selectedLevel === '' || c.level === this.selectedLevel;
      return matchSearch && matchLevel;
    });
  }
}
