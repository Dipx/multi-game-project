import { DebugElement, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { LocalGameCreationComponent } from './local-game-creation.component';

class RouterMock {
    public async navigate(to: string[]): Promise<boolean> {
        return true;
    }
}
describe('LocalGameCreationComponent', () => {
    let component: LocalGameCreationComponent;
    let fixture: ComponentFixture<LocalGameCreationComponent>;

    const clickElement: (elementName: string) => Promise<boolean> = async(elementName: string) => {
        const element: DebugElement = fixture.debugElement.query(By.css(elementName));
        if (element == null) {
            return null;
        } else {
            element.triggerEventHandler('click', null);
            await fixture.whenStable();
            fixture.detectChanges();
            return true;
        }
    };
    beforeEach(async() => {
        await TestBed.configureTestingModule({
            declarations: [
                LocalGameCreationComponent,
            ],
            schemas: [
                CUSTOM_ELEMENTS_SCHEMA,
            ],
            providers: [
                { provide: Router, useClass: RouterMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(LocalGameCreationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create and redirect to chosen game', fakeAsync(async() => {
        component.pickGame('whateverGame');
        spyOn(component.router, 'navigate');
        expect(await clickElement('#playLocally')).toBeTrue();
        expect(component.router.navigate).toHaveBeenCalledOnceWith(['local/whateverGame']);
    }));
});