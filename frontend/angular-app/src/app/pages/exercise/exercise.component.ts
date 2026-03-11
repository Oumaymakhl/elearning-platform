import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExerciseService } from '../../services/exercise.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exercise',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './exercise.component.html',
  styleUrls: ['./exercise.component.scss']
})
export class ExerciseComponent implements OnInit {
  exercise: any;
  questions: any[] = [];
  currentQuestion: any = null;
  code = '';
  language = 'python';
  result: any = null;
  loading = true;
  submitting = false;
  submissions: any[] = [];
  languages = [
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'php', label: 'PHP' },
    { value: 'node', label: 'JavaScript' }
  ];

  get isTeacher() { return this.auth.isTeacher(); }
  get isAdmin() { return this.auth.isAdmin(); }

  constructor(private route: ActivatedRoute, private exerciseService: ExerciseService, private auth: AuthService) {}

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.exerciseService.getExercise(id).subscribe({
      next: (exercise) => {
        this.exercise = exercise;
        this.loading = false;
      }
    });
    this.exerciseService.getQuestions(id).subscribe({
      next: (questions) => {
        this.questions = questions;
        if (questions.length > 0) this.selectQuestion(questions[0]);
      }
    });
  }

  selectQuestion(question: any) {
    this.currentQuestion = question;
    this.code = question.template_code || '';
    this.result = null;
    this.submissions = [];
    this.loadSubmissions();
  }

  loadSubmissions() {
    if (!this.currentQuestion) return;
    this.exerciseService.mySubmissions(this.exercise.id, this.currentQuestion.id).subscribe({
      next: (subs) => { this.submissions = subs; },
      error: () => {}
    });
  }

  submit() {
    if (!this.code.trim() || this.submitting) return;
    this.submitting = true;
    this.result = null;
    this.exerciseService.submitCode(this.exercise.id, this.currentQuestion.id, this.code, this.language).subscribe({
      next: (res) => { this.result = res; this.submitting = false; this.loadSubmissions(); },
      error: () => { this.submitting = false; }
    });
  }

  getTestClass(test: any): string {
    return test.passed ? 'test-pass' : 'test-fail';
  }
}
