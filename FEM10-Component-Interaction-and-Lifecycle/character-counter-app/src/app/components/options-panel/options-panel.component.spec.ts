import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionsPanelComponent } from './options-panel.component';

describe('OptionsPanelComponent', () => {
  let component: OptionsPanelComponent;
  let fixture: ComponentFixture<OptionsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionsPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OptionsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits when the exclude-spaces checkbox changes', () => {
    let emitted: boolean | undefined;
    component.excludeSpacesChange.subscribe((value) => (emitted = value));

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelectorAll('input[type="checkbox"]')[0];
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    expect(emitted).toBeTrue();
  });

  it('emits when the limit-enabled checkbox changes and reveals the limit input', () => {
    let emitted: boolean | undefined;
    component.limitEnabledChange.subscribe((value) => (emitted = value));

    const checkbox: HTMLInputElement = fixture.nativeElement.querySelectorAll('input[type="checkbox"]')[1];
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    expect(emitted).toBeTrue();

    component.limitEnabled = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="number"]')).toBeTruthy();
  });

  it('emits a positive limit value from the number input', () => {
    component.limitEnabled = true;
    fixture.detectChanges();

    let emitted = 0;
    component.limitValueChange.subscribe((value) => (emitted = value));

    const numberInput: HTMLInputElement = fixture.nativeElement.querySelector('input[type="number"]');
    numberInput.value = '150';
    numberInput.dispatchEvent(new Event('input'));

    expect(emitted).toBe(150);
  });
});
