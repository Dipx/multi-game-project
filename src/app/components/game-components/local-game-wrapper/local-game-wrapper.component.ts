import { Component, ComponentFactoryResolver, AfterViewInit,
         ChangeDetectionStrategy, ChangeDetectorRef, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { GamePartSlice } from 'src/app/jscaip/GamePartSlice';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { AuthenticationService } from 'src/app/services/authentication/AuthenticationService';
import { GameWrapper } from 'src/app/components/game-components/GameWrapper';
import { Move } from 'src/app/jscaip/Move';
import { UserService } from 'src/app/services/user/UserService';
import { AbstractGameComponent } from '../AbstractGameComponent';

@Component({
    selector: 'app-local-game-wrapper',
    templateUrl: './local-game-wrapper.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocalGameWrapperComponent extends GameWrapper implements AfterViewInit {

    public VERBOSE = false;

    public playerZeroValue: string = "0";
    public playerOneValue: string = "0";
    public aiDepth: number = 5;

    public botTimeOut: number = 500; // this.aiDepth * 500;

    constructor(componentFactoryResolver: ComponentFactoryResolver,
                actRoute: ActivatedRoute,
                router: Router,
                userService: UserService,
                authenticationService: AuthenticationService,
                private cdr: ChangeDetectorRef) {
        super(componentFactoryResolver, actRoute, router, userService, authenticationService);
        if (this.VERBOSE) console.log("LocalGameWrapper Constructed: "+(this.gameComponent!=null));
    }
    public ngAfterViewInit() {
        setTimeout(() => {
            this.authenticationService.getJoueurObs().subscribe(user => {
                this.userName = user.pseudo;
                if (this.isAI(this.players[0])) this.players[0] = user.pseudo;
                if (this.isAI(this.players[1])) this.players[1] = user.pseudo;
            });
            if (this.VERBOSE) console.log("LocalGameWrapper AfterViewInit: "+(this.gameComponent!=null));
            this.afterGameIncluderViewInit();
            this.cdr.detectChanges();
        }, 1);
    }
    private isAI(player: string): boolean {
        if (player == null) return false;
        return player.substr(0, 3) === "bot"
    }
    public onValidUserMove(move: Move): boolean {
        if (LocalGameWrapperComponent.VERBOSE) {
            console.log('LocalGameWrapperComponent.onValidUserMove');
        }
        const isLegal: boolean = this.gameComponent.rules.choose(move);
        if (isLegal) {
            this.gameComponent.updateBoard();
            this.proposeAIToPlay();
        }
        return isLegal;
    }
    public proposeAIToPlay() {
        // check if ai's turn has come, if so, make her start after a delay
        if (this.isAITurn()) {
            // bot's turn
            setTimeout(() => {
                // called only when it's AI's Turn
                if (!this.gameComponent.rules.node.isEndGame()) {
                    const aiMove: Move = this.gameComponent.rules.node.findBestMoveAndSetDepth(this.aiDepth).move;
                    if (this.gameComponent.rules.choose(aiMove)) {  // TODO: remove since useless
                        this.gameComponent.updateBoard();
                        this.cdr.detectChanges();
                        this.proposeAIToPlay();
                    } else {
                        throw new Error("AI choosed illegal move");
                    }
                }
            }, this.botTimeOut);
        }
    }
    private isAITurn(): boolean {
        const turn = this.gameComponent.rules.node.gamePartSlice.turn % 2;
        const currentPlayer: string = this.players[turn];
        return this.isAI(currentPlayer);
    }
    public switchPlayerOne() { // totally adaptable to other Rules
        this.switchPlayer(0, this.playerZeroValue);
    }
    public switchPlayerTwo() { // totally adaptable to other Rules
        this.switchPlayer(1, this.playerOneValue);
    }
    public switchPlayer(n: 0|1, value: string) {
        const numberValue: number = Number.parseInt(value);
        if (numberValue === 0) {
            this.players[n] = this.authenticationService.getAuthenticatedUser().pseudo;
        } else {
            this.players[n] = 'bot level '+ value;
            this.aiDepth = numberValue;
        }
        this.proposeAIToPlay();
    }
    get compo(): AbstractGameComponent<Move, GamePartSlice, LegalityStatus> {
        return this.gameComponent;
    }
}