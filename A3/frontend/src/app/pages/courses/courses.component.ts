import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class CoursesComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('course'); }
  get canCreatePerm() { return this.auth.canCreate('course'); }
  get canUpdatePerm() { return this.auth.canUpdate('course'); }
  get canDeletePerm() { return this.auth.canDelete('course'); }
  config: EntityConfig = {
    title: 'Courses', icon: 'menu_book', apiEntity: 'course',
    columns: [
      { key: 'course_id', label: 'Course ID' },
      { key: 'title',     label: 'Title' },
      { key: 'dept_name', label: 'Department' },
      { key: 'credits',   label: 'Credits' }
    ],
    fields: [
      { key: 'course_id', label: 'Course ID',   type: 'text',   required: true, readonlyOnEdit: true },
      { key: 'title',     label: 'Title',        type: 'text',   required: true },
      { key: 'dept_name', label: 'Department',   type: 'text',   required: true },
      { key: 'credits',   label: 'Credits',      type: 'number', required: true, min: 1 }
    ],
    pkKeys: ['course_id'],
    deleteId: r => r.course_id
  };
}
