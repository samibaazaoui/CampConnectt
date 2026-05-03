import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveCallDialog } from './active-call-dialog';

describe('ActiveCallDialog', () => {
  let component: ActiveCallDialog;
  let fixture: ComponentFixture<ActiveCallDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveCallDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveCallDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
