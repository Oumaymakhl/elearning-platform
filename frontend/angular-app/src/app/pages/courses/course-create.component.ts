import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-course-create',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './course-create.component.html',
  styleUrls: ['./course-create.component.scss']
})
export class CourseCreateComponent {
  form: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private courseService: CourseService, private router: Router) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      level: ['beginner']
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.courseService.createCourse(this.form.value).subscribe({
      next: (course) => {
        this.success = 'Cours créé avec succès !';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/courses', course.id]), 1500);
      },
      error: (e) => { this.error = e.error?.message || 'Erreur lors de la création'; this.loading = false; }
    });
  }
}
