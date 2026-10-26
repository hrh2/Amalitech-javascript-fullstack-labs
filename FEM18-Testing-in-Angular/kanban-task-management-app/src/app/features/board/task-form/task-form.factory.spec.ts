import { FormBuilder } from '@angular/forms';
import { makeTask } from '../../../testing/fixtures';
import { applyDuplicateTitleValidator, buildTaskForm, patchTaskIntoForm, subtaskGroup } from './task-form.factory';

describe('task-form.factory', () => {
  const fb = new FormBuilder();

  describe('buildTaskForm', () => {
    it('starts empty, "todo", invalid (title required) and with no subtasks', () => {
      const form = buildTaskForm(fb);
      expect(form.value).toEqual({ title: '', description: '', status: 'todo', dueDate: '', subtasks: [] });
      expect(form.invalid).toBe(true);
    });

    it.each([
      ['ab', 'minlength'],
      ['a'.repeat(61), 'maxlength'],
      ['', 'required'],
    ])('title "%s" fails with %s', (title, error) => {
      const form = buildTaskForm(fb);
      form.get('title')!.setValue(title);
      expect(form.get('title')!.errors).toHaveProperty(error);
    });

    it('is valid with a 3+ character title', () => {
      const form = buildTaskForm(fb);
      form.get('title')!.setValue('Fix bug');
      expect(form.valid).toBe(true);
    });

    it('rejects a description over 300 characters', () => {
      const form = buildTaskForm(fb);
      form.get('description')!.setValue('x'.repeat(301));
      expect(form.get('description')!.errors).toHaveProperty('maxlength');
    });
  });

  describe('applyDuplicateTitleValidator', () => {
    it('adds the duplicate check to the title control and re-validates immediately', () => {
      const form = buildTaskForm(fb);
      form.get('title')!.setValue('Fix bug');
      expect(form.valid).toBe(true);

      applyDuplicateTitleValidator(form, ['fix bug']);

      expect(form.get('title')!.errors).toEqual({ duplicateTitle: true });
    });
  });

  describe('subtaskGroup', () => {
    it('defaults to an empty, incomplete, invalid subtask', () => {
      const group = subtaskGroup(fb);
      expect(group.value).toEqual({ title: '', completed: false });
      expect(group.invalid).toBe(true);
    });

    it('uses the values it is given', () => {
      expect(subtaskGroup(fb, { title: 'Hero', completed: true }).value).toEqual({ title: 'Hero', completed: true });
    });
  });

  describe('patchTaskIntoForm', () => {
    it('copies every field including each subtask, and turns a null due date into ""', () => {
      const form = buildTaskForm(fb);
      patchTaskIntoForm(
        fb,
        form,
        makeTask({ title: 'Edit me', status: 'done', dueDate: null, subtasks: [{ title: 'a', completed: true }, { title: 'b', completed: false }] }),
      );

      expect(form.value).toEqual({
        title: 'Edit me',
        description: 'List every page.',
        status: 'done',
        dueDate: '',
        subtasks: [{ title: 'a', completed: true }, { title: 'b', completed: false }],
      });
    });
  });
});
