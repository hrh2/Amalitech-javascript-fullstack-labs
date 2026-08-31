import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { BoardService } from '../../../core/services/board.service';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';

/**
 * Deliberately does NOT use FormsModule/ngModel: two-way binding is a
 * FEM13 (Forms) concept. Each field here is plain one-way property
 * binding ([value]/[ngValue]-less <select>) paired with an (input)/
 * (change) event handler that updates the matching component field -
 * exactly the manual pattern ngModel is syntactic sugar over, using only
 * FEM09-level template syntax. This still gives unsavedChangesGuard
 * (CanDeactivate) real editable state to compare against, satisfying the
 * FEM12 task spec's Task 7 without borrowing FEM13's forms machinery.
 */
@Component({
  selector: 'app-task-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css',
})
export class TaskDetailComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  task?: Task;
  boardId!: number;
  taskId!: number;

  title = '';
  description = '';
  status: TaskStatus = 'todo';

  private paramSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boardService: BoardService,
  ) {}

  ngOnInit(): void {
    // Two path parameters at once: the parent route's :boardId and this
    // child route's own :taskId, both available from the same paramMap.
    this.paramSubscription = this.route.paramMap.subscribe((params) => {
      this.boardId = Number(params.get('boardId'));
      this.taskId = Number(params.get('taskId'));
      this.loadTask();
    });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  private loadTask(): void {
    this.task = this.boardService.getTaskById(this.boardId, this.taskId);
    if (!this.task) {
      this.router.navigate(['/not-found']);
      return;
    }
    this.title = this.task.title;
    this.description = this.task.description;
    this.status = this.task.status;
  }

  onTitleInput(value: string): void {
    this.title = value;
  }

  onDescriptionInput(value: string): void {
    this.description = value;
  }

  onStatusChange(value: string): void {
    this.status = value as TaskStatus;
  }

  // Consulted by unsavedChangesGuard (CanDeactivate) before letting the
  // user navigate away from this route. boardService.updateTask() mutates
  // the same task object this.task points to, so once a save happens the
  // comparison below naturally goes back to "no changes" - no separate
  // "saved" flag is needed to keep this in sync.
  hasUnsavedChanges(): boolean {
    if (!this.task) {
      return false;
    }
    return (
      this.title !== this.task.title ||
      this.description !== this.task.description ||
      this.status !== this.task.status
    );
  }

  saveTask(): void {
    this.boardService.updateTask(this.boardId, this.taskId, this.title, this.description, this.status);
  }
}
