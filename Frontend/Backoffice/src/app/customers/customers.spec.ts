import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersComponenet } from './customers';

describe('Customers', () => {
  let component: CustomersComponenet;
  let fixture: ComponentFixture<CustomersComponenet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomersComponenet],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomersComponenet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
