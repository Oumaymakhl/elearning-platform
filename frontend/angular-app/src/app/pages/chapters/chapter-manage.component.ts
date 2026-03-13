import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { RichEditorComponent } from '../../shared/rich-editor/rich-editor.component';

@Component({
  selector: 'app-chapter-manage',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink, ReactiveFormsModule, RichEditorComponent],
  templateUrl: './chapter-manage.component.html',
  styleUrls: ['./chapter-manage.component.scss']
})
export class ChapterManageComponent implements OnInit {
  course: any;
  chapters: any[] = [];
  loading = true;
  showChapterForm = false;
  showSubForm: Record<number, boolean> = {};
  chapterForm: FormGroup;
  subForms: Record<number, FormGroup> = {};
  saving = false;
  showQuiz: Record<number, boolean> = {};
  error = '';
  showCourseEdit = false;
  courseForm!: FormGroup;
  savingCourse = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {
    this.chapterForm = this.fb.group({
      title: ['', Validators.required],
      objective: ['']
    });
  }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.courseService.getCourse(id).subscribe({
      next: (course) => {
        this.course = course;
        this.chapters = course.chapters || [];
        this.courseForm = this.fb.group({
          title: [course.title, Validators.required],
          description: [course.description || ''],
          level: [course.level || 'debutant']
        });
        this.chapters.forEach(ch => {
          this.subForms[ch.id] = this.fb.group({
            title: ['', Validators.required],
            content: [''],
            is_lab: [false]
          });
        });
        this.loading = false;
      }
    });
  }

  addChapter() {
    if (this.chapterForm.invalid || this.saving) return;
    this.saving = true;
    this.courseService.createChapter(this.course.id, this.chapterForm.value).subscribe({
      next: (chapter) => {
        chapter.sub_chapters = [];
        this.chapters.push(chapter);
        this.subForms[chapter.id] = this.fb.group({
          title: ['', Validators.required],
          content: [''],
          is_lab: [false],
          quiz_id: [null],
          passing_score: [70]
        });
        this.chapterForm.reset();
        this.showChapterForm = false;
        this.saving = false;
      },
      error: () => { this.saving = false; }
    });
  }

  addSubChapter(chapterId: number) {
    const form = this.subForms[chapterId];
    if (!form || form.invalid || this.saving) return;
    this.saving = true;
    this.courseService.createSubChapter(this.course.id, chapterId, form.value).subscribe({
      next: (sub) => {
        const chapter = this.chapters.find(c => c.id === chapterId);
        if (chapter) {
          if (!chapter.subChapters) chapter.sub_chapters = [];
          chapter.sub_chapters.push(sub);
        }
        form.reset({ is_lab: false, passing_score: 70 });
        this.showSubForm[chapterId] = false;
        this.saving = false;
      },
      error: () => { this.saving = false; }
    });
  }

  deleteChapter(chapterId: number) {
    if (!confirm('Supprimer ce chapitre ?')) return;
    this.courseService.deleteChapter(this.course.id, chapterId).subscribe({
      next: () => { this.chapters = this.chapters.filter(c => c.id !== chapterId); },
      error: (e) => { alert(e.error?.message || 'Erreur'); }
    });
  }

  deleteSubChapter(chapterId: number, subId: number) {
    if (!confirm('Supprimer ce sous-chapitre ?')) return;
    this.courseService.deleteSubChapter(this.course.id, chapterId, subId).subscribe({
      next: () => {
        const chapter = this.chapters.find(c => c.id === chapterId);
        if (chapter) chapter.sub_chapters = chapter.sub_chapters.filter((s: any) => s.id !== subId);
      },
      error: (e) => { alert(e.error?.message || 'Erreur'); }
    });
  }

  toggleQuiz(chapterId: number, event: any): void {
    this.showQuiz[chapterId] = event.target.checked;
    if (!event.target.checked) {
      this.subForms[chapterId]?.patchValue({ quiz_id: null, passing_score: 70 });
    }
  }

  saveCourse() {
    if (this.courseForm.invalid) return;
    this.savingCourse = true;
    this.courseService.updateCourse(this.course.id, this.courseForm.value).subscribe({
      next: () => {
        this.course = { ...this.course, ...this.courseForm.value };
        this.savingCourse = false;
        this.showCourseEdit = false;
      },
      error: () => { this.savingCourse = false; }
    });
  }
}
