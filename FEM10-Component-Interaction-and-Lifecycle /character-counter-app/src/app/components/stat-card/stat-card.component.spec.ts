import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let component: StatCardComponent;
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('pads single-digit values with a leading zero', () => {
    component.value = 4;
    expect(component.displayValue).toBe('04');
  });

  it('does not pad values of 10 or more', () => {
    component.value = 42;
    expect(component.displayValue).toBe('42');
  });

  it('builds the variant class name', () => {
    component.variant = 'orange';
    expect(component.cardClass).toBe('stat-card stat-orange');
  });
});
