import { Coord } from 'src/app/jscaip/Coord';
import { HexaDirection } from 'src/app/jscaip/HexaDirection';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { GipfBoard } from '../GipfBoard';
import { GipfLegalityStatus } from '../GipfLegalityStatus';
import { GipfCapture, GipfMove, GipfPlacement } from '../GipfMove';
import { GipfPartSlice } from '../GipfPartSlice';
import { GipfPiece } from '../GipfPiece';
import { GipfNode, GipfRules } from '../GipfRules';
import { GipfMinimax } from '../GipfMinimax';
import { MGPNode } from 'src/app/jscaip/MGPNode';

describe('GipfRules:', () => {
    // Rules of gipf with the diagrams used in these tests: http://www.gipf.com/gipf/rules/complete_rules.html
    const _: GipfPiece = GipfPiece.EMPTY;
    const A: GipfPiece = GipfPiece.PLAYER_ZERO;
    const B: GipfPiece = GipfPiece.PLAYER_ONE;
    const P0Turn: number = 6;
    const P1Turn: number = P0Turn+1;

    let rules: GipfRules;

    let minimax: GipfMinimax;

    beforeEach(() => {
        rules = new GipfRules(GipfPartSlice);
        minimax = new GipfMinimax(rules, 'GipfMinimax');
    });
    it('should be created', () => {
        expect(rules).toBeTruthy();
        expect(rules.node.gamePartSlice.turn).toBe(0, 'Game should start at turn 0');
    });
    it('should start with the expected board for the basic variant', () => {
        const slice: GipfPartSlice = rules.node.gamePartSlice;
        const board: GipfBoard = slice.hexaBoard;
        const expectedBoard: GipfBoard = GipfBoard.of([
            [_, _, _, B, _, _, A],
            [_, _, _, _, _, _, _],
            [_, _, _, _, _, _, _],
            [A, _, _, _, _, _, B],
            [_, _, _, _, _, _, _],
            [_, _, _, _, _, _, _],
            [B, _, _, A, _, _, _],
        ]);
        board.forEachCoord((c: Coord, content: GipfPiece) => {
            expect(content).toEqual(expectedBoard.getAt(c));
        });
    });
    describe('isLegal and applyLegalMove', () => {
        it('should forbit placements on non-border cases', () => {
            const slice: GipfPartSlice = rules.node.gamePartSlice;
            const placement: GipfPlacement = new GipfPlacement(new Coord(3, 3), MGPOptional.empty());
            const move: GipfMove = new GipfMove(placement, [], []);

            const legality: GipfLegalityStatus = rules.isLegal(move, slice);
            expect(legality.legal.isSuccess()).toBeFalse();
        });
        it('should require a direction when placing a piece on an occupied case', () => {
            const slice: GipfPartSlice = rules.node.gamePartSlice;
            const placement: GipfPlacement = new GipfPlacement(new Coord(3, 0), MGPOptional.empty());
            const move: GipfMove = new GipfMove(placement, [], []);

            const legality: GipfLegalityStatus = rules.isLegal(move, slice);
            expect(legality.legal.isSuccess()).toBeFalse();
        });
        it('should allow simple move without direction when target coord is empty', () => {
            const slice: GipfPartSlice = rules.node.gamePartSlice;
            const placement: GipfPlacement = new GipfPlacement(new Coord(6, 1), MGPOptional.empty());
            const move: GipfMove = new GipfMove(placement, [], []);

            const legality: GipfLegalityStatus = rules.isLegal(move, slice);
            expect(legality.legal.isSuccess()).toBeTrue();

            const resultingSlice: GipfPartSlice = rules.applyLegalMove(move, slice, legality);

            // This is diagram 2b in the rules of Gipf
            const expectedBoard: GipfBoard = GipfBoard.of([
                [_, _, _, B, _, _, A],
                [_, _, _, _, _, _, A],
                [_, _, _, _, _, _, _],
                [A, _, _, _, _, _, B],
                [_, _, _, _, _, _, _],
                [_, _, _, _, _, _, _],
                [B, _, _, A, _, _, _],
            ]);
            resultingSlice.hexaBoard.forEachCoord((c: Coord, content: GipfPiece) => {
                expect(content).toEqual(expectedBoard.getAt(c));
            });
        });

        it('should allow simple moves without captures when possible', () => {
            // This is diagram 2a in the rules of Gipf
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, A, _, _],
                [_, _, _, _, A, _, _],
                [_, _, _, _, _, A, _],
                [A, B, A, _, B, _, _],
                [A, _, _, A, B, B, _],
                [B, _, B, _, _, _, _],
                [_, B, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);
            const placement: GipfPlacement = new GipfPlacement(new Coord(1, 6),
                                                               MGPOptional.of(HexaDirection.UP_RIGHT));
            const move: GipfMove = new GipfMove(placement, [], []);

            const legality: GipfLegalityStatus = rules.isLegal(move, slice);
            expect(legality.legal.isSuccess()).toBeTrue();

            const resultingSlice: GipfPartSlice = rules.applyLegalMove(move, slice, legality);

            // This is diagram 2b in the rules of Gipf
            const expectedBoard: GipfBoard = GipfBoard.of([
                [_, _, _, _, A, _, _],
                [_, _, _, _, A, _, A],
                [_, _, _, _, _, B, _],
                [A, B, A, _, A, _, _],
                [A, _, _, B, B, B, _],
                [B, _, B, _, _, _, _],
                [_, A, _, _, _, _, _],
            ]);
            const expectedSlice: GipfPartSlice = new GipfPartSlice(expectedBoard, P1Turn, [4, 5], [0, 0]);

            expect(resultingSlice.equals(expectedSlice)).toBeTrue();
        });
        it('should not allow placements on blocked lines', () => {
            // This is diagram 3
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, B, B, B, A],
                [_, _, _, _, _, _, A],
                [_, _, _, _, _, A, _],
                [A, B, A, A, B, B, A],
                [_, B, _, A, _, _, _],
                [B, A, B, B, _, _, _],
                [_, A, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);
            const invalidPlacements: GipfPlacement[] = [
                new GipfPlacement(new Coord(3, 0), MGPOptional.of(HexaDirection.DOWN_RIGHT)),
                new GipfPlacement(new Coord(1, 6), MGPOptional.of(HexaDirection.UP_LEFT)),
                new GipfPlacement(new Coord(6, 1), MGPOptional.of(HexaDirection.DOWN_LEFT)),
                new GipfPlacement(new Coord(0, 3), MGPOptional.of(HexaDirection.DOWN_RIGHT)),
                new GipfPlacement(new Coord(6, 3), MGPOptional.of(HexaDirection.UP_RIGHT)),
                new GipfPlacement(new Coord(1, 6), MGPOptional.of(HexaDirection.UP_RIGHT)),
            ];
            for (const placement of invalidPlacements) {
                const move: GipfMove = new GipfMove(placement, [], []);
                const legality: GipfLegalityStatus = rules.isLegal(move, slice);
                expect(legality.legal.isSuccess()).toBeFalse();
            }
        });
        it('should force to capture consecutive pieces', () => {
            // This is diagram 4 in the rules of Gipf
            const linesAndCaptures: [GipfPiece[], number[]][] = [
                [[B, B, B, B, _, B, A], [0, 1, 2, 3]],
                [[B, B, B, B, A, _, A], [0, 1, 2, 3, 4]],
                [[B, A, B, B, B, B, _], [0, 1, 2, 3, 4, 5]],
                [[A, B, B, B, B, A, B], [0, 1, 2, 3, 4, 5, 6]],
            ];
            for (const [line, capturePositions] of linesAndCaptures) {
                const board: GipfBoard = GipfBoard.of([
                    [_, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _],
                    line,
                    [_, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _],
                    [_, _, _, _, _, _, _],
                ]);
                const slice: GipfPartSlice = new GipfPartSlice(board, P1Turn, [5, 5], [0, 0]);
                const capture: GipfCapture = new GipfCapture(capturePositions.map((q: number) => new Coord(q, 3)));
                const placement: GipfPlacement = new GipfPlacement(new Coord(3, 0), MGPOptional.empty());
                const move: GipfMove = new GipfMove(placement, [capture], []);
                const legality: GipfLegalityStatus = rules.isLegal(move, slice);
                expect(legality.legal.isSuccess()).toBeTrue();
            }
        });
        it('should force to capture when possible', () => {
            // This is diagram 5a
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, B, _, B, B],
                [_, _, _, _, B, A, _],
                [_, _, _, _, B, B, _],
                [B, _, B, B, A, B, B],
                [_, _, A, B, _, _, _],
                [_, B, A, _, _, _, _],
                [A, A, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);
            const firstPlacement: GipfPlacement = new GipfPlacement(new Coord(1, 6),
                                                                    MGPOptional.of(HexaDirection.UP_RIGHT));
            const move: GipfMove = new GipfMove(firstPlacement, [], []);
            const firstLegality: GipfLegalityStatus = rules.isLegal(move, slice);
            expect(firstLegality.legal.isSuccess()).toBeTrue();

            const resultingSlice: GipfPartSlice = rules.applyLegalMove(move, slice, firstLegality);
            const placement: GipfPlacement = new GipfPlacement(new Coord(2, 6),
                                                               MGPOptional.of(HexaDirection.UP_RIGHT));

            const moveWithoutCapture: GipfMove = new GipfMove(placement, [], []);
            const noCaptureLegality: GipfLegalityStatus = rules.isLegal(moveWithoutCapture, resultingSlice);
            expect(noCaptureLegality.legal.isSuccess()).toBeFalse();

            const capture: GipfCapture = new GipfCapture([
                new Coord(2, 3), new Coord(3, 3), new Coord(4, 3), new Coord(5, 3), new Coord(6, 3),
            ]);
            const moveWithCapture: GipfMove = new GipfMove(placement, [capture], []);
            const captureLegality: GipfLegalityStatus = rules.isLegal(moveWithCapture, resultingSlice);
            expect(captureLegality.legal.isSuccess()).toBeTrue();
        });

        it('should let player choose between intersecting captures', () => {
            // This is diagram 6
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, _, _, _],
                [_, _, _, _, _, _, _],
                [_, _, _, A, _, A, _],
                [B, B, B, B, B, _, _],
                [_, A, B, _, _, _, _],
                [A, _, B, _, _, _, _],
                [_, _, B, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P1Turn, [5, 5], [0, 0]);

            const placement: GipfPlacement = new GipfPlacement(new Coord(3, 0),
                                                               MGPOptional.of(HexaDirection.DOWN));


            const capture1: GipfCapture = new GipfCapture([
                new Coord(0, 3), new Coord(1, 3), new Coord(2, 3), new Coord(3, 3), new Coord(4, 3),
            ]);
            const capture2: GipfCapture = new GipfCapture([
                new Coord(2, 6), new Coord(2, 5), new Coord(2, 4), new Coord(2, 3),
            ]);

            const moveWithoutCapture: GipfMove = new GipfMove(placement, [], []);
            const noCaptureLegality: GipfLegalityStatus = rules.isLegal(moveWithoutCapture, slice);
            expect(noCaptureLegality.legal.isSuccess()).toBeFalse();

            const moveWithCapture1: GipfMove = new GipfMove(placement, [capture1], []);
            const capture1Legality: GipfLegalityStatus = rules.isLegal(moveWithCapture1, slice);
            expect(capture1Legality.legal.isSuccess()).toBeTrue();

            const moveWithCapture2: GipfMove = new GipfMove(placement, [capture2], []);
            const capture2Legality: GipfLegalityStatus = rules.isLegal(moveWithCapture2, slice);
            expect(capture2Legality.legal.isSuccess()).toBeTrue();

            const moveWithBothCaptures: GipfMove = new GipfMove(placement, [capture1, capture2], []);
            const capturesLegality: GipfLegalityStatus = rules.isLegal(moveWithBothCaptures, slice);
            expect(capturesLegality.legal.isSuccess()).toBeFalse();
        });
        it('should force both players to capture when possible', () => {
            // This is the board before diagram 7
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, _, _, A],
                [_, _, _, _, _, B, B],
                [_, _, B, _, _, B, _],
                [_, _, A, _, B, _, _],
                [B, A, B, _, _, _, _],
                [_, _, A, _, _, _, _],
                [_, A, A, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);

            const placementA: GipfPlacement = new GipfPlacement(new Coord(0, 4),
                                                                MGPOptional.of(HexaDirection.DOWN_RIGHT));

            const moveANoCapture: GipfMove = new GipfMove(placementA, [], []);
            expect(rules.isLegal(moveANoCapture, slice).legal.isSuccess()).toBeFalse();

            const captureA: GipfCapture = new GipfCapture([
                new Coord(2, 6), new Coord(2, 5), new Coord(2, 4), new Coord(2, 3), new Coord(2, 2),
            ]);

            const moveA: GipfMove = new GipfMove(placementA, [], [captureA]);

            const legalityA: GipfLegalityStatus = rules.isLegal(moveA, slice);
            expect(legalityA.legal.isSuccess()).toBeTrue();

            const resultingSlice: GipfPartSlice = rules.applyLegalMove(moveA, slice, legalityA);

            const placementB: GipfPlacement = new GipfPlacement(new Coord(3, 0),
                                                                MGPOptional.of(HexaDirection.DOWN_RIGHT));
            const moveBNoCapture: GipfMove = new GipfMove(placementB, [], []);
            expect(rules.isLegal(moveBNoCapture, resultingSlice).legal.isSuccess()).toBeFalse();

            const captureB: GipfCapture = new GipfCapture([
                new Coord(3, 4), new Coord(4, 3), new Coord(5, 2), new Coord(6, 1),
            ]);
            const moveB: GipfMove = new GipfMove(placementB, [captureB], []);

            const legalityB: GipfLegalityStatus = rules.isLegal(moveB, resultingSlice);
            expect(legalityB.legal.isSuccess()).toBeTrue();
        });
        it('should not allow invalid initial captures', () => {
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, _, _, A],
                [_, _, _, _, _, B, B],
                [_, _, B, _, _, B, _],
                [_, _, A, _, B, _, _],
                [B, A, A, _, _, _, _],
                [_, _, A, _, _, _, _],
                [_, A, A, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);

            const placement: GipfPlacement = new GipfPlacement(new Coord(-3, 1),
                                                               MGPOptional.of(HexaDirection.DOWN_RIGHT));
            const capture1: GipfCapture = new GipfCapture([
                new Coord(2, 6), new Coord(2, 5), new Coord(2, 3), new Coord(2, 4),
            ]);
            const move1: GipfMove = new GipfMove(placement, [capture1], []);
            const legality1: GipfLegalityStatus = rules.isLegal(move1, slice);
            expect(legality1.legal.isSuccess()).toBeFalse();

            const capture2: GipfCapture = new GipfCapture([
                new Coord(1, 6), new Coord(1, 5), new Coord(1, 3), new Coord(1, 4),
            ]);
            const move2: GipfMove = new GipfMove(placement, [capture2], []);
            const legality2: GipfLegalityStatus = rules.isLegal(move2, slice);
            expect(legality2.legal.isSuccess()).toBeFalse();
        });
        it('should not allow invalid final captures', () => {
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, _, _, A],
                [_, _, _, _, _, B, B],
                [_, _, B, _, _, B, _],
                [_, _, A, _, B, _, _],
                [B, A, B, _, _, _, _],
                [_, _, A, _, _, _, _],
                [_, A, A, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);

            const placement: GipfPlacement = new GipfPlacement(new Coord(0, 4),
                                                               MGPOptional.of(HexaDirection.DOWN_RIGHT));
            const capture: GipfCapture = new GipfCapture([
                new Coord(2, 6), new Coord(2, 5), new Coord(2, 3), new Coord(2, 4),
            ]);
            const move: GipfMove = new GipfMove(placement, [], [capture]);
            const legality: GipfLegalityStatus = rules.isLegal(move, slice);
            expect(legality.legal.isSuccess()).toBeFalse();
        });
        it('should correctly apply move even if the results are not cached in the legality status', () => {
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, A, _, _],
                [_, _, _, _, A, _, _],
                [_, _, _, _, _, A, _],
                [A, B, A, _, B, _, _],
                [A, _, _, A, B, B, _],
                [B, _, B, _, _, _, _],
                [_, B, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);
            const placement: GipfPlacement = new GipfPlacement(new Coord(1, 6),
                                                               MGPOptional.of(HexaDirection.UP_RIGHT));
            const move: GipfMove = new GipfMove(placement, [], []);

            const legality: GipfLegalityStatus = rules.isLegal(move, slice);
            expect(legality.legal.isSuccess()).toBeTrue();

            const resultingSlice: GipfPartSlice =
                rules.applyLegalMove(move, slice, new GipfLegalityStatus(MGPValidation.SUCCESS, null));

            const expectedBoard: GipfBoard = GipfBoard.of([
                [_, _, _, _, A, _, _],
                [_, _, _, _, A, _, A],
                [_, _, _, _, _, B, _],
                [A, B, A, _, A, _, _],
                [A, _, _, B, B, B, _],
                [B, _, B, _, _, _, _],
                [_, A, _, _, _, _, _],
            ]);
            const expectedSlice: GipfPartSlice = new GipfPartSlice(expectedBoard, P1Turn, [4, 5], [0, 0]);

            expect(resultingSlice.equals(expectedSlice)).toBeTrue();
        });
    });
    describe('applyPlacement', () => {
        it('should not allow applying placements where a piece already is no direction is given', () => {
            const slice: GipfPartSlice = rules.node.gamePartSlice;
            const placement: GipfPlacement = new GipfPlacement(new Coord(6, 3), MGPOptional.empty());
            expect(() => GipfRules.applyPlacement(slice, placement)).toThrow();
        });
    });
    describe('getListMoves', () => {
        it('should have 30 moves on the initial slice', () => {
            expect(minimax.getListMoves(rules.node).length).toBe(30);
        });
        it('should have 0 moves on a victory slice', () => {
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, A, _, _],
                [_, _, _, _, A, _, _],
                [_, _, _, _, _, A, _],
                [A, B, A, _, B, _, _],
                [A, _, _, A, B, B, _],
                [B, _, B, _, _, _, _],
                [_, B, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [0, 5], [0, 0]);
            const node: GipfNode = new GipfNode(null, null, slice);
            expect(minimax.getListMoves(node).length).toBe(0);
        });
        it('should have 19 moves on an example slice with non-intersecting capture', () => {
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, _, _, _],
                [_, _, A, A, A, A, _],
                [_, _, _, _, _, A, _],
                [_, A, A, A, A, _, _],
                [_, _, _, A, B, B, _],
                [_, _, B, A, _, _, _],
                [_, _, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);
            const node: GipfNode = new GipfNode(null, null, slice);
            expect(minimax.getListMoves(node).length).toBe(19);
        });
        it('should have 20 moves on an example slice with a complete line', () => {
            // 16 simple moves and 4 diagonal ones on the occupied borders
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, A, _, _, _],
                [_, _, _, B, _, _, _],
                [_, _, _, A, _, _, _],
                [_, _, _, B, _, _, _],
                [_, _, _, A, _, _, _],
                [_, _, _, B, _, _, _],
                [_, _, _, A, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);
            const node: GipfNode = new GipfNode(null, null, slice);
            expect(minimax.getListMoves(node).length).toBe(20);
        });
        it('should have 30 moves on an example slice with all borders occupied', () => {
            // 16 simple moves and 4 diagonal ones on the occupied borders
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, A, B, A, B],
                [_, _, B, _, _, _, A],
                [_, A, _, _, _, _, B],
                [B, _, _, _, _, _, A],
                [A, _, _, _, _, B, _],
                [B, _, _, _, A, _, _],
                [A, B, A, B, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);
            const node: GipfNode = new GipfNode(null, null, slice);
            expect(minimax.getListMoves(node).length).toBe(30);
        });
        it('should have 38 moves on an example slice with intersecting captures', () => {
            // There are 19 valid placements, each can be played with one of 2 captures
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, _, _, _],
                [_, _, _, _, A, _, _],
                [_, _, _, A, _, A, _],
                [_, A, A, A, A, _, _],
                [_, _, _, A, B, B, _],
                [_, _, B, A, _, _, _],
                [_, _, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 0]);
            const node: GipfNode = new GipfNode(null, null, slice);
            expect(minimax.getListMoves(node).length).toBe(38);
        });
    });
    describe('getBoardValue', () => {
        const placement: GipfPlacement = new GipfPlacement(new Coord(1, 6),
                                                           MGPOptional.of(HexaDirection.UP_RIGHT));
        const dummyMove: GipfMove = new GipfMove(placement, [], []);
        it('should declare victory when one player does not have any piece left', () => {
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, A, _, _],
                [_, _, _, _, A, _, _],
                [_, _, _, _, _, A, _],
                [A, B, A, _, B, _, _],
                [A, _, _, A, B, B, _],
                [B, _, B, _, _, _, _],
                [_, B, _, _, _, _, _],
            ]);
            const slice1: GipfPartSlice = new GipfPartSlice(board, P0Turn, [0, 5], [0, 0]);
            expect(minimax.getBoardValue(new MGPNode(null, dummyMove, slice1)).value)
                .toEqual(Number.MAX_SAFE_INTEGER, 'This should be a victory for player 1');
            const slice2: GipfPartSlice = new GipfPartSlice(board, P1Turn, [5, 0], [0, 0]);
            expect(minimax.getBoardValue(new MGPNode(null, dummyMove, slice2)).value)
                .toEqual(Number.MIN_SAFE_INTEGER, 'This should be a victory for player 0');
        });
        it('should favor having captured pieces', () => {
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, A, _, _],
                [_, _, _, _, A, _, _],
                [_, _, _, _, _, A, _],
                [A, B, A, _, B, _, _],
                [A, _, _, A, B, B, _],
                [B, _, B, _, _, _, _],
                [_, B, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 5], [0, 7]);
            expect(minimax.getBoardValue(new MGPNode(null, dummyMove, slice))).toBeLessThan(0);
        });
        it('should favor having pieces to play pieces', () => {
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, A, _, _],
                [_, _, _, _, A, _, _],
                [_, _, _, _, _, A, _],
                [A, B, A, _, B, _, _],
                [A, _, _, A, B, B, _],
                [B, _, B, _, _, _, _],
                [_, B, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [5, 7], [0, 0]);
            expect(minimax.getBoardValue(new MGPNode(null, dummyMove, slice))).toBeLessThan(0);
        });
        it('should not declare victory when one player does not have pieces left but still has an initial capture', () => {
            const board: GipfBoard = GipfBoard.of([
                [_, _, _, _, _, _, _],
                [_, _, _, _, _, _, _],
                [_, _, _, A, _, _, _],
                [_, _, _, A, _, _, _],
                [_, _, _, A, _, _, _],
                [_, _, _, A, _, _, _],
                [_, _, _, _, _, _, _],
            ]);
            const slice: GipfPartSlice = new GipfPartSlice(board, P0Turn, [0, 5], [0, 0]);
            expect(minimax.getBoardValue(new MGPNode(null, dummyMove, slice))).toBeLessThan(Number.MAX_SAFE_INTEGER);
            expect(minimax.getBoardValue(new MGPNode(null, dummyMove, slice))).toBeGreaterThan(Number.MIN_SAFE_INTEGER);
        });
    });
    describe('getAllDirectionsForEntrance', () => {
        it('should fail on non-entrances', () => {
            expect(() => GipfRules.getAllDirectionsForEntrance(rules.node.gamePartSlice, new Coord(3, 3))).toThrow();
        });
    });
});
