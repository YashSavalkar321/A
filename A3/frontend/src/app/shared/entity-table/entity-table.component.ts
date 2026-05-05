import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { EntityConfig } from '../entity-config';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule
  ],
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.scss']
})
export class EntityTableComponent implements OnInit, AfterViewInit {
  @Input() config!: EntityConfig;
  @Input() readonly = false;
  @Input() canCreatePerm = true;
  @Input() canUpdatePerm = true;
  @Input() canDeletePerm = true;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  loading = false;
  searchText = '';

  constructor(private api: ApiService, private dialog: MatDialog,
    private toast: ToastService) {}

  get showActions(): boolean {
    return !this.readonly && (this.canUpdatePerm || this.canDeletePerm);
  }

  ngOnInit() {
    this.displayedColumns = [
      ...this.config.columns.map(c => c.key),
      ...(this.showActions ? ['actions'] : [])
    ];
    this.load();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  load() {
    this.loading = true;
    this.api.getAll(this.config.apiEntity).subscribe({
      next: data => { this.dataSource.data = data; this.loading = false; },
      error: e => { this.toast.error(e.error?.message || 'Failed to load records', 'Load Error'); this.loading = false; }
    });
  }

  applyFilter() {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
  }

  openAdd() {
    const ref = this.dialog.open(FormDialogComponent, {
      data: { title: `Add ${this.config.title.replace(/s$/, '')}`, icon: this.config.icon, fields: this.config.fields }
    });
    ref.afterClosed().subscribe(val => { if (val) this.doCreate(val); });
  }

  openEdit(row: any) {
    const ref = this.dialog.open(FormDialogComponent, {
      data: { title: `Edit ${this.config.title.replace(/s$/, '')}`, icon: this.config.icon, fields: this.config.fields, record: row }
    });
    ref.afterClosed().subscribe(val => { if (val) this.doUpdate(row, val); });
  }

  openDelete(row: any) {
    this.dialog.open(ConfirmDialogComponent).afterClosed().subscribe(ok => { if (ok) this.doDelete(row); });
  }

  doCreate(val: any) {
    this.api.create(this.config.apiEntity, val).subscribe({
      next: () => { this.toast.success('Record created successfully', 'Created'); this.load(); },
      error: e => this.toast.error(e.error?.message || 'Failed to create record', 'Error')
    });
  }

  doUpdate(row: any, val: any) {
    const id = (this.config.updateId ?? this.config.deleteId)(row);
    this.api.update(this.config.apiEntity, id, val).subscribe({
      next: () => { this.toast.success('Record updated successfully', 'Updated'); this.load(); },
      error: e => this.toast.error(e.error?.message || 'Failed to update record', 'Error')
    });
  }

  doDelete(row: any) {
    const id = this.config.deleteId(row);
    this.api.delete(this.config.apiEntity, id).subscribe({
      next: () => { this.toast.success('Record deleted successfully', 'Deleted'); this.load(); },
      error: e => this.toast.error(e.error?.message || 'Failed to delete record', 'Error')
    });
  }

  getColDef(key: string) { return this.config.columns.find(c => c.key === key); }

  formatCell(row: any, col: any): string {
    const val = row[col.key];
    if (col.type === 'currency') return val != null ? `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '';
    return val ?? '';
  }

  getBadgeClass(val: string): string {
    if (!val) return '';
    // For grade values (A+, B-, etc), use first char; for others (Fall, Spring) use full lowercase
    const lower = val.toLowerCase();
    // Single letter or letter+sign grades
    if (/^[a-f][+-]?$/.test(val)) return val[0].toLowerCase();
    return lower;
  }
}
