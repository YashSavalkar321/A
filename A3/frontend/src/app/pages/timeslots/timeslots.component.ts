import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-timeslots',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class TimeslotsComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('timeslot'); }
  get canCreatePerm() { return this.auth.canCreate('timeslot'); }
  get canUpdatePerm() { return this.auth.canUpdate('timeslot'); }
  get canDeletePerm() { return this.auth.canDelete('timeslot'); }
  config: EntityConfig = {
    title: 'Time Slots', icon: 'schedule', apiEntity: 'timeslot',
    columns: [
      { key: 'time_slot_id', label: 'Slot ID' },
      { key: 'day',          label: 'Day' },
      { key: 'start_time',   label: 'Start Time' },
      { key: 'end_time',     label: 'End Time' }
    ],
    fields: [
      { key: 'time_slot_id', label: 'Time Slot ID', type: 'text', required: true, readonlyOnEdit: true },
      { key: 'day', label: 'Day', type: 'select', required: true, readonlyOnEdit: true,
        options: ['M','T','W','R','F','S','U'] },
      { key: 'start_time', label: 'Start Time', type: 'time', required: true, readonlyOnEdit: true },
      { key: 'end_time',   label: 'End Time',   type: 'time', required: true }
    ],
    pkKeys: ['time_slot_id', 'day', 'start_time'],
    deleteId: r => `${r.time_slot_id}/${r.day}/${r.start_time}`
  };
}
