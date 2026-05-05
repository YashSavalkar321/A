import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-advisors',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class AdvisorsComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('advisor'); }
  get canCreatePerm() { return this.auth.canCreate('advisor'); }
  get canUpdatePerm() { return this.auth.canUpdate('advisor'); }
  get canDeletePerm() { return this.auth.canDelete('advisor'); }
  config: EntityConfig = {
    title: 'Advisors', icon: 'supervisor_account', apiEntity: 'advisor',
    columns: [
      { key: 's_id',            label: 'Student ID' },
      { key: 'student_name',    label: 'Student Name' },
      { key: 'i_id',            label: 'Instructor ID' },
      { key: 'instructor_name', label: 'Instructor Name' }
    ],
    fields: [
      { key: 's_id', label: 'Student ID',    type: 'text', required: true, readonlyOnEdit: true },
      { key: 'i_id', label: 'Instructor ID', type: 'text', required: true }
    ],
    pkKeys: ['s_id'],
    deleteId: r => r.s_id
  };
}
