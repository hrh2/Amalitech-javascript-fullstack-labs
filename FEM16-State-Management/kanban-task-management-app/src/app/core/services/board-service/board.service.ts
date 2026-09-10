import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Board } from '../../models/board.model';

/**
 * The Kanban app's data-access layer. As of FEM16, this is deliberately
 * the ONLY thing this service does: hand back the initial set of boards,
 * as an Observable, the way a real `HttpClient` call would. `BoardEffects`
 * (`state/board/board.effects.ts`) is the only consumer.
 *
 * Everything this service used to do beyond that - addBoard/addTask/
 * updateTask, isTitleTaken, getAdjacentBoardId - has moved into the NgRx
 * reducer/components: once the store holds this data, it is the single
 * source of truth, and a second, independently-mutated copy living here
 * would just be a second place for the two to drift out of sync. The
 * `delay(300)` below is a stand-in for real network latency so the
 * loading state introduced in this module's reducer has something
 * genuine to show - a real backend is FEM17 (HTTP & API Integration)
 * territory, still ahead of this module in this course's ordering.
 */
@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private readonly boards: Board[] = [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Revamp the marketing site for the new product launch.',
      createdAt: '2026-08-01',
      tasks: [
        {
          id: 1,
          title: 'Audit existing pages',
          description: 'List every page and note what stays, changes, or goes.',
          status: 'done',
          dueDate: '2026-08-05',
          subtasks: [
            { title: 'List every URL', completed: true },
            { title: 'Flag pages to retire', completed: true },
          ],
        },
        {
          id: 2,
          title: 'Wireframe the homepage',
          description: 'Low-fidelity layout for hero, features, and footer.',
          status: 'in-progress',
          dueDate: '2026-08-15',
          subtasks: [
            { title: 'Hero section', completed: true },
            { title: 'Feature grid', completed: false },
            { title: 'Footer', completed: false },
          ],
        },
        {
          id: 3,
          title: 'Pick a color palette',
          description: 'Two or three options for stakeholder review.',
          status: 'todo',
          dueDate: null,
          subtasks: [],
        },
      ],
    },
    {
      id: 2,
      name: 'Mobile App Launch',
      description: 'Coordinate the v1.0 release of the companion mobile app.',
      createdAt: '2026-08-10',
      tasks: [
        {
          id: 1,
          title: 'Finalize app store copy',
          description: 'Title, subtitle, and description for both stores.',
          status: 'todo',
          dueDate: '2026-09-01',
          subtasks: [],
        },
        {
          id: 2,
          title: 'Smoke test on real devices',
          description: 'Run through the core flows on iOS and Android hardware.',
          status: 'in-progress',
          dueDate: null,
          subtasks: [
            { title: 'iOS', completed: false },
            { title: 'Android', completed: false },
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Q3 Marketing Campaign',
      description: 'Plan and execute the Q3 multi-channel campaign.',
      createdAt: '2026-08-20',
      tasks: [
        {
          id: 1,
          title: 'Draft campaign brief',
          description: 'Goals, audience, budget, and key dates.',
          status: 'todo',
          dueDate: null,
          subtasks: [],
        },
      ],
    },
  ];

  /** Simulates an initial `GET /boards` - see the class comment above. */
  getBoards(): Observable<Board[]> {
    return of(this.boards).pipe(delay(300));
  }
}
