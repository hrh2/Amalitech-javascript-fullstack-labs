import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextEditorComponent } from './text-editor.component';

describe('TextEditorComponent', () => {
  let component: TextEditorComponent;
  let fixture: ComponentFixture<TextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('is not over limit when no limit is enabled', () => {
    component.text = 'x'.repeat(1000);
    expect(component.isOverLimit).toBeFalse();
  });

  it('reports over limit once the text reaches the limit', () => {
    component.limitEnabled = true;
    component.limitValue = 5;
    component.text = 'hello';
    expect(component.isOverLimit).toBeTrue();
  });

  it('trims typed input down to the limit', () => {
    component.limitEnabled = true;
    component.limitValue = 5;
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'hello world';

    let emitted = '';
    component.textChange.subscribe((value) => (emitted = value));
    textarea.dispatchEvent(new Event('input'));

    expect(emitted).toBe('hello');
    expect(textarea.value).toBe('hello');
  });

  it('trims by visible characters only when excluding spaces', () => {
    component.limitEnabled = true;
    component.excludeSpaces = true;
    component.limitValue = 5;
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    textarea.value = 'a b c d e f';

    let emitted = '';
    component.textChange.subscribe((value) => (emitted = value));
    textarea.dispatchEvent(new Event('input'));

    expect(emitted.replace(/\s/g, '').length).toBe(5);
  });

  it('re-trims via ngOnChanges when the limit shrinks without new typing', async () => {
    component.text = 'hello world';
    component.limitEnabled = true;
    component.limitValue = 100;
    fixture.detectChanges();

    let emitted = '';
    component.textChange.subscribe((value) => (emitted = value));

    component.limitValue = 5;
    component.ngOnChanges({
      limitValue: {
        previousValue: 100,
        currentValue: 5,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    // The correction is deferred to a microtask to avoid mutating the
    // parent's bound value mid change-detection pass (see ngOnChanges).
    await Promise.resolve();

    expect(emitted).toBe('hello');
  });
});
