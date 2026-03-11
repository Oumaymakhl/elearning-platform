import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  course: any;
  chapters: any[] = [];
  enrolled = false;
  progress: any;

  get isStudent() { return this.auth.isStudent(); }
  get isTeacher() { return this.auth.isTeacher(); }
  get isAdmin() { return this.auth.isAdmin(); }

  constructor(private route: ActivatedRoute, private courseService: CourseService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.courseService.getCourse(id).subscribe({
      next: (course) => {
        this.course = course;
        this.chapters = (course.chapters || []).map((c: any) => ({ ...c, expanded: false, sub_chapters: c.sub_chapters || c.subChapters || [] }));
      }
    });
    if (this.isStudent) {
      this.courseService.getProgress(id).subscribe({
        next: (p) => { this.progress = p; this.enrolled = true; },
        error: () => {}
      });
    }
  }

  deleteCourse() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;
    this.courseService.deleteCourse(this.course.id).subscribe({
      next: () => { this.router.navigate(['/courses']); },
      error: (e) => { alert('Erreur : ' + (e.error?.message || 'Suppression échouée')); }
    });
  }

  enroll() {
    this.courseService.enroll(this.course.id).subscribe({ next: () => { this.enrolled = true; } });
  }

  unenroll() {
    this.courseService.unenroll(this.course.id).subscribe({ next: () => { this.enrolled = false; } });
  }
}
