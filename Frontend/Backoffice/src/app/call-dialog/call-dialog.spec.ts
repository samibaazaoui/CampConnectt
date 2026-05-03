import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallDialog } from './call-dialog';

describe('CallDialog', () => {
  let component: CallDialog;
  let fixture: ComponentFixture<CallDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CallDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
