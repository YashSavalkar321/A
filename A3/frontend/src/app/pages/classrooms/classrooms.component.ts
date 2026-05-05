import { Component, inject } from '@angular/core';
import { EntityTableComponent } from '../../shared/entity-table/entity-table.component';
import { EntityConfig } from '../../shared/entity-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-classrooms',
  standalone: true,
  imports: [EntityTableComponent],
  template: `<app-entity-table [config]="config" [readonly]="readonly"
    [canCreatePerm]="canCreatePerm" [canUpdatePerm]="canUpdatePerm" [canDeletePerm]="canDeletePerm"></app-entity-table>`
})
export class ClassroomsComponent {
  private auth = inject(AuthService);
  get readonly() { return !this.auth.canWrite('classroom'); }
  get canCreatePerm() { return this.auth.canCreate('classroom'); }
  get canUpdatePerm() { return this.auth.canUpdate('classroom'); }
  get canDeletePerm() { return this.auth.canDelete('classroom'); }
  config: EntityConfig = {
    title: 'Classrooms', icon: 'meeting_room', apiEntity: 'classroom',
    columns: [
      { key: 'building',    label: 'Building' },
      { key: 'room_number', label: 'Room No.' },
      { key: 'capacity',    label: 'Capacity', type: 'number' }
    ],
    fields: [
      { key: 'building',    label: 'Building',   type: 'text',   required: true, readonlyOnEdit: true },
      { key: 'room_number', label: 'Room Number', type: 'text',  required: true, readonlyOnEdit: true },
      { key: 'capacity',    label: 'Capacity',    type: 'number', required: true, min: 1 }
    ],
    pkKeys: ['building', 'room_number'],
    deleteId: r => `${r.building}/${r.room_number}`
  };
}
