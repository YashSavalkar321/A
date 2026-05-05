// Application models matching the Korth University schema

export interface Classroom { building: string; room_number: string; capacity: number; }
export interface Department { dept_name: string; building: string; budget: number; }
export interface Course { course_id: string; title: string; dept_name: string; credits: number; }
export interface Instructor { id: string; name: string; dept_name: string; salary: number; }
export interface TimeSlot { time_slot_id: string; day: string; start_time: string; end_time: string; }
export interface Section { course_id: string; sec_id: string; semester: string; year: number; building: string; room_number: string; time_slot_id: string; }
export interface Teaches { id: string; course_id: string; sec_id: string; semester: string; year: number; }
export interface Student { id: string; name: string; dept_name: string; tot_cred: number; address?: string; mobile_no?: string; }
export interface Takes { id: string; course_id: string; sec_id: string; semester: string; year: number; grade: string; }
export interface Advisor { s_id: string; i_id: string; student_name?: string; instructor_name?: string; }
export interface Prereq { course_id: string; prereq_id: string; course_title?: string; prereq_title?: string; }
export interface AppUser { id: number; username: string; role: string; profile_id?: string | null; created_at?: string; }
export interface AuthResponse { token: string; user: AppUser; permissions: RolePermissions; }
export interface ReportResult { columns: string[]; rows: any[]; }
export interface DashboardStats { students: number; instructors: number; courses: number; departments: number; }

// RBAC Models
export interface PermissionSet { read: boolean; create: boolean; update: boolean; delete: boolean; }
export interface RolePermissions { [resource: string]: PermissionSet; }
export interface Role { id: number; name: string; description: string; is_system: boolean; user_count: number; created_at: string; }
export interface RolePermissionRow { id: number; role_id: number; resource: string; can_read: boolean; can_create: boolean; can_update: boolean; can_delete: boolean; [key: string]: any; }

// ── Role-Based Dashboard Models ────────────────────────────────────────────

export interface AdminDashboardData {
  kpis: {
    total_students: number;
    total_instructors: number;
    total_courses: number;
    total_departments: number;
    total_sections: number;
    total_users: number;
  };
  deptStudentDistribution: { dept_name: string; student_count: number }[];
  coursePopularity: { course_id: string; title: string; dept_name: string; enrollment_count: number }[];
  deptEnrollment: { dept_name: string; enrolled_students: number }[];
  recentEnrollments: { student_name: string; course_title: string; semester: string; year: number; grade: string }[];
}

export interface ScheduleEntry {
  course_id: string; course_title: string; credits: number;
  sec_id: string; semester: string; year: number;
  building: string; room_number: string;
  time_slot_id: string; day: string; start_time: string; end_time: string;
}

export interface FacultyDashboardData {
  profile: Instructor;
  schedule: ScheduleEntry[];
  studentRoster: {
    student_id: string; student_name: string; dept_name: string;
    course_id: string; course_title: string;
    sec_id: string; semester: string; year: number; grade: string;
  }[];
  advisees: { student_id: string; student_name: string; dept_name: string; tot_cred: number; address?: string; mobile_no?: string }[];
  gradeableSections: {
    course_id: string; course_title: string;
    sec_id: string; semester: string; year: number; student_count: number;
  }[];
}

export interface MarksheetEntry {
  course_id: string; course_title: string; credits: number; dept_name: string;
  sec_id: string; semester: string; year: number; grade: string | null;
}

export interface StudentDashboardData {
  profile: Student;
  timetable: ScheduleEntry[];
  marksheet: MarksheetEntry[];
  advisor: { advisor_id: string; advisor_name: string; dept_name: string } | null;
  currentEnrollments: ScheduleEntry[];
  academicProgress: {
    completedCredits: number;
    totalCreditsRequired: number;
    progressPercent: number;
    totalCoursesTaken: number;
    coursesCompleted: number;
    coursesInProgress: number;
  };
}
