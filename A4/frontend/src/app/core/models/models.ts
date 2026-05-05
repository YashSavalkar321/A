// ─── Role / User ─────────────────────────────────────────────────────────────
export type Role       = 'ADMIN' | 'FACULTY' | 'STUDENT';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ExamType   = 'FIXED' | 'FLEXIBLE';
export type ExamStatus = 'ONGOING' | 'COMPLETED' | 'TERMINATED';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface LoginRequest   { email: string; password: string; }
export interface RegisterRequest { fullName: string; email: string; password: string; role: Role; }
export interface AuthResponse   { user: AuthUser; }

// ─── Questions ───────────────────────────────────────────────────────────────
export interface Option {
  id: number;
  text: string;
  image?: string | null;
  isCorrect?: boolean;
  order: number;
}

export interface Question {
  id: number;
  question_text: string;
  latex_expression?: string | null;
  question_image_path?: string | null;
  difficulty?: Difficulty | null;
  subject?: string | null;
  topic?: string | null;
  course_id?: number | null;
  course_name?: string | null;
  created_by_name?: string;
  created_at?: string;
  options: Option[];
}

export interface QuestionFilter {
  courseId?: number;
  difficulty?: Difficulty;
  subject?: string;
  topic?: string;
  search?: string;
}

// ─── Exams ───────────────────────────────────────────────────────────────────
export interface Exam {
  id: number;
  title: string;
  description?: string | null;
  course_name?: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  exam_type: ExamType;
  start_time?: string | null;
  end_time?: string | null;
  is_published: boolean;
  show_results: boolean;
  created_by_name?: string;
  created_at?: string;
  question_count?: number;
  questions?: ExamQuestion[];
}

export interface ExamQuestion extends Question {
  marks: number;
  question_order: number;
  selected_option_id?: number | null;
  marked_for_review?: boolean;
}

// ─── Student Exam ────────────────────────────────────────────────────────────
export interface StudentExam {
  id: number;
  exam_id: number;
  student_id?: number;
  status: ExamStatus;
  score?: number | null;
  start_time?: string;
  end_time?: string | null;
  title?: string;
  total_marks?: number;
  passing_marks?: number;
  show_results?: boolean;
  duration_minutes?: number;
  student_exam_id?: number | null;
  attempt_status?: ExamStatus | null;
  attempt_score?: number | null;
  question_count?: number;
}

export interface StudentAnswer {
  questionId: number;
  selectedOptionId: number | null;
  markedForReview?: boolean;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardData {
  // Admin
  totalUsers?: number;
  totalExams?: number;
  totalQuestions?: number;
  totalAttempts?: number;
  roleBreakdown?: { name: string; count: number }[];
  recentActivity?: { id: number; student: string; exam: string; score: number; end_time: string }[];
  // Faculty
  myExams?: { id: number; title: string; is_published: boolean; question_count: number; attempt_count: number; avg_score: number }[];
  myQuestionCount?: number;
  // Student
  myAttempts?: StudentExam[];
  stats?: { total: number; passed: number; avg_score: number };
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface ExamReport {
  exam: Exam;
  summary: { total: number; passed: number; failed: number; avg: number; max: number; min: number };
  students: { id: number; full_name: string; email: string; score: number; time_taken_minutes: number }[];
  questionAccuracy: { id: number; question_text: string; difficulty: string; total_attempts: number; correct_count: number; review_count: number }[];
}

// ─── Course ──────────────────────────────────────────────────────────────────
export interface Course {
  id: number;
  course_code: string;
  course_name: string;
}

// ─── Monitor ─────────────────────────────────────────────────────────────────
export interface MonitorEntry {
  id: number;
  full_name: string;
  email: string;
  status: ExamStatus;
  start_time: string;
  end_time?: string | null;
  score?: number | null;
  answered_count: number;
}

// ─── Admin Users ─────────────────────────────────────────────────────────────
export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}
