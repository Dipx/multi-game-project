import { Component } from '@angular/core';
import { AbstractGameComponent } from '../../wrapper-components/AbstractGameComponent';
import { GoMove } from 'src/app/games/go/go-move/GoMove';
import { GoRules } from 'src/app/games/go/go-rules/GoRules';
import { GoPartSlice, Phase, GoPiece } from 'src/app/games/go/go-part-slice/GoPartSlice';
import { Coord } from 'src/app/jscaip/coord/Coord';
import { GoLegalityStatus } from 'src/app/games/go/GoLegalityStatus';
import { GroupDatas } from 'src/app/games/go/group-datas/GroupDatas';
import { MatSnackBar } from '@angular/material/snack-bar';
import { display } from 'src/app/utils/collection-lib/utils';
import { MGPValidation } from 'src/app/utils/mgp-validation/MGPValidation';
import { Table } from 'src/app/utils/collection-lib/array-utils/ArrayUtils';

@Component({
    selector: 'app-go',
    templateUrl: './go.component.html',
})
export class GoComponent extends AbstractGameComponent<GoMove, GoPartSlice, GoLegalityStatus> {
    public static VERBOSE: boolean = false;

    public scores: number[] = [0, 0];

    public rules: GoRules = new GoRules(GoPartSlice);

    public boardInfo: GroupDatas;

    public ko: Coord;

    public last: Coord = new Coord(-1, -1);

    public canPass: boolean;

    public captures: Coord[]= [];

    constructor(public snackBar: MatSnackBar) {
        super(snackBar);
        this.canPass = true;
        this.showScore = true;
    }
    public async onClick(x: number, y: number): Promise<MGPValidation> {
        const clickValidity: MGPValidation = this.canUserPlay('#click_' + x + '_' + y);
        if (clickValidity.isFailure()) {
            return this.cancelMove(clickValidity.getReason());
        }
        this.last = new Coord(-1, -1); // now the user stop try to do a move
        // we stop showing him the last move
        const resultlessMove: GoMove = new GoMove(x, y);
        return this.chooseMove(resultlessMove, this.rules.node.gamePartSlice, this.scores[0], this.scores[1]);
    }
    public decodeMove(encodedMove: number): GoMove {
        return GoMove.decode(encodedMove);
    }
    public encodeMove(move: GoMove): number {
        return move.encode();
    }
    public updateBoard(): void {
        display(GoComponent.VERBOSE, 'updateBoard');

        const slice: GoPartSlice = this.rules.node.gamePartSlice;
        const move: GoMove = this.rules.node.move;
        const koCoord: Coord = slice.koCoord;
        const phase: Phase = slice.phase;

        this.board = slice.getCopiedBoard();
        this.scores = slice.getCapturedCopy();

        if (move != null) {
            this.last = move.coord;
            this.showCaptures();
        }
        this.ko = koCoord;
        this.canPass = phase !== Phase.FINISHED;
    }
    private showCaptures(): void {
        const previousBoard: Table<GoPiece> = this.rules.node.mother.gamePartSlice.getCopiedBoardGoPiece();
        this.captures = [];
        for (let y: number = 0; y < GoPartSlice.HEIGHT; y++) {
            for (let x: number = 0; x < GoPartSlice.WIDTH; x++) {
                if (previousBoard[y][x].isEmpty() === false &&
                    this.board[y][x] === GoPiece.EMPTY.value)
                {
                    this.captures.push(new Coord(x, y));
                }
            }
        }
    }
    public async pass(): Promise<MGPValidation> {
        const phase: Phase = this.rules.node.gamePartSlice.phase;
        if (phase === Phase.PLAYING || phase === Phase.PASSED) {
            return this.onClick(GoMove.PASS.coord.x, GoMove.PASS.coord.y);
        }
        if (phase === Phase.COUNTING || phase === Phase.ACCEPT) {
            return this.onClick(GoMove.ACCEPT.coord.x, GoMove.ACCEPT.coord.y);
        } else {
            this.message('Cannot pass');
            return MGPValidation.failure('Cannot pass');
        }
    }
    public getCaseColor(x: number, y: number): string {
        const piece: GoPiece = this.rules.node.gamePartSlice.getBoardByXYGoPiece(x, y);
        return this.getPlayerColor(piece.getOwner());
    }
    public caseIsFull(x: number, y: number): boolean {
        const piece: GoPiece = this.rules.node.gamePartSlice.getBoardByXYGoPiece(x, y);
        return piece !== GoPiece.EMPTY && !this.isTerritory(x, y);
    }
    public isLastCase(x: number, y: number): boolean {
        return x === this.last.x && y === this.last.y;
    }
    public isThereAKo(): boolean {
        return this.ko != null;
    }
    public isDead(x: number, y: number): boolean {
        return this.rules.node.gamePartSlice.isDead(new Coord(x, y));
    }
    public isTerritory(x: number, y: number): boolean {
        return this.rules.node.gamePartSlice.isTerritory(new Coord(x, y));
    }
}
