import { Move } from '../../../jscaip/Move';
import { Rules } from '../../../jscaip/Rules';
import { GamePartSlice } from 'src/app/jscaip/GamePartSlice';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { NumberTable } from 'src/app/utils/ArrayUtils';
import { Player } from 'src/app/jscaip/Player';
import { Minimax } from 'src/app/jscaip/Minimax';
import { MoveEncoder } from 'src/app/jscaip/Encoder';

/* All method are to be implemented by the Concretes Game Component
 * Except chooseMove which must be set by the GameWrapper
 * (since OnlineGameWrapper and LocalGameWrapper will not give the same action to do when a move is done)
 */
@Component({
    template: '',
    styleUrls: ['./abstract-game-component.css'],
})
export abstract class AbstractGameComponent<M extends Move,
                                            S extends GamePartSlice,
                                            L extends LegalityStatus = LegalityStatus>
{

    public abstract encoder: MoveEncoder<M>;

    public CASE_SIZE: number = 100;

    public readonly STROKE_WIDTH: number = 8;

    public readonly SMALL_STROKE_WIDTH: number = 2;

    public rules: Rules<M, S, L>;

    public board: NumberTable;

    public canPass: boolean;

    public showScore: boolean;

    public availableMinimaxes: Minimax<Move, GamePartSlice>[];

    public imagesLocation: string = 'assets/images/';

    public isPlayerTurn: () => boolean;

    public chooseMove: (move: Move,
                        slice: GamePartSlice,
                        scorePlayerZero: number,
                        scorePlayerOne: number) => Promise<MGPValidation>;

    public canUserPlay: (element: string) => MGPValidation;

    public cancelMoveOnWrapper: (reason?: string) => void;

    public observerRole: number;
    /* all game rules should be able to call the game-wrapper
     * the aim is that the game-wrapper will take care of manage what follow
     * ie:  - if it's online, he'll tell the game-component when the remote opponent has played
     *      - if it's offline, he'll tell the game-component what the bot have done
     */

    constructor(public snackBar: MatSnackBar) {
    }
    public message(msg: string): void {
        this.snackBar.open(msg, 'Ok!', { duration: 3000, verticalPosition: 'top' });
    }
    public cancelMove(reason?: string): MGPValidation {
        this.cancelMoveAttempt();
        this.cancelMoveOnWrapper(reason);
        if (reason) {
            this.message(reason);
            return MGPValidation.failure(reason);
        } else {
            return MGPValidation.SUCCESS;
        }
    }
    public cancelMoveAttempt(): void {
        // Override if need be
    }

    public abstract updateBoard(): void;

    public getPlayerClass(player: Player): string {
        switch (player) {
            case Player.ZERO: return 'player0';
            case Player.ONE: return 'player1';
            case Player.NONE: return '';
        }
    }
    public getTurn(): number {
        return this.rules.node.gamePartSlice.turn;
    }
}
