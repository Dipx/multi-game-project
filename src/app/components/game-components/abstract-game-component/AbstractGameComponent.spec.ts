import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppModule } from 'src/app/app.module';
import { EncapsulePiece } from 'src/app/games/encapsule/EncapsulePiece';
import { AuthenticationService } from 'src/app/services/AuthenticationService';
import { AuthenticationServiceMock } from 'src/app/services/tests/AuthenticationService.spec';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { ActivatedRouteStub } from 'src/app/utils/tests/TestUtils.spec';
import { PickGameComponent } from '../../normal-component/pick-game/pick-game.component';
import { LocalGameWrapperComponent } from '../../wrapper-components/local-game-wrapper/local-game-wrapper.component';

describe('AbstractGameComponent', () => {
    const activatedRouteStub: ActivatedRouteStub = new ActivatedRouteStub();

    let fixture: ComponentFixture<LocalGameWrapperComponent>;

    let component: LocalGameWrapperComponent;

    const gameList: ReadonlyArray<string> = new PickGameComponent().gameNameList;


    beforeEach(fakeAsync(async() => {
        await TestBed.configureTestingModule({
            imports: [
                AppModule,
                RouterTestingModule.withRoutes([
                    { path: 'local', component: LocalGameWrapperComponent }]),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: ActivatedRoute, useValue: activatedRouteStub },
                { provide: AuthenticationService, useClass: AuthenticationServiceMock },
            ],
        }).compileComponents();
        AuthenticationServiceMock.setUser(AuthenticationService.NOT_CONNECTED);
    }));
    it('Clicks method should refuse when observer click', fakeAsync(async() => {
        const clickableMethods: { [gameName: string]: { [methodName: string]: unknown[] } } = {
            Awale: { onClick: [0, 0] },
            Coerceo: { onClick: [0, 0] },
            Dvonn: { onClick: [0, 0] },
            Encapsule: {
                onBoardClick: [0, 0],
                onPieceClick: [0, EncapsulePiece.BIG_WHITE, 0],
            },
            Epaminondas: { onClick: [0, 0] },
            Gipf: { onClick: [0, 0] },
            Go: { onClick: [0, 0] },
            Kamisado: { onClick: [0, 0] },
            LinesOfAction: { onClick: [0, 0] },
            MinimaxTesting: {
                chooseRight: [],
                chooseDown: [],
            },
            P4: { onClick: [0, 0] },
            Pentago: {
                onClick: [0, 0],
                rotate: [['not relevant', 0, true]],
                skipRotation: [],
            },
            Pylos: { onClick: [0, 0] },
            Quarto: {
                chooseCoord: [0, 0],
                choosePiece: [0],
            },
            Quixo: {
                onBoardClick: [0, 0],
                chooseDirection: [0],
            },
            Reversi: { onClick: [0, 0] },
            Sahara: { onClick: [0, 0] },
            Siam: {
                insertAt: [0, 0],
                clickPiece: [0, 0],
                chooseDirection: [0],
                chooseOrientation: [0],
            },
            Six: {
                onPieceClick: [0, 0],
                onNeighboorClick: [0, 0],
            },
            Tablut: { onClick: [0, 0] },
        };
        const refusal: MGPValidation =
            MGPValidation.failure('cloning feature will be added soon. Meanwhile, you can\'t click on the board');
        for (const gameName of gameList) {
            const game: { [methodName: string]: unknown[] } = clickableMethods[gameName];
            if (game == null) {
                throw new Error('Please define ' + gameName + ' clickable method in here to test them.');
            }
            activatedRouteStub.setRoute('compo', gameName);
            fixture = TestBed.createComponent(LocalGameWrapperComponent);
            component = fixture.debugElement.componentInstance;
            component.observerRole = 2;
            fixture.detectChanges();
            tick(1);
            expect(component.gameComponent).toBeDefined();
            for (const methodName of Object.keys(game)) {
                const clickResult: MGPValidation = await component.gameComponent[methodName](...game[methodName]);
                expect(clickResult).toEqual(refusal);
            }
        }
        flush();
    }));
});
