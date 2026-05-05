import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-prereqs',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class PrereqsComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('prereq'); }
  get canCreatePerm() { return this.auth.canCreate('prereq'); }
  get canUpdatePerm() { return this.auth.canUpdate('prereq'); }
  get canDeletePerm() { return this.auth.canDelete('prereq'); }
  config: EntityConfig = {
    title: 'Prerequisites', icon: 'account_tree', apiEntity: 'prereq',
    columns: [
      { key: 'course_id',    label: 'Course ID' },
      { key: 'course_title', label: 'Course Title' },
      { key: 'prereq_id',    label: 'Prerequisite ID' },
      { key: 'prereq_title', label: 'Prerequisite Title' }
    ],
    fields: [
      { key: 'course_id',  label: 'Course ID',       type: 'text', required: true },
      { key: 'prereq_id',  label: 'Prerequisite ID', type: 'text', required: true }
    ],
    pkKeys: ['course_id', 'prereq_id'],
    canEdit: false,
    deleteId: r => `${r.course_id}/${r.prereq_id}`
  };
}
