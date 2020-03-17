import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationLineListComponent } from './relation-line-list.component';

describe('RelationLineListComponent', () => {
    let component: RelationLineListComponent;
    let fixture: ComponentFixture<RelationLineListComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [RelationLineListComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(RelationLineListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    xit('should create', () => {
        expect(component).toBeTruthy();
    });
});
