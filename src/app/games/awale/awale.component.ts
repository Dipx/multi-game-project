import { Component } from '@angular/core';
import { AbstractGameComponent } from '../../components/game-components/abstract-game-component/AbstractGameComponent';
import { AwaleRules } from './AwaleRules';
import { AwaleMinimax } from './AwaleMinimax';
import { AwaleMove } from 'src/app/games/awale/AwaleMove';
import { AwalePartSlice } from './AwalePartSlice';
import { AwaleLegalityStatus } from 'src/app/games/awale/AwaleLegalityStatus';
import { Coord } from 'src/app/jscaip/Coord';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { Minimax } from 'src/app/jscaip/Minimax';

@Component({
    selector: 'app-awale-component',
    templateUrl: './awale.component.html',
    styleUrls: ['../../components/game-components/abstract-game-component/abstract-game-component.css'],
})
export class AwaleComponent extends AbstractGameComponent<AwaleMove, AwalePartSlice, AwaleLegalityStatus> {

    public availableMinimaxes: Minimax<AwaleMove, AwalePartSlice, AwaleLegalityStatus>[] = [
        new AwaleMinimax('AwaleMinimax'),
    ];

    public rules: AwaleRules = new AwaleRules(AwalePartSlice);

    public scores: number[] = [0, 0];

    public last: Coord = new Coord(-1, -1);

    private captured: Coord[] = [];

    private moved: Coord[] = [];

    constructor(snackBar: MatSnackBar) {
        super(snackBar);
        this.showScore = true;
        this.updateBoard();
    }
    public updateBoard(): void {
        const slice: AwalePartSlice = this.rules.node.gamePartSlice;
        this.scores = slice.getCapturedCopy();
        this.hidePreviousMove();
        const lastMove: AwaleMove = this.rules.node.move;

        this.board = slice.getCopiedBoard();
        if (lastMove != null) {
            this.last = lastMove.coord;
            this.showPreviousMove();
        } else {
            this.last = null;
        }
    }
    private hidePreviousMove(): void {
        this.captured = [];
        this.moved = [];
    }
    private showPreviousMove(): void {
        const previousSlice: AwalePartSlice = this.rules.node.mother.gamePartSlice;
        for (let y: number = 0; y <= 1; y++) {
            for (let x: number = 0; x <= 5; x++) {
                const coord: Coord = new Coord(x, y);
                const currentValue: number = this.board[y][x];
                const oldValue: number = previousSlice.getBoardAt(coord);
                if (!coord.equals(this.last)) {
                    if (currentValue < oldValue) {
                        this.captured.push(coord);
                    } else if (currentValue > oldValue) {
                        this.moved.push(coord);
                    }
                }
            }
        }
    }
    public async onClick(x: number, y: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#click_' + x + '_' + y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        this.last = new Coord(-1, -1); // now the user stop try to do a move
        // we stop showing him the last move
        const chosenMove: AwaleMove = new AwaleMove(x, y);
        // let's confirm on java-server-side that the move is legal
        return this.chooseMove(chosenMove, this.rules.node.gamePartSlice, this.scores[0], this.scores[1]);
    }
    public getCaseClasses(x: number, y: number): string[] {
        const coord: Coord = new Coord(x, y);
        if (this.captured.some((c: Coord) => c.equals(coord))) {
            return ['captured'];
        } else if (coord.equals(this.last)) {
            return ['moved', 'highlighted'];
        } else if (this.moved.some((c: Coord) => c.equals(coord))) {
            return ['moved'];
        } else {
            return [];
        }
    }
    public decodeMove(encodedMove: number): AwaleMove {
        return AwaleMove.decode(encodedMove);
    }
    public encodeMove(move: AwaleMove): number {
        return AwaleMove.encode(move);
    }
}
