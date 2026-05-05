import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Student {
  id: string;
  name: string;
  email: string;
  course: string;
  created_at?: string;
}

export type DbType = 'mongo' | 'cassandra';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private baseUrl = 'http://localhost:3100/api';

  constructor(private http: HttpClient) {}

  getStudents(db: DbType): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}/${db}/students`);
  }

  createStudent(db: DbType, data: Omit<Student, 'id'>): Observable<Student> {
    return this.http.post<Student>(`${this.baseUrl}/${db}/students`, data);
  }

  updateStudent(db: DbType, id: string, data: Omit<Student, 'id'>): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/${db}/students/${id}`, data);
  }

  deleteStudent(db: DbType, id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(`${this.baseUrl}/${db}/students/${id}`);
  }
}
