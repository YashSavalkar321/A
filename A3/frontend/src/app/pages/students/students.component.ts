import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class StudentsComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('student'); }
  get canCreatePerm() { return this.auth.canCreate('student'); }
  get canUpdatePerm() { return this.auth.canUpdate('student'); }
  get canDeletePerm() { return this.auth.canDelete('student'); }
  config: EntityConfig = {
    title: 'Students', icon: 'school', apiEntity: 'student',
    columns: [
      { key: 'id',        label: 'ID' },
      { key: 'name',      label: 'Name' },
      { key: 'dept_name', label: 'Department' },
      { key: 'tot_cred',  label: 'Total Credits' },
      { key: 'address',   label: 'Address' },
      { key: 'mobile_no', label: 'Mobile No' }
    ],
    fields: [
      { key: 'id',        label: 'Student ID',   type: 'text',   required: true, readonlyOnEdit: true },
      { key: 'name',      label: 'Full Name',     type: 'text',   required: true },
      { key: 'dept_name', label: 'Department',    type: 'text',   required: true },
      { key: 'tot_cred',  label: 'Total Credits', type: 'number', required: false, min: 0 },
      { key: 'address',   label: 'Address',       type: 'text',   required: false },
      { key: 'mobile_no', label: 'Mobile No',     type: 'text',   required: false }
    ],
    pkKeys: ['id'],
    deleteId: r => r.id
  };
}
