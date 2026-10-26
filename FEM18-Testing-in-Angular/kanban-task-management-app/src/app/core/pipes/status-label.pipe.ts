import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  todo: 'Todo',
  'in-progress': 'Doing',
  done: 'Done',
};

/** Turns a stored task status ('in-progress') into the label shown in the UI ('Doing'). */
@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    if (!status) {
      return '';
    }
    return LABELS[status] ?? status;
  }
}
