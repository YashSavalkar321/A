import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Question, QuestionFilter, Exam, StudentExam, StudentAnswer,
  DashboardData, ExamReport, Course, MonitorEntry, AdminUser
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api';

  // ── Questions ────────────────────────────────────────────────────────────
  getQuestions(filter?: QuestionFilter) {
    let params = new HttpParams();
    if (filter?.courseId)   params = params.set('courseId',   filter.courseId.toString());
    if (filter?.difficulty) params = params.set('difficulty', filter.difficulty);
    if (filter?.subject)    params = params.set('subject',    filter.subject);
    if (filter?.topic)      params = params.set('topic',      filter.topic);
    if (filter?.search)     params = params.set('search',     filter.search);
    return this.http.get<Question[]>(`${this.base}/questions`, { params });
  }

  getQuestion(id: number)               { return this.http.get<Question>(`${this.base}/questions/${id}`); }
  createQuestion(data: FormData)         { return this.http.post<{ id: number }>(`${this.base}/questions`, data); }
  updateQuestion(id: number, d: FormData){ return this.http.put<{ message: string }>(`${this.base}/questions/${id}`, d); }
  deleteQuestion(id: number)             { return this.http.delete<{ message: string }>(`${this.base}/questions/${id}`); }
  getCourses()                           { return this.http.get<Course[]>(`${this.base}/questions/courses/list`); }

  // ── Exams ────────────────────────────────────────────────────────────────
  getExams()             { return this.http.get<Exam[]>(`${this.base}/exams`); }
  getExam(id: number)    { return this.http.get<Exam>(`${this.base}/exams/${id}`); }
  createExam(data: Partial<Exam> & { questionIds?: number[] })            { return this.http.post<{ id: number }>(`${this.base}/exams`, data); }
  updateExam(id: number, data: Partial<Exam> & { questionIds?: number[] }){ return this.http.put<{ message: string }>(`${this.base}/exams/${id}`, data); }
  deleteExam(id: number) { return this.http.delete<{ message: string }>(`${this.base}/exams/${id}`); }
  monitorExam(id: number)     { return this.http.get<any>(`${this.base}/exams/${id}/monitor`); }
  togglePublishExam(id: number) { return this.http.patch<{ id: number; is_published: boolean }>(`${this.base}/exams/${id}/publish`, {}); }

  // ── Student Exams ────────────────────────────────────────────────────────
  getAvailableExams()                  { return this.http.get<StudentExam[]>(`${this.base}/student-exams/available`); }
  startExam(examId: number)            { return this.http.post<any>(`${this.base}/student-exams/start/${examId}`, {}); }
  getExamQuestions(seId: number)       { return this.http.get<{ exam: StudentExam; questions: any[] }>(`${this.base}/student-exams/${seId}/questions`); }
  saveAnswer(seId: number, questionId: number, optionId: number) { return this.http.post<{ message: string }>(`${this.base}/student-exams/${seId}/answer`, { questionId, selectedOptionId: optionId }); }
  submitExam(seId: number)             { return this.http.post<{ message: string; score: number }>(`${this.base}/student-exams/${seId}/submit`, {}); }
  getExamResult(seId: number)          { return this.http.get<any>(`${this.base}/student-exams/${seId}/result`); }

  // ── Dashboard ────────────────────────────────────────────────────────────
  getDashboard() { return this.http.get<DashboardData>(`${this.base}/dashboard`); }

  // ── Reports ──────────────────────────────────────────────────────────────
  getExamReport(examId: number)      { return this.http.get<ExamReport>(`${this.base}/reports/exam/${examId}`); }
  getStudentReport(studentId: number){ return this.http.get<StudentExam[]>(`${this.base}/reports/student/${studentId}`); }
  getExamsSummary()                  { return this.http.get<any[]>(`${this.base}/reports/exams/summary`); }

  // ── Users (Admin) ─────────────────────────────────────────────────────────
  getUsers()             { return this.http.get<AdminUser[]>(`${this.base}/auth/users`); }
  toggleUserStatus(id: number) { return this.http.patch<{ id: number; is_active: boolean }>(`${this.base}/auth/users/${id}/toggle`, {}); }
}
