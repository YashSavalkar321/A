import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="cdlg-header">
      <div class="cdlg-icon">
        <mat-icon>delete_forever</mat-icon>
      </div>
      <div>
        <h2 class="cdlg-title">Delete Record</h2>
        <p class="cdlg-sub">This action cannot be undone</p>
      </div>
      <button mat-icon-button mat-dialog-close class="cdlg-close">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content class="cdlg-content">
      <p>Are you sure you want to permanently delete this record? All associated data will be removed.</p>
    </mat-dialog-content>
    <mat-dialog-actions class="cdlg-actions">
      <button mat-stroked-button mat-dialog-close class="btn-cancel">Cancel</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true" class="btn-delete">
        <mat-icon>delete_outline</mat-icon> Delete Permanently
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .cdlg-header {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 18px 18px 12px;
      border-bottom: 1px solid var(--clr-border);
    }
    .cdlg-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: #fef2f2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { color: var(--clr-error) !important; font-size: 20px !important; width: 20px !important; height: 20px !important; }
    }
    .cdlg-title { margin: 0; font-size: 1rem; font-weight: 700; color: var(--clr-text); }
    .cdlg-sub { margin: 2px 0 0; font-size: 0.73rem; color: var(--clr-text-muted); }
    .cdlg-close { margin-left: auto; color: var(--clr-text-muted) !important; width: 30px !important; height: 30px !important; }
    .cdlg-content { padding: 14px 18px !important; }
    .cdlg-content p { margin: 0; font-size: 0.875rem; color: var(--clr-text-muted); line-height: 1.6; }
    .cdlg-actions { display: flex !important; justify-content: flex-end; gap: 8px !important; padding: 12px 18px !important; border-top: 1px solid var(--clr-border); }
    .btn-cancel { border-radius: 8px !important; border-color: var(--clr-border) !important; font-size: 0.85rem !important; height: 36px; }
    .btn-delete { border-radius: 8px !important; font-size: 0.85rem !important; font-weight: 600 !important; height: 36px; gap: 4px; mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; } }
  `]
})
export class ConfirmDialogComponent {}
