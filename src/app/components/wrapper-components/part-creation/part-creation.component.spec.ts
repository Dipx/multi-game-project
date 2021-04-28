import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PartCreationComponent } from './part-creation.component';
import { JoinerService } from 'src/app/services/joiner/JoinerService';
import { JoinerDAO } from 'src/app/dao/joiner/JoinerDAO';
import { JoinerDAOMock } from 'src/app/dao/joiner/JoinerDAOMock';
import { JoinerMocks } from 'src/app/domain/JoinerMocks';
import { PartDAOMock } from 'src/app/dao/part/PartDAOMock';
import { PartDAO } from 'src/app/dao/part/PartDAO';
import { PartMocks } from 'src/app/domain/PartMocks';
import { ChatDAO } from 'src/app/dao/chat/ChatDAO';
import { ChatDAOMock } from 'src/app/dao/chat/ChatDAOMock';
import { MGPStr } from 'src/app/utils/mgp-str/MGPStr';
import { ICurrentPart } from 'src/app/domain/icurrentpart';
import { JoueursDAO } from 'src/app/dao/joueurs/JoueursDAO';
import { JoueursDAOMock } from 'src/app/dao/joueurs/JoueursDAOMock';
import { IJoueur } from 'src/app/domain/iuser';

class RouterMock {
    public async navigate(to: string[]): Promise<boolean> {
        return Promise.resolve(true);
    }
}
describe('PartCreationComponent:', () => {
    let fixture: ComponentFixture<PartCreationComponent>;

    let component: PartCreationComponent;

    let joinerDAOMock: JoinerDAOMock;

    let partDAOMock: PartDAOMock;

    let joueursDAOMock: JoueursDAOMock;

    const OPPONENT: IJoueur = {
        pseudo: 'firstCandidate',
        state: 'online',
    };

    beforeEach(async() => {
        await TestBed.configureTestingModule({
            imports: [
                MatStepperModule, MatRadioModule, MatSliderModule,
                ReactiveFormsModule,
                RouterTestingModule,
                BrowserAnimationsModule,
            ],
            declarations: [PartCreationComponent],
            providers: [
                { provide: PartDAO, useClass: PartDAOMock },
                { provide: JoinerDAO, useClass: JoinerDAOMock },
                { provide: ChatDAO, useClass: ChatDAOMock },
                { provide: JoueursDAO, useClass: JoueursDAOMock },
                { provide: Router, useClass: RouterMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(PartCreationComponent);
        const chatDAOMock: ChatDAOMock = TestBed.get(ChatDAO);
        partDAOMock = TestBed.get(PartDAO);
        joinerDAOMock = TestBed.get(JoinerDAO);
        joueursDAOMock = TestBed.get(JoueursDAO);
        component = fixture.componentInstance;
        component.partId = 'joinerId';
        await chatDAOMock.set('joinerId', { messages: [], status: 'I don\'t have a clue TODO' });
        await joueursDAOMock.set('opponent', OPPONENT);
        await partDAOMock.set('joinerId', PartMocks.INITIAL.copy());
    });
    it('(0) Player arrival on component should call joinGame and startObserving', async() => {
        component.userName = 'creator';
        const joinerService: JoinerService = TestBed.get(JoinerService);
        await joinerDAOMock.set('joinerId', JoinerMocks.INITIAL.copy());
        spyOn(joinerService, 'joinGame').and.callThrough();
        spyOn(joinerService, 'startObserving').and.callThrough();

        fixture.detectChanges();
        await fixture.whenStable();

        expect(joinerService.joinGame).toHaveBeenCalledTimes(1);
        expect(joinerService.startObserving).toHaveBeenCalledTimes(1);
        expect(component).toBeTruthy('PartCreationComponent should have been created');
    });
    it('(1) Joiner arrival should make candidate choice possible for creator', async() => {
        component.userName = 'creator';
        await joinerDAOMock.set('joinerId', JoinerMocks.INITIAL.copy());
        fixture.detectChanges();
        await fixture.whenStable();

        expect(fixture.debugElement.query(By.css('#chooseCandidate')))
            .toBeFalsy('Choosing candidate should be impossible before there is candidate');
        await joinerDAOMock.update('joinerId', { candidatesNames: ['firstCandidate'] });
        fixture.detectChanges();

        expect(component.currentJoiner).toEqual(JoinerMocks.WITH_FIRST_CANDIDATE.copy());
        expect(fixture.debugElement.query(By.css('#chooseCandidate')))
            .toBeTruthy('Choosing candidate should be possible after first candidate arrival');
    });
    it('(2) Joiner arrival should change joiner doc', async() => {
        component.userName = 'firstCandidate';
        await joinerDAOMock.set('joinerId', JoinerMocks.INITIAL.copy());

        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.currentJoiner).toEqual(JoinerMocks.WITH_FIRST_CANDIDATE.copy());
    });
    it('(3) (4) Candidate choice should change joiner doc and make config proposal possible', async() => {
        component.userName = 'creator';
        await joinerDAOMock.set('joinerId', JoinerMocks.INITIAL.copy());
        fixture.detectChanges();
        await fixture.whenStable();
        await joinerDAOMock.update('joinerId', { candidatesNames: ['firstCandidate'] });
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('#presenceOf_firstCandidate')))
            .toBeTruthy('First candidate should be present in present player list');

        expect(fixture.debugElement.query(By.css('#proposeConfig')))
            .toBeFalsy('Proposing config should be impossible before there is a chosenPlayer');
        await component.setChosenPlayer('firstCandidate');
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('#selected_firstCandidate')))
            .toBeTruthy('First candidate should be present in present player list');
        expect(component.currentJoiner).toEqual(JoinerMocks.WITH_CHOSEN_PLAYER.copy());
        expect(fixture.debugElement.query(By.css('#proposeConfig')))
            .toBeTruthy('Choosing candidate should become possible after chosenPlayer is set');
    });
    describe('Handshake end', () => {
        it('when chosenPlayer leaves lobby, part creation should go back from start', fakeAsync(async() => {
            component.userName = 'creator';
            await joinerDAOMock.set('joinerId', JoinerMocks.INITIAL.copy());
            fixture.detectChanges();
            tick();
            await joinerDAOMock.update('joinerId', { candidatesNames: ['firstCandidate'] });
            fixture.detectChanges();
            await component.setChosenPlayer('firstCandidate');
            fixture.detectChanges();

            expect(fixture.debugElement.query(By.css('#selected_firstCandidate')))
                .toBeTruthy('First candidate should appear');
            await joinerDAOMock.update('joinerId', { partStatus: 0, chosenPlayer: '', candidatesNames: [] });
            fixture.detectChanges();

            expect(fixture.debugElement.query(By.css('#selected_firstCandidate')))
                .toBeFalsy('First candidate should no longer appear');
            expect(component.currentJoiner).toEqual(JoinerMocks.INITIAL.copy());
        }));
        it('when chosenPlayer disconnect, part creation should go back from start', fakeAsync(async() => {
            component.userName = 'creator';
            await joinerDAOMock.set('joinerId', JoinerMocks.INITIAL.copy());
            fixture.detectChanges();
            tick();

            await joinerDAOMock.update('joinerId', { candidatesNames: ['firstCandidate'] });
            fixture.detectChanges();
            tick();

            await component.setChosenPlayer('firstCandidate');
            fixture.detectChanges();
            tick();

            expect(fixture.debugElement.query(By.css('#selected_firstCandidate')))
                .toBeTruthy('First candidate should appear');
            joueursDAOMock.update('opponent', { state: 'offline' });
            fixture.detectChanges();
            tick();

            expect(fixture.debugElement.query(By.css('#selected_firstCandidate')))
                .toBeFalsy('First candidate should no longer appear');
            expect(component.currentJoiner).toEqual(JoinerMocks.INITIAL.copy());
        }));
    });
    it('(8) Config proposal should make config acceptation possible for joiner', async() => {
        component.userName = 'firstCandidate';
        await joinerDAOMock.set('joinerId', JoinerMocks.INITIAL.copy());
        fixture.detectChanges();
        await fixture.whenStable();
        await joinerDAOMock.update('joinerId',
                                   { partStatus: 1, candidatesNames: [], chosenPlayer: 'firstCandidate' });
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('#acceptConfig')))
            .toBeFalsy('Config acceptation should not be possible before config proposal');
        await joinerDAOMock.update('joinerId',
                                   { partStatus: 2, maximalMoveDuration: 10, totalPartDuration: 60, firstPlayer: 'CREATOR' });
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('#acceptConfig')))
            .toBeTruthy('Config proposal should make config acceptation possible');
    });
    it('(9) Config proposal by creator should change joiner doc', async() => {
        component.userName = 'creator';
        await joinerDAOMock.set('joinerId', JoinerMocks.INITIAL.copy());
        fixture.detectChanges();
        await fixture.whenStable();
        await joinerDAOMock.update('joinerId', { candidatesNames: ['firstCandidate'] });
        await fixture.whenStable();
        await joinerDAOMock.update('joinerId',
                                   { partStatus: 1, candidatesNames: [], chosenPlayer: 'firstCandidate' });
        // TODO: replace by real actor action (chooseCandidate)
        await fixture.whenStable();
        fixture.detectChanges();

        await component.proposeConfig();
        fixture.detectChanges();

        expect(component.currentJoiner).toEqual(JoinerMocks.WITH_PROPOSED_CONFIG.copy());
    });
    it('(10) Config acceptation by joiner should change joiner doc and part doc', async() => {
        component.userName = 'firstCandidate';
        await joinerDAOMock.set('joinerId', JoinerMocks.INITIAL.copy());
        fixture.detectChanges(); // joiner arrival
        await fixture.whenStable();
        await joinerDAOMock.update('joinerId',
                                   { partStatus: 1, candidatesNames: [], chosenPlayer: 'firstCandidate' });
        await fixture.whenStable();
        await joinerDAOMock.update('joinerId',
                                   { partStatus: 2, maximalMoveDuration: 10, totalPartDuration: 60, firstPlayer: 'CREATOR' });
        await fixture.whenStable();
        fixture.detectChanges();
        spyOn(component.gameStartNotification, 'emit');

        await component.acceptConfig();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.gameStartNotification.emit).toHaveBeenCalledWith(JoinerMocks.WITH_ACCEPTED_CONFIG.copy());
        expect(component.currentJoiner).toEqual(JoinerMocks.WITH_ACCEPTED_CONFIG.copy());
        const currentPart: ICurrentPart = partDAOMock.getStaticDB().get(new MGPStr('joinerId')).get().subject.value.doc;
        const expectedPart: ICurrentPart = PartMocks.STARTING.copy();
        expectedPart.beginning = currentPart.beginning;
        expect(currentPart).toEqual(expectedPart);
    });
    afterEach(fakeAsync(async() => {
        fixture.destroy();
        await fixture.whenStable();
        tick();
    }));
});