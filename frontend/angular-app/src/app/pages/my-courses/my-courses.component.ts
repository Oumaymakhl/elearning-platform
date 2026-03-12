import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

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

  constructor(private courseService: CourseService, private auth: AuthService) {}

  ngOnInit() {
    this.courseService.myCourses().subscribe({
      next: (data) => {
        this.enrollments = data.map((e: any) => ({
          ...e,
          course: e.course,
          percentage: parseFloat(e.progress || 0)
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'En cours',
      completed: 'Terminé',
      abandoned: 'Abandonné'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'status-active',
      completed: 'status-completed',
      abandoned: 'status-abandoned'
    };
    return classes[status] || '';
  }
}
