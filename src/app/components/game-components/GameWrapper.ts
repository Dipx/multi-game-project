import { Component, ComponentFactory, ComponentFactoryResolver, ComponentRef, Type, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractGameComponent } from './AbstractGameComponent';
import { GameIncluderComponent } from './game-includer/game-includer.component';
import { UserService } from '../../services/user/UserService';

import { Move } from '../../jscaip/Move';
import { GamePartSlice } from 'src/app/jscaip/GamePartSlice';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';

import { AwaleComponent } from './awale/awale.component';
import { DvonnComponent } from './dvonn/dvonn.component';
import { EncapsuleComponent } from './encapsule/encapsule.component';
import { GoComponent } from './go/go.component';
import { KamisadoComponent } from './kamisado/kamisado.component';
import { MinimaxTestingComponent } from './minimax-testing/minimax-testing.component';
import { P4Component } from './p4/p4.component';
import { PylosComponent } from './pylos/pylos.component';
import { QuartoComponent } from './quarto/quarto.component';
import { QuixoComponent } from './quixo/quixo.component';
import { ReversiComponent } from './reversi/reversi.component';
import { SaharaComponent } from './sahara/sahara.component';
import { SiamComponent } from './siam/siam.component';
import { TablutComponent } from './tablut/tablut.component';

import { AuthenticationService } from 'src/app/services/authentication/AuthenticationService';
import { display } from 'src/app/collectionlib/utils';

@Component({template: ''})
export abstract class GameWrapper {

    public static VERBOSE: boolean = false;

    // component loading
    @ViewChild(GameIncluderComponent)
    public gameIncluder: GameIncluderComponent;

    public gameComponent: AbstractGameComponent<Move, GamePartSlice, LegalityStatus>;

    public userName: string = this.authenticationService.getAuthenticatedUser().pseudo;

    public players: string[] = [null, null];

    public observerRole: number; // TODO: change into Player

    public canPass: boolean;

    public endGame: boolean = false;

    constructor(protected componentFactoryResolver: ComponentFactoryResolver,
                protected actRoute: ActivatedRoute,
                protected router: Router,
                protected userService: UserService,
                protected authenticationService: AuthenticationService,
                ) {
        display(GameWrapper.VERBOSE, 'GameWrapper.constructed: ' + (this.gameIncluder!=null));
    }
    public getMatchingComponent(compoString: string): Type<AbstractGameComponent<Move, GamePartSlice, LegalityStatus>> {
        display(GameWrapper.VERBOSE, 'GameWrapper.getMatchingComponent');

        switch (compoString) {
            case 'Awale':
                return AwaleComponent;
            case 'Dvonn':
                return DvonnComponent;
            case 'Encapsule':
                return EncapsuleComponent;
            case 'Go':
                return GoComponent;
            case 'MinimaxTesting':
                return MinimaxTestingComponent;
            case 'P4':
                return P4Component;
            case 'Pylos':
                return PylosComponent;
            case 'Quarto':
                return QuartoComponent;
            case 'Quixo':
                return QuixoComponent;
            case 'Reversi':
                return ReversiComponent;
            case 'Sahara':
                return SaharaComponent;
            case 'Siam':
                return SiamComponent;
            case 'Tablut':
                return TablutComponent;
            case 'Kamisado':
                return KamisadoComponent;
            default:
                throw new Error("Unknown Games are unwrappable");
        }
    }
    protected afterGameIncluderViewInit() {
        display(GameWrapper.VERBOSE, 'GameWrapper.afterGameIncluderViewInit');

        this.createGameComponent();
        // this.resetGameDatas();
        // should be some kind of session-scope

        this.gameComponent.rules.setInitialBoard();
        this.gameComponent.board = this.gameComponent.rules.node.gamePartSlice.getCopiedBoard();
    }
    protected createGameComponent() {
        display(GameWrapper.VERBOSE, 'GameWrapper.createGameComponent');
        display(GameWrapper.VERBOSE && this.gameIncluder == null, "GameIncluder should be present");

        const compoString: string = this.actRoute.snapshot.paramMap.get('compo');
        const component: Type<AbstractGameComponent<Move, GamePartSlice, LegalityStatus>>
            = this.getMatchingComponent(compoString);
        const componentFactory: ComponentFactory<AbstractGameComponent<Move, GamePartSlice, LegalityStatus>>
            = this.componentFactoryResolver.resolveComponentFactory(component);
        const componentRef: ComponentRef<AbstractGameComponent<Move, GamePartSlice, LegalityStatus>>
            = this.gameIncluder.viewContainerRef.createComponent(componentFactory);
        this.gameComponent = <AbstractGameComponent<Move, GamePartSlice, LegalityStatus>>componentRef.instance; // Shortent by T<S = Truc>
        this.gameComponent.chooseMove = this.receiveChildData; // so that when the game component do a move
        // the game wrapper can then act accordingly to the chosen move.
        this.gameComponent.observerRole = this.observerRole;
        this.canPass = this.gameComponent.canPass;
    }
    public receiveChildData = async(move: Move, slice: GamePartSlice, scorePlayerZero: number, scorePlayerOne: number): Promise<boolean> => {
        const LOCAL_VERBOSE: boolean = false;
        if (!this.isPlayerTurn()) {
            display(GameWrapper.VERBOSE || LOCAL_VERBOSE, 'GameWrapper.receiveChildData says: not your turn');
            return false;
        }
        if (this.endGame) {
            display(GameWrapper.VERBOSE || LOCAL_VERBOSE, 'GameWrapper.receiveChildData says: part is finished');
            return false;
        }
        const legality: LegalityStatus = this.gameComponent.rules.isLegal(move, slice);
        if (legality.legal === false) {
            display(GameWrapper.VERBOSE || LOCAL_VERBOSE, 'GameWrapper.receiveChildData says: move illegal, not transmitting it to db');
            return false;
        }
        await this.onValidUserMove(move, scorePlayerZero, scorePlayerOne);
        display(GameWrapper.VERBOSE || LOCAL_VERBOSE, "GameWrapper.receiveChildData says: valid move legal");
        return true;
    }
    public abstract onValidUserMove(move: Move, scorePlayerZero: number, scorePlayerOne: number): Promise<void>;

    public isPlayerTurn() {
        const turn: number = this.gameComponent.rules.node.gamePartSlice.turn;
        const indexPlayer: number = turn % 2;
        display(GameWrapper.VERBOSE, "It is turn " + turn + "(" + this.players[indexPlayer] + ") and you are " + this.userName);
        return this.players[indexPlayer] === this.userName;
    }
    get compo(): AbstractGameComponent<Move, GamePartSlice, LegalityStatus> {
        return this.gameComponent;
    }
}
