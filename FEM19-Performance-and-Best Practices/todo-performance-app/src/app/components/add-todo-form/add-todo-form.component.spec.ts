import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddTodoFormComponent } from './add-todo-form.component';

describe('AddTodoFormComponent', () => {
  let fixture: ComponentFixture<AddTodoFormComponent>;
  let el: HTMLElement;
  let added: jest.Mock;

  const input = () => el.querySelector<HTMLInputElement>('input')!;

  async function type(value: string) {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTodoFormComponent);
    el = fixture.nativeElement;
    added = jest.fn();
    fixture.componentInstance.add.subscribe(added);
    fixture.detectChanges();
  });

  it('is an OnPush component', () => {
    expect((AddTodoFormComponent as any).ɵcmp.onPush).toBe(true);
  });

  it('emits the trimmed text and clears the box when Add is clicked', async () => {
    await type('  Buy milk  ');
    el.querySelector('button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(added).toHaveBeenCalledWith('Buy milk');
    expect(input().value).toBe('');
  });

  it('also submits on Enter', async () => {
    await type('Buy milk');
    input().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    expect(added).toHaveBeenCalledWith('Buy milk');
  });

  it('ignores blank input', async () => {
    await type('   ');
    el.querySelector('button')!.click();
    expect(added).not.toHaveBeenCalled();
  });
});
