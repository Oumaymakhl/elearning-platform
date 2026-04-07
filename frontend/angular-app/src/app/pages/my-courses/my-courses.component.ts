import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../services/course.service';
 
@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.scss']
})
export class MyCoursesComponent implements OnInit {
  enrollments: any[] = [];
  loading = true;
  filter  = 'all';
 
  constructor(private courseService: CourseService) {}
 
  ngOnInit() {
    this.courseService.myCourses().subscribe({
      next: (data) => {
        this.enrollments = data.map((e: any) => ({
          ...e,
          percentage: Math.round(parseFloat(e.progress || 0))
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
 
  get filtered(): any[] {
    if (this.filter === 'all')         return this.enrollments;
    if (this.filter === 'completed')   return this.enrollments.filter(e => e.percentage === 100);
    if (this.filter === 'not_started') return this.enrollments.filter(e => e.percentage === 0);
    if (this.filter === 'active')      return this.enrollments.filter(e => e.percentage > 0 && e.percentage < 100);
    return this.enrollments;
  }
 
  get completedCount()  { return this.enrollments.filter(e => e.percentage === 100).length; }
  get activeCount()     { return this.enrollments.filter(e => e.percentage > 0 && e.percentage < 100).length; }
  get notStartedCount() { return this.enrollments.filter(e => e.percentage === 0).length; }
  get avgProgress() {
    if (!this.enrollments.length) return 0;
    return Math.round(this.enrollments.reduce((s, e) => s + e.percentage, 0) / this.enrollments.length);
  }
 
  setFilter(f: string) { this.filter = f; }
 
  getStatusLabel(status: string): string {
    const l: Record<string,string> = { active:'En cours', completed:'Terminé', abandoned:'Abandonné' };
    return l[status] || status;
  }
  getStatusClass(status: string): string {
    const c: Record<string,string> = { active:'status-active', completed:'status-completed', abandoned:'status-abandoned' };
    return 'cover-badge ' + (c[status] || '');
  }
  formatLevel(level: string): string {
    const m: Record<string,string> = { debutant:'Débutant', intermediaire:'Intermédiaire', avance:'Avancé' };
    return m[level] ?? level;
  }
}
