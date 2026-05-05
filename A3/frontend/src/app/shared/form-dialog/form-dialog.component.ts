import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FieldDef } from '../entity-config';

export interface DialogData {
  title: string;
  icon: string;
  fields: FieldDef[];
  record?: any;  // existing record for edit mode
}

@Component({
  selector: 'app-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule],
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss']
})
export class FormDialogComponent {
  form: FormGroup;
  isEdit: boolean;
  title: string;
  icon: string;
  fields: FieldDef[];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.title = data.title;
    this.icon = data.icon;
    this.fields = data.fields;
    this.isEdit = !!data.record;
    const controls: any = {};
    for (const f of data.fields) {
      const val = data.record ? data.record[f.key] ?? '' : '';
      const disabled = this.isEdit && !!f.readonlyOnEdit;
      controls[f.key] = [{ value: val, disabled }, f.required ? Validators.required : []];
    }
    this.form = this.fb.group(controls);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.getRawValue());
  }


}
