import { ArrayUtils } from '../utils/ArrayUtils';
import { JSONValue } from 'src/app/utils/utils';
import { Request } from './request';

export interface ICurrentPart {

    typeGame: string;
    playerZero: string; // id
    turn: number; // -1 before it begin, 0 initial floor
    playerOne?: string; // id

    beginning?: number; // should be date; is a timestamp
    lastMove?: number; // should/could? be a date; is a timestamp

    typePart?: number|string; // amicale, comptabilisée, pédagogique
    result?: IMGPResult; // TODO : voir à mettre unachieved par défaut
    loser?: string; // joueur 1, joueur 2, null
    winner?: string; // joueur 1, joueur 2, null
    scorePlayerZero?: number|string; // TODO : implémenter ça
    scorePlayerOne?: number|string; // TODO : implémenter ça aussi en même temps

    historic?: string; // id (null si non sauvegardée, id d’une Historique sinon) // l'historique est l'arbre en cas de take et retakes
    listMoves: number[]; // ONLY VALABLE FOR Game able to encode and decode their move to numbers
    request?: Request;
}
export class Part {
    public constructor(
        private readonly typeGame: string,
        private readonly playerZero: string,
        public readonly turn: number,
        private readonly listMoves: number[],
        private readonly result: IMGPResult,
        private readonly playerOne?: string,

        private readonly beginning?: number,
        private readonly lastMove?: number,
        private readonly typePart?: number|string,
        private readonly winner?: string,
        private readonly loser?: string,
        private readonly scorePlayerZero?: number|string, // TODO : implémenter ça
        private readonly scorePlayerOne?: number|string, // TODO : implémenter ça aussi en même temps

        private readonly historic?: string,
        private readonly request?: Request,
    ) {
        if (typeGame == null) throw new Error('typeGame can\'t be null');
        if (playerZero == null) throw new Error('playerZero can\'t be null');
        if (turn == null) throw new Error('turn can\'t be null');
        if (listMoves == null) throw new Error('listMoves can\'t be null');
        for (const move of listMoves) {
            if (move == null) {
                throw new Error('No element in listMoves can be null');
            }
        }
        if (result == null || result.value == null) throw new Error('result can\'t be null');
    }
    public copy(): ICurrentPart {
        const copied: ICurrentPart = {
            typeGame: this.typeGame,
            playerZero: this.playerZero,
            turn: this.turn,
            listMoves: ArrayUtils.copyImmutableArray(this.listMoves),
            result: { value: this.result.value },
        };
        if (this.playerOne != null) copied.playerOne = this.playerOne;
        if (this.beginning != null) copied.beginning = this.beginning;
        if (this.lastMove != null) copied.lastMove = this.lastMove;
        if (this.typePart != null) copied.typePart = this.typePart;
        if (this.winner != null) copied.winner = this.winner;
        if (this.loser != null) copied.loser = this.loser;
        if (this.scorePlayerZero != null) copied.scorePlayerZero = this.scorePlayerZero;
        if (this.scorePlayerOne != null) copied.scorePlayerOne = this.scorePlayerOne;
        if (this.historic != null) copied.historic = this.historic;
        if (this.request != null) copied.request = this.request; // TODO deepcopy
        return copied;
    }
    public isDraw(): boolean {
        return this.result.value === MGPResult.DRAW.value;
    }
    public isWin(): boolean {
        return this.result.value === MGPResult.VICTORY.value;
    }
    public isTimeout(): boolean {
        return this.result.value === MGPResult.TIMEOUT.value;
    }
    public isResign(): boolean {
        return this.result.value === MGPResult.RESIGN.value;
    }
    public getWinner(): string {
        return this.winner;
    }
    public getLoser(): string {
        return this.loser;
    }
    public static of(original: ICurrentPart): Part {
        return new Part(
            original.typeGame,
            original.playerZero,
            original.turn,
            ArrayUtils.copyImmutableArray(original.listMoves),
            original.result,
            original.playerOne,
            original.beginning,
            original.lastMove,
            original.typePart,
            original.winner,
            original.loser,
            original.scorePlayerZero,
            original.scorePlayerOne,
            original.historic,
            original.request);
    }
}
export interface ICurrentPartId {

    id: string;

    doc: ICurrentPart;
}
export interface PICurrentPart {
    typeGame?: string;
    playerZero?: string;
    turn?: number; // -1 before it begin, 0 initial floor
    playerOne?: string; // id

    beginning?: number; // should be date; is a timestamp
    lastMove?: JSONValue; // should/could? be a date; is a timestamp

    typePart?: number|string; // amicale, comptabilisée, pédagogique
    result?: IMGPResult;
    loser?: string; // joueur 1, joueur 2, null
    winner?: string; // joueur 1, joueur 2, null
    draw?: boolean;
    scorePlayerZero?: number|string; // TODO : implémenter ça
    scorePlayerOne?: number|string; // TODO : implémenter ça aussi en même temps

    historic?: string; // id (null si non sauvegardée, id d’une Historique sinon) // l'historique est l'arbre en cas de take et retakes
    listMoves?: JSONValue[]; // ONLY VALABLE FOR Game able to encode and decode their move to numbers
    request?: Request;
}
export class MGPResult {
    public static DRAW: MGPResult = new MGPResult(0);

    public static RESIGN: MGPResult = new MGPResult(1);

    public static ESCAPE: MGPResult = new MGPResult(2);

    public static VICTORY: MGPResult = new MGPResult(3);

    public static TIMEOUT: MGPResult = new MGPResult(4);

    public static UNACHIEVED: MGPResult = new MGPResult(5);

    public static AGREED_DRAW: MGPResult = new MGPResult(6);

    private constructor(public readonly value: number) {}

    public toInterface(): IMGPResult {
        return { value: this.value };
    }
}
export interface IMGPResult {
    value: number;
}
