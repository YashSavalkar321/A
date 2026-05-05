import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class SectionsComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('section'); }
  get canCreatePerm() { return this.auth.canCreate('section'); }
  get canUpdatePerm() { return this.auth.canUpdate('section'); }
  get canDeletePerm() { return this.auth.canDelete('section'); }
  config: EntityConfig = {
    title: 'Sections', icon: 'layers', apiEntity: 'section',
    columns: [
      { key: 'course_id',    label: 'Course ID' },
      { key: 'sec_id',       label: 'Sec ID' },
      { key: 'semester',     label: 'Semester', type: 'badge' },
      { key: 'year',         label: 'Year' },
      { key: 'building',     label: 'Building' },
      { key: 'room_number',  label: 'Room' },
      { key: 'time_slot_id', label: 'Time Slot' }
    ],
    fields: [
      { key: 'course_id',    label: 'Course ID',    type: 'text', required: true, readonlyOnEdit: true },
      { key: 'sec_id',       label: 'Section ID',   type: 'text', required: true, readonlyOnEdit: true },
      { key: 'semester',     label: 'Semester',     type: 'select', required: true, readonlyOnEdit: true,
        options: ['Fall','Winter','Spring','Summer'] },
      { key: 'year',         label: 'Year',         type: 'number', required: true, readonlyOnEdit: true, min: 1702 },
      { key: 'building',     label: 'Building',     type: 'text', required: false },
      { key: 'room_number',  label: 'Room Number',  type: 'text', required: false },
      { key: 'time_slot_id', label: 'Time Slot ID', type: 'text', required: false }
    ],
    pkKeys: ['course_id', 'sec_id', 'semester', 'year'],
    deleteId: r => `${r.course_id}/${r.sec_id}/${r.semester}/${r.year}`
  };
}
