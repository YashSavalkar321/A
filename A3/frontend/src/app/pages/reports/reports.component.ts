import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ReportResult } from '../../models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatTableModule, MatPaginatorModule, MatProgressBarModule,
    MatDividerModule, MatChipsModule, MatMenuModule, MatTooltipModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  tables = ['classroom','department','course','instructor','section',
            'teaches','student','takes','advisor','time_slot','prereq'];
  selectedTable = '';
  customSql = '';
  loading = false;
  result: ReportResult | null = null;
  dataSource = new MatTableDataSource<any>([]);

  constructor(private api: ApiService, public auth: AuthService, private toast: ToastService) {}

  ngAfterViewInit() { this.dataSource.paginator = this.paginator; }

  runTableReport() {
    if (!this.selectedTable) return;
    this.loading = true; this.result = null;
    this.api.getReport(this.selectedTable).subscribe({
      next: r => { this.setResult(r); this.loading = false; this.toast.info(`Loaded ${r.rows.length} rows from "${this.selectedTable}"`, 'Report Ready'); },
      error: e => { this.toast.error(e.error?.message || 'Failed to run report', 'Report Error'); this.loading = false; }
    });
  }

  runCustom() {
    if (!this.customSql.trim()) return;
    this.loading = true; this.result = null;
    this.api.customReport(this.customSql).subscribe({
      next: r => { this.setResult(r); this.loading = false; this.toast.success(`Query returned ${r.rows.length} row(s)`, 'Query Complete'); },
      error: e => { this.toast.error(e.error?.message || 'Query execution failed', 'SQL Error'); this.loading = false; }
    });
  }

  setResult(r: ReportResult) {
    this.result = r;
    this.dataSource.data = r.rows;
    setTimeout(() => { if (this.paginator) this.dataSource.paginator = this.paginator; });
  }

  get displayedColumns() { return this.result?.columns ?? []; }

  // ── Export: CSV ──────────────────────────────────────────────────────────
  exportCSV() {
    if (!this.result) return;
    const { columns, rows } = this.result;
    const header = columns.join(',');
    const body = rows.map(r =>
      columns.map(c => {
        let v = r[c] ?? '';
        v = String(v).replace(/"/g, '""');
        return `"${v}"`;
      }).join(',')
    ).join('\n');
    const csv = header + '\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.triggerDownload(blob, this.exportFilename('csv'));
    this.toast.success('CSV downloaded', 'Export');
  }

  // ── Export: PDF ──────────────────────────────────────────────────────────
  exportPDF() {
    if (!this.result) return;
    const { columns, rows } = this.result;

    const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });

    // Title bar
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 16, 64); // #1e1040
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(this.reportTitle(), 14, 14);
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${new Date().toLocaleString()}  ·  ${rows.length} rows`, 14, 22);

    // Table
    autoTable(doc, {
      startY: 34,
      head: [columns],
      body: rows.map(r => columns.map(c => r[c] ?? '—')),
      theme: 'grid',
      headStyles: { fillColor: [93, 33, 182], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      styles: { overflow: 'linebreak', cellWidth: 'auto' },
      margin: { left: 10, right: 10 },
      didDrawPage: (data: any) => {
        // Footer
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `University MIS — Page ${doc.getNumberOfPages()}`,
          pageW / 2, pageH - 8, { align: 'center' }
        );
      }
    });

    doc.save(this.exportFilename('pdf'));
    this.toast.success('PDF downloaded', 'Export');
  }

  private reportTitle(): string {
    return this.selectedTable
      ? `Report: ${this.selectedTable.replace(/_/g, ' ').toUpperCase()}`
      : 'Custom SQL Report';
  }

  private exportFilename(ext: string): string {
    const name = this.selectedTable || 'custom_query';
    const ts = new Date().toISOString().slice(0, 10);
    return `Report_${name}_${ts}.${ext}`;
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
