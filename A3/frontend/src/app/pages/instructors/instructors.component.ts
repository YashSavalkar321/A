import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class InstructorsComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('instructor'); }
  get canCreatePerm() { return this.auth.canCreate('instructor'); }
  get canUpdatePerm() { return this.auth.canUpdate('instructor'); }
  get canDeletePerm() { return this.auth.canDelete('instructor'); }
  config: EntityConfig = {
    title: 'Instructors', icon: 'person', apiEntity: 'instructor',
    columns: [
      { key: 'id',        label: 'ID' },
      { key: 'name',      label: 'Name' },
      { key: 'dept_name', label: 'Department' },
      { key: 'salary',    label: 'Salary', type: 'currency' }
    ],
    fields: [
      { key: 'id',        label: 'ID',          type: 'text',   required: true, readonlyOnEdit: true },
      { key: 'name',      label: 'Full Name',    type: 'text',   required: true },
      { key: 'dept_name', label: 'Department',   type: 'text',   required: true },
      { key: 'salary',    label: 'Salary ($)',   type: 'number', required: true, min: 29001 }
    ],
    pkKeys: ['id'],
    deleteId: r => r.id
  };
}
