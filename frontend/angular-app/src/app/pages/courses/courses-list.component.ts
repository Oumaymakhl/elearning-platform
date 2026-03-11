import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './courses-list.component.html',
  styleUrls: ['./courses-list.component.scss']
})
export class CoursesListComponent implements OnInit {
  courses: any[] = [];
  filteredCourses: any[] = [];
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

  filterCourses() {
    this.filteredCourses = this.courses.filter(c =>
      c.title.toLowerCase().includes(this.search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(this.search.toLowerCase())
    );
  }
}
