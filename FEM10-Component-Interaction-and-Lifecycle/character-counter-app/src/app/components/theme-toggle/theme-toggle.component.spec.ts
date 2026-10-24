import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits "light" when toggled from dark', () => {
    component.theme = 'dark';
    const emitted: string[] = [];
    component.themeChange.subscribe((theme) => emitted.push(theme));

    component.toggle();

    expect(emitted).toEqual(['light']);
  });

  it('emits "dark" when toggled from light', () => {
    component.theme = 'light';
    const emitted: string[] = [];
    component.themeChange.subscribe((theme) => emitted.push(theme));

    component.toggle();

    expect(emitted).toEqual(['dark']);
  });

  it('clicking the button toggles the theme', () => {
    component.theme = 'dark';
    const emitted: string[] = [];
    component.themeChange.subscribe((theme) => emitted.push(theme));

    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();

    expect(emitted).toEqual(['light']);
  });
});
