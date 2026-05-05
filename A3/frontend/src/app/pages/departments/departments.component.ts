import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class DepartmentsComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('department'); }
  get canCreatePerm() { return this.auth.canCreate('department'); }
  get canUpdatePerm() { return this.auth.canUpdate('department'); }
  get canDeletePerm() { return this.auth.canDelete('department'); }
  config: EntityConfig = {
    title: 'Departments', icon: 'business', apiEntity: 'department',
    columns: [
      { key: 'dept_name', label: 'Department Name' },
      { key: 'building',  label: 'Building' },
      { key: 'budget',    label: 'Budget', type: 'currency' }
    ],
    fields: [
      { key: 'dept_name', label: 'Department Name', type: 'text', required: true, readonlyOnEdit: true },
      { key: 'building',  label: 'Building',        type: 'text', required: true },
      { key: 'budget',    label: 'Budget ($)',       type: 'number', required: true, min: 1 }
    ],
    pkKeys: ['dept_name'],
    deleteId: r => r.dept_name
  };
}
