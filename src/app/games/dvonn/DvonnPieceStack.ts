import { DvonnPiece } from "./DvonnPiece";
import { Player } from "src/app/jscaip/Player";

export class DvonnPieceStack {
    public static of(v: number): DvonnPieceStack {
        let value = v;
        let pieces = [];
        while (value !== 0) {
            const pieceValue = (value % (DvonnPiece.MAX_VALUE+1)) - (value % 1);
            value = value / (DvonnPiece.MAX_VALUE+1);
            pieces.push(DvonnPiece.of(pieceValue));
        }
        return new DvonnPieceStack(pieces);
    }
    public static EMPTY: DvonnPieceStack = new DvonnPieceStack([]);
    public static PLAYER_ZERO: DvonnPieceStack = new DvonnPieceStack([DvonnPiece.PLAYER_ZERO]);
    public static PLAYER_ONE: DvonnPieceStack = new DvonnPieceStack([DvonnPiece.PLAYER_ONE]);
    public static SOURCE: DvonnPieceStack = new DvonnPieceStack([DvonnPiece.SOURCE]);

    constructor(public readonly pieces: ReadonlyArray<DvonnPiece>) {
    }
    public getValue(): number {
        let value = 0;
        for (const piece of this.pieces) {
            value = (value * (DvonnPiece.MAX_VALUE+1)) + piece.getValue();
        }
        return value;
    }
    public belongsTo(player: Player): boolean {
        // A stack belongs to a player if the top piece belongs to that player
        return this.pieces.length > 0 && this.pieces[0].belongsTo(player);
    }
    public isEmpty(): boolean {
        return this.pieces.length === 0;
    }
    public size(): number {
        return this.pieces.length;
    }
}
