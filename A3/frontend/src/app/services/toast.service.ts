import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

const BASE_OPTIONS = {
  progressBar: true,
  progressAnimation: 'increasing' as const,
  closeButton: true,
  tapToDismiss: true,
  newestOnTop: true,
  positionClass: 'toast-top-right',
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private toastr: ToastrService) {}

  success(message: string, title = 'Success') {
    this.toastr.success(message, title, { ...BASE_OPTIONS, timeOut: 3000 });
  }

  error(message: string, title = 'Error') {
    this.toastr.error(message, title, { ...BASE_OPTIONS, timeOut: 5000, disableTimeOut: false });
  }

  info(message: string, title = 'Info') {
    this.toastr.info(message, title, { ...BASE_OPTIONS, timeOut: 3500 });
  }

  warning(message: string, title = 'Warning') {
    this.toastr.warning(message, title, { ...BASE_OPTIONS, timeOut: 4000 });
  }
}
