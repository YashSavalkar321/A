import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teaches',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class TeachesComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('teaches'); }
  get canCreatePerm() { return this.auth.canCreate('teaches'); }
  get canUpdatePerm() { return this.auth.canUpdate('teaches'); }
  get canDeletePerm() { return this.auth.canDelete('teaches'); }
  config: EntityConfig = {
    title: 'Teaches (Instructor–Section)', icon: 'cast_for_education', apiEntity: 'teaches',
    columns: [
      { key: 'id',        label: 'Instructor ID' },
      { key: 'course_id', label: 'Course ID' },
      { key: 'sec_id',    label: 'Sec ID' },
      { key: 'semester',  label: 'Semester', type: 'badge' },
      { key: 'year',      label: 'Year' }
    ],
    fields: [
      { key: 'id',        label: 'Instructor ID', type: 'text', required: true },
      { key: 'course_id', label: 'Course ID',     type: 'text', required: true },
      { key: 'sec_id',    label: 'Section ID',    type: 'text', required: true },
      { key: 'semester',  label: 'Semester',      type: 'select', required: true,
        options: ['Fall','Winter','Spring','Summer'] },
      { key: 'year',      label: 'Year',          type: 'number', required: true, min: 1702 }
    ],
    pkKeys: ['id', 'course_id', 'sec_id', 'semester', 'year'],
    canEdit: false,
    deleteId: r => `${r.id}/${r.course_id}/${r.sec_id}/${r.semester}/${r.year}`
  };
}
