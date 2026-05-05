import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-takes',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class TakesComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('takes'); }
  get canCreatePerm() { return this.auth.canCreate('takes'); }
  get canUpdatePerm() { return this.auth.canUpdate('takes'); }
  get canDeletePerm() { return this.auth.canDelete('takes'); }
  config: EntityConfig = {
    title: 'Takes (Student Enrollment)', icon: 'assignment', apiEntity: 'takes',
    columns: [
      { key: 'id',        label: 'Student ID' },
      { key: 'course_id', label: 'Course ID' },
      { key: 'sec_id',    label: 'Sec ID' },
      { key: 'semester',  label: 'Semester', type: 'badge' },
      { key: 'year',      label: 'Year' },
      { key: 'grade',     label: 'Grade', type: 'badge' }
    ],
    fields: [
      { key: 'id',        label: 'Student ID', type: 'text', required: true, readonlyOnEdit: true },
      { key: 'course_id', label: 'Course ID',  type: 'text', required: true, readonlyOnEdit: true },
      { key: 'sec_id',    label: 'Section ID', type: 'text', required: true, readonlyOnEdit: true },
      { key: 'semester',  label: 'Semester',   type: 'select', required: true, readonlyOnEdit: true,
        options: ['Fall','Winter','Spring','Summer'] },
      { key: 'year',      label: 'Year',       type: 'number', required: true, readonlyOnEdit: true, min: 1702 },
      { key: 'grade',     label: 'Grade',      type: 'select', required: false,
        options: ['A+','A','A-','B+','B','B-','C+','C','C-','D','F'] }
    ],
    pkKeys: ['id', 'course_id', 'sec_id', 'semester', 'year'],
    deleteId: r => `${r.id}/${r.course_id}/${r.sec_id}/${r.semester}/${r.year}`
  };
}
