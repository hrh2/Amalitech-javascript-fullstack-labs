import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LetterDensityComponent } from './letter-density.component';

describe('LetterDensityComponent', () => {
  let component: LetterDensityComponent;
  let fixture: ComponentFixture<LetterDensityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetterDensityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LetterDensityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('recomputes density when the text input changes', () => {
    component.text = 'aab';
    component.ngOnChanges({
      text: { previousValue: '', currentValue: 'aab', firstChange: true, isFirstChange: () => true },
    });

    expect(component.density[0].letter).toBe('a');
    expect(component.density[0].count).toBe(2);
  });

  it('toggles the expanded state', () => {
    expect(component.expanded).toBeFalse();
    component.toggleExpanded();
    expect(component.expanded).toBeTrue();
    component.toggleExpanded();
    expect(component.expanded).toBeFalse();
  });

  it('hides rows beyond the preview count until expanded', () => {
    component.text = 'abcdefgh';
    component.ngOnChanges({
      text: { previousValue: '', currentValue: 'abcdefgh', firstChange: true, isFirstChange: () => true },
    });
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.density-row');
    const hiddenRows = fixture.nativeElement.querySelectorAll('.density-row[hidden]');
    expect(rows.length).toBe(8);
    expect(hiddenRows.length).toBe(3);

    component.toggleExpanded();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.density-row[hidden]').length).toBe(0);
  });
});
