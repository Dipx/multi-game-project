import { DvonnPieceStack } from '../dvonn-piece-stack/DvonnPieceStack';
import { DvonnPartSlice } from '../DvonnPartSlice';
import { DvonnRules } from './DvonnRules';
import { Coord } from 'src/app/jscaip/coord/Coord';
import { MGPMap } from 'src/app/utils/mgp-map/MGPMap';
import { DvonnMove } from '../dvonn-move/DvonnMove';
import { Player } from 'src/app/jscaip/player/Player';
import { DvonnBoard } from '../DvonnBoard';
import { NumberTable } from 'src/app/utils/collection-lib/array-utils/ArrayUtils';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';

describe('DvonnRules:', () => {
    let rules: DvonnRules;

    const _: number = DvonnPieceStack.EMPTY.getValue();
    const D: number = DvonnPieceStack.SOURCE.getValue();
    const W: number = DvonnPieceStack.PLAYER_ZERO.getValue();
    const WB: number = new DvonnPieceStack(Player.ZERO, 2, false).getValue();
    const WW: number = new DvonnPieceStack(Player.ZERO, 2, false).getValue();
    const WD: number = new DvonnPieceStack(Player.ZERO, 2, true).getValue();
    const WWW: number = new DvonnPieceStack(Player.ZERO, 3, false).getValue();
    const B: number = DvonnPieceStack.PLAYER_ONE.getValue();
    const BD: number = new DvonnPieceStack(Player.ONE, 2, true).getValue();
    const BB: number = new DvonnPieceStack(Player.ONE, 2, false).getValue();
    const BDB: number = new DvonnPieceStack(Player.ONE, 3, true).getValue();
    const B5: number = new DvonnPieceStack(Player.ONE, 5, false).getValue();
    const B6: number = new DvonnPieceStack(Player.ONE, 6, false).getValue();
    const BD6: number = new DvonnPieceStack(Player.ONE, 6, true).getValue();
    const W6: number = new DvonnPieceStack(Player.ZERO, 6, false).getValue();
    const WD6: number = new DvonnPieceStack(Player.ZERO, 6, true).getValue();

    beforeEach(() => {
        rules = new DvonnRules(DvonnPartSlice);
    });
    it('should be created', () => {
        expect(rules).toBeTruthy();
        expect(rules.node.gamePartSlice.turn).toBe(0, 'Game should start at turn 0');
    });
    it('initial stacks should be of size 1', () => {
        const slice: DvonnPartSlice = rules.node.gamePartSlice;
        for (let y: number = 0; y < DvonnBoard.HEIGHT; y++) {
            for (let x: number = 0; x < DvonnBoard.WIDTH; x++) {
                const coord: Coord = new Coord(x, y);
                if (DvonnBoard.isOnBoard(coord)) {
                    const stack: DvonnPieceStack = DvonnBoard.getStackAt(slice.board, coord);
                    expect(stack.getSize()).toEqual(1);
                    expect(stack.isEmpty()).toBeFalse();
                }
            }
        }
    });
    it('should allow 11 pieces to move in the first turn', () => {
        // 6. Important: a piece or stack that is surrounded on all 6 sides may
        // not be moved. So, at the beginning of the game only the pieces at
        // the edge of the board may move. The pieces that are not positioned at
        // the edge remain blocked for as long as they remain completely
        // surrounded (see diagram below).
        const slice: DvonnPartSlice = rules.node.gamePartSlice;
        const firstTurnMovablePieces: Coord[] = rules.getMovablePieces(slice);
        expect(firstTurnMovablePieces.length).toEqual(11);
    });
    it('should provide 41 moves in the first turn on the balanced board', () => {
        const slice: DvonnPartSlice = rules.node.gamePartSlice;
        const firstTurnMoves: MGPMap<DvonnMove, DvonnPartSlice> = rules.getListMovesFromSlice(null, slice);
        expect(firstTurnMoves.size()).toEqual(41);
        expect(firstTurnMoves.getByIndex(0).value.turn).toEqual(1);
    });
    it('should only allow moves from the current player color', () => {
        const slice: DvonnPartSlice = rules.node.gamePartSlice;
        const movablePieces: Coord[] = rules.getMovablePieces(slice);
        for (const coord of movablePieces) {
            expect(DvonnBoard.getStackAt(slice.board, coord).belongsTo(Player.ZERO));
        }
        const moves: MGPMap<DvonnMove, DvonnPartSlice> = rules.getListMovesFromSlice(null, slice);
        const slice2: DvonnPartSlice = moves.getByIndex(0).value;
        const movablePieces2: Coord[] = rules.getMovablePieces(slice2);
        for (const coord of movablePieces2) {
            expect(DvonnBoard.getStackAt(slice2.board, coord).belongsTo(Player.ONE)).toBeTrue();
        }
        expect(rules.isLegal(DvonnMove.of(new Coord(1, 1), new Coord(1, 2)), slice).legal.isSuccess()).toBeFalse();
    });
    it('should not allow moves for pieces with more than 6 neighbors', () => {
        const slice: DvonnPartSlice = rules.node.gamePartSlice;
        expect(rules.isLegal(DvonnMove.of(new Coord(1, 3), new Coord(1, 2)), slice).legal.isSuccess()).toBeFalse();
    });
    it('should have the target stack owned by the owner of the source stack', () => {
        const expectedBoard: NumberTable = [
            [_, _, W, B, B, B, W, W, B, D, B],
            [_, B, B, W, W, W, B, B, W, B, B],
            [WB, B, B, B, W, D, B, W, W, W, W],
            [_, W, B, W, W, B, B, B, W, W, _],
            [W, D, W, B, B, W, W, W, B, _, _]];
        const slice: DvonnPartSlice = rules.node.gamePartSlice;
        const move: DvonnMove = DvonnMove.of(new Coord(0, 3), new Coord(0, 2));
        const legality: LegalityStatus = rules.isLegal(move, slice);
        expect(legality.legal.isSuccess()).toBeTrue();
        const moveResult: {
            resultingMove: DvonnMove;
            resultingSlice: DvonnPartSlice;
        } = rules.applyLegalMove(move, slice, legality);
        expect(moveResult.resultingMove).toEqual(move);
        expect(moveResult.resultingSlice.board).toEqual(expectedBoard);
        const stack: DvonnPieceStack = DvonnBoard.getStackAt(moveResult.resultingSlice.board, new Coord(0, 2));
        expect(stack.belongsTo(Player.ZERO)).toBeTrue();
    });
    it('should allow moves only to occupied spaces', () => {
        const board: number[][] = [
            [_, _, W, B, _, B, W, _, B, D, B],
            [_, B, B, W, W, W, B, B, W, B, B],
            [B, B, B, _, W, D, _, W, W, W, W],
            [W, _, B, W, W, _, B, B, W, W, _],
            [W, D, W, B, B, W, W, W, B, _, _]];
        const slice : DvonnPartSlice = new DvonnPartSlice(board, 0, false);
        const moves: MGPMap<DvonnMove, DvonnPartSlice> = rules.getListMovesFromSlice(null, slice);
        for (const move of moves.listKeys()) {
            expect(DvonnBoard.getStackAt(board, move.end).isEmpty()).toBeFalse();
        }
        expect(rules.isLegal(DvonnMove.of(new Coord(3, 1), new Coord(3, 2)), slice).legal.isSuccess()).toBeFalse();
    });
    it('should move stacks as a whole, by as many spaces as there are pieces in the stack', () => {
        const board: number[][] = [
            [_, _, WW, B, _, _, _, _, _, _, _],
            [_, WWW, BD, W, W, _, _, D, _, _, _],
            [BB, B, B, _, W, _, _, BB, _, _, _],
            [W, _, B, WWW, W, _, _, _, _, _, _],
            [W, D, W, B, B, W, _, _, _, _, _]];
        const slice : DvonnPartSlice = new DvonnPartSlice(board, 0, false);
        const moves: MGPMap<DvonnMove, DvonnPartSlice> = rules.getListMovesFromSlice(null, slice);
        for (const move of moves.listKeys()) {
            expect(move.length()).toEqual(DvonnBoard.getStackAt(board, move.coord).getSize());
        }
        expect(rules.isLegal(DvonnMove.of(new Coord(2, 0), new Coord(3, 0)), slice).legal.isSuccess()).toBeFalse();
    });
    it('should not allow moves that end on an empty space', () => {
        const board: number[][] = [
            [_, _, WW, B, _, _, _, _, _, _, _],
            [_, WWW, BD, W, W, _, _, D, _, _, _],
            [BB, B, B, _, W, _, _, BB, _, _, _],
            [W, _, B, WWW, W, _, _, _, _, _, _],
            [W, D, W, B, B, W, _, _, _, _, _]];
        const slice : DvonnPartSlice = new DvonnPartSlice(board, 0, false);
        const moves: MGPMap<DvonnMove, DvonnPartSlice> = rules.getListMovesFromSlice(null, slice);
        for (const move of moves.listKeys()) {
            expect(DvonnBoard.getStackAt(board, move.end).isEmpty()).toBeFalse();
        }
    });
    it('should not allow to move a single red piece, but allows stacks with red pieces within it to move', () => {
        const board: number[][] = [
            [_, _, WW, B, _, _, _, _, _, _, _],
            [_, WWW, BD, W, W, _, _, D, _, _, _],
            [BB, B, B, _, W, _, _, BB, _, _, _],
            [W, _, BDB, WWW, W, _, _, _, _, _, _],
            [W, D, W, B, B, W, _, _, _, _, _]];
        const slice: DvonnPartSlice = new DvonnPartSlice(board, 0, false);
        const moves: MGPMap<DvonnMove, DvonnPartSlice> = rules.getListMovesFromSlice(null, slice);
        for (const move of moves.listKeys()) {
            const stack: DvonnPieceStack = DvonnBoard.getStackAt(board, move.coord);
            // every movable piece should belong to the current player
            expect(stack.belongsTo(slice.getCurrentPlayer())).toBeTrue();
        }
        expect(rules.isLegal(DvonnMove.of(new Coord(2, 0), new Coord(2, 4)), slice).legal.isSuccess()).toBeFalse();
    });
    it('should not allow to pass turns if moves are possible', () => {
        const slice: DvonnPartSlice = rules.node.gamePartSlice;
        expect(rules.isLegal(DvonnMove.PASS, slice).legal.isSuccess()).toBeFalse();
    });
    it('should allow to pass turn if no moves are possible', () => {
        const board: number[][] = [
            [_, _, WW, _, _, _, _, _, _, _, _],
            [_, _, D, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _]];
        const slice: DvonnPartSlice = new DvonnPartSlice(board, 0, false);
        const moves: MGPMap<DvonnMove, DvonnPartSlice> = rules.getListMovesFromSlice(null, slice);
        expect(moves.size()).toEqual(1);
        expect(moves.getByIndex(0).key).toEqual(DvonnMove.PASS);
        expect(rules.isLegal(DvonnMove.PASS, slice).legal.isSuccess()).toBeTrue();
        expect(rules.isLegal(DvonnMove.of(new Coord(2, 0), new Coord(2, 1)), slice).legal.isSuccess()).toBeFalse();
    });
    it('should remove of the board any portion disconnected from a source', () => {
        const board: number[][] = [
            [_, _, WW, _, _, B, _, _, _, _, _],
            [_, _, D, W, W, W, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _]];
        const expectedBoard: number[][] = [
            [_, _, WW, _, _, _, _, _, _, _, _],
            [_, _, WD, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _]];
        const slice: DvonnPartSlice = new DvonnPartSlice(board, 0, false);
        const move: DvonnMove = DvonnMove.of(new Coord(3, 1), new Coord(2, 1));
        const legality: LegalityStatus = rules.isLegal(move, slice);
        expect(legality.legal.isSuccess()).toBeTrue();
        const moveResult: {
            resultingMove: DvonnMove;
            resultingSlice: DvonnPartSlice;
        } = rules.applyLegalMove(move, slice, legality);
        expect(moveResult.resultingMove).toEqual(move);
        expect(moveResult.resultingSlice.board).toEqual(expectedBoard);
    });
    it('should end the game when no move can be done', () => {
        const board: number[][] = [
            [_, _, WW, _, _, _, _, _, _, _, _],
            [_, _, D, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _]];
        const slice: DvonnPartSlice = new DvonnPartSlice(board, 10, true);
        expect(rules.getListMovesFromSlice(DvonnMove.PASS, slice).size()).toEqual(0);
    });
    it('should not end if moves can be done', () => {
        const board: number[][] = [
            [_, _, _, _, _, _, _, _, _, BD6, _],
            [_, _, _, B6, WW, _, B5, _, _, _, _],
            [_, _, _, _, W, BD6, W6, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, WD6, _, _, _, _, _, _, _, _, _]];
        const slice: DvonnPartSlice = new DvonnPartSlice(board, 11, true);
        expect(rules.getListMovesFromSlice(DvonnMove.of(new Coord(1, 3), new Coord(1, 4)), slice).size()).toEqual(1);
    });
    it('should assign the right score to winning boards', () => {
        const boardW: number[][] = [
            [_, _, WW, _, _, _, _, _, _, _, _],
            [_, _, D, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _]];
        const boardB: number[][] = [
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, D, BB, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _]];
        const boardDraw: number[][] = [
            [_, _, _, WW, _, _, _, _, _, _, _],
            [_, _, D, BB, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _]];
        const slice1: DvonnPartSlice = new DvonnPartSlice(boardW, 0, false);
        const slice2: DvonnPartSlice = new DvonnPartSlice(boardB, 0, false);
        const slice3: DvonnPartSlice = new DvonnPartSlice(boardDraw, 0, false);
        expect(rules.getBoardValue(null, slice1)).toEqual(Number.MIN_SAFE_INTEGER);
        expect(rules.getBoardValue(null, slice2)).toEqual(Number.MAX_SAFE_INTEGER);
        expect(rules.getBoardValue(null, slice3)).toEqual(0);
    });
});
