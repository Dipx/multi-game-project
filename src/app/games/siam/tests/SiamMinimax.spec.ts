import { SiamRules, SiamNode } from '../SiamRules';
import { SiamPiece } from '../SiamPiece';
import { MGPNode } from 'src/app/jscaip/MGPNode';
import { SiamPartSlice } from '../SiamPartSlice';
import { SiamMove } from '../SiamMove';
import { Coord } from 'src/app/jscaip/Coord';
import { Orthogonal } from 'src/app/jscaip/Direction';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { Player } from 'src/app/jscaip/Player';
import { SiamMinimax } from '../../siam/SiamMinimax';

describe('SiamMinimax:', () => {

    let minimax: SiamMinimax;

    const _: number = SiamPiece.EMPTY.value;
    const M: number = SiamPiece.MOUNTAIN.value;

    const U: number = SiamPiece.WHITE_UP.value;
    const L: number = SiamPiece.WHITE_LEFT.value;
    const R: number = SiamPiece.WHITE_RIGHT.value;

    const u: number = SiamPiece.BLACK_UP.value;
    const l: number = SiamPiece.BLACK_LEFT.value;
    const r: number = SiamPiece.BLACK_RIGHT.value;
    const d: number = SiamPiece.BLACK_DOWN.value;

    beforeEach(() => {
        minimax = new SiamMinimax(new SiamRules(SiamPartSlice), 'SiamMinimax');
    });
    it('Board value test: Should know who is closer to win (1)', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, M, _],
            [_, M, M, U, _],
            [_, _, u, _, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const move: SiamMove = new SiamMove(3, 3, MGPOptional.of(Orthogonal.UP), Orthogonal.UP);
        expect(minimax.getBoardValue(new MGPNode(null, move, slice)).value)
            .toBeLessThan(0, 'First player should be considered as closer to victory');
    });
    it('Board value test: Should know who is closer to win (2)', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, M, M, M, _],
            [_, _, _, _, _],
            [_, _, U, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const move: SiamMove = new SiamMove(2, 5, MGPOptional.of(Orthogonal.UP), Orthogonal.UP);
        expect(minimax.getBoardValue(new MGPNode(null, move, slice)).value)
            .toBeLessThan(0, 'First player should be considered as closer to victory');
    });
    xit('Best choice test: Should choose victory immediately', () => {
        const board: number[][] = [
            [_, U, _, M, _],
            [_, _, _, U, _],
            [_, M, M, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const node: SiamNode = new MGPNode(null, null, slice);
        const chosenMove: SiamMove = node.findBestMove(1, minimax);
        const bestMove: SiamMove = new SiamMove(3, 1, MGPOptional.of(Orthogonal.UP), Orthogonal.UP);
        expect(chosenMove).toEqual(bestMove);
        expect(node.countDescendants()).toBe(1, 'Pre-victory node should only have victory child');
    });
    it('Best choice test: Should consider pushing as the best option', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, M, _],
            [_, M, M, U, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const node: SiamNode = new MGPNode(null, null, slice);
        const chosenMove: SiamMove = node.findBestMove(1, minimax);
        const bestMove: SiamMove = new SiamMove(3, 2, MGPOptional.of(Orthogonal.UP), Orthogonal.UP);
        expect(chosenMove).toEqual(bestMove);
    });
    it('Best choice test: Pushing from outside could be considered the best option', () => {
        const board: number[][] = [
            [_, _, _, d, _],
            [_, _, _, d, _],
            [L, M, M, M, R],
            [_, _, _, U, _],
            [_, _, _, U, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const node: SiamNode = new MGPNode(null, null, slice);
        const moves: SiamMove[] = minimax.getListMoves(node);
        const moveType: { [moveTYpe: string]: number} = {
            moving: 0,
            rotation: 0,
            pushingInsertion: 0,
            slidingInsertion: 0,
        };
        for (const move of moves) {
            if (move.isInsertion()) {
                if (move.landingOrientation === move.moveDirection.get()) {
                    moveType.pushingInsertion = moveType.pushingInsertion + 1;
                } else {
                    moveType.slidingInsertion = moveType.slidingInsertion + 1;
                }
            } else if (move.isRotation()) {
                moveType.rotation = moveType.rotation + 1;
            } else {
                moveType.moving = moveType.moving + 1;
            }
        }
        const chosenMove: SiamMove = node.findBestMove(1, minimax);
        const bestMove: SiamMove = new SiamMove(3, 5, MGPOptional.of(Orthogonal.UP), Orthogonal.UP);
        expect(chosenMove).toEqual(bestMove);
        expect(moveType).toEqual({ moving: 35, rotation: 12, pushingInsertion: 18, slidingInsertion: 16 });
    });
    it('Best choice test: Inserting a piece when 5 player are on the board should not be an option', () => {
        const board: number[][] = [
            [d, _, _, d, _],
            [d, _, _, d, _],
            [_, M, M, U, _],
            [d, _, _, U, _],
            [_, _, _, M, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 1);
        const node: SiamNode = new MGPNode(null, null, slice);
        const moves: SiamMove[] = minimax.getListMoves(node);
        let isInsertionPossible: boolean = false;
        for (const move of moves) {
            if (move.isInsertion()) {
                isInsertionPossible = true;
                break;
            }
        }
        expect(isInsertionPossible).toBeFalse();
    });
    it(`Board value test: At equal 'closestPusher' player who'se turn it is to play should have the advantage`, () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, L, M, _],
            [_, _, l, M, _],
            [_, _, _, M, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const move: SiamMove = new SiamMove(1, 2, MGPOptional.of(Orthogonal.RIGHT), Orthogonal.RIGHT);
        const boardValue: number = minimax.getBoardValue(new MGPNode(null, move, slice)).value;
        expect(boardValue).toBeLessThan(0);
    });
    it('Board value test: Symetry test', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, M, M, M, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const move: SiamMove = new SiamMove(1, 2, MGPOptional.of(Orthogonal.RIGHT), Orthogonal.RIGHT);
        const boardValue: number = minimax.getBoardValue(new MGPNode(null, move, slice)).value;

        const symetrySlice: SiamPartSlice = new SiamPartSlice(board, 1);
        const symetryBoardValue: number = minimax.getBoardValue(new MGPNode(null, move, symetrySlice)).value;
        expect(boardValue).toEqual(-1 * symetryBoardValue, 'Both board value should have same absolute value');
    });
    it('Logical test: Should get option for first turn', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, M, M, M, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const pushers: { coord: Coord, distance: number }[] =
            SiamRules.getPushers(slice, [1, 2, 3], [2]);
        expect(pushers.length).toBe(6, 'should not include horizontal push');
        expect(pushers[0].distance).toBe(5, 'should all be to the same distance');
    });
    it('Logical test: Should know how far a mountain is from the border', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, M, M, M, _],
            [_, _, _, U, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const fallingCoord: Coord = new Coord(3, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, fallingCoord, Orthogonal.UP);
        expect(closestPusher).toEqual(MGPOptional.of({
            distance: 3,
            coord: new Coord(3, 3),
        }));
    });
    it('Logical test: Should count rotation as +1 for pushing distance if up-close', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, M, M, M, _],
            [_, _, _, L, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const fallingCoord: Coord = new Coord(3, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, fallingCoord, Orthogonal.UP);
        expect(closestPusher).toEqual(MGPOptional.of({
            distance: 4,
            coord: new Coord(3, 3),
        }));
    });
    it('Logical test: Should not count rotation as +1 for pushing distance if not up-close', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, M, M, M, _],
            [_, _, _, _, _],
            [_, _, _, L, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const fallingCoord: Coord = new Coord(3, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, fallingCoord, Orthogonal.UP);
        expect(closestPusher).toEqual(MGPOptional.of({
            distance: 4,
            coord: new Coord(3, 4),
        }));
    });
    it('Logical test: Should count outside pieces', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, M, M, M, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const fallingCoord: Coord = new Coord(3, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, fallingCoord, Orthogonal.UP);
        expect(closestPusher).toEqual(MGPOptional.of({
            distance: 5,
            coord: new Coord(3, 5),
        }));
    });
    it('Logical test: Should count outside pieces in force conflict', () => {
        const board: number[][] = [
            [_, _, _, d, _],
            [_, _, _, d, _],
            [_, M, M, M, _],
            [_, _, _, U, _],
            [_, _, _, U, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const fallingCoord: Coord = new Coord(3, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, fallingCoord, Orthogonal.UP);
        expect(closestPusher).toEqual(MGPOptional.of({
            distance: 3,
            coord: new Coord(3, 5),
        }));
    });
    it('Logical test: When 5 player on board, no outside pusher can\'t be counted', () => {
        const board: number[][] = [
            [d, _, _, _, R],
            [d, _, _, _, R],
            [d, M, M, M, R],
            [d, _, _, _, R],
            [d, _, _, _, R],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const fallingCoord: Coord = new Coord(3, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, fallingCoord, Orthogonal.UP);
        expect(closestPusher).toEqual(MGPOptional.empty());
    });
    it('Logical test: When pusher is out-powered, pusher should not be counted', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, M, M, _],
            [_, _, _, M, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const fallingCoord: Coord = new Coord(3, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, fallingCoord, Orthogonal.UP);
        expect(closestPusher).toEqual(MGPOptional.empty());
    });
    it('Logical test: When closest pusher is out-powered, furthest pusher should be found', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, M, M, _],
            [_, _, _, M, _],
            [_, _, _, U, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const fallingCoord: Coord = new Coord(3, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, fallingCoord, Orthogonal.UP);
        expect(closestPusher).toEqual(MGPOptional.of({
            distance: 3,
            coord: new Coord(3, 5),
        }));
    });
    it('Logical test: Post-Mountain side pushed pieces should not affect distance calculation', () => {
        const board: number[][] = [
            [_, _, _, r, _],
            [_, _, _, _, _],
            [_, M, M, M, _],
            [_, _, _, _, _],
            [_, _, _, U, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const fallingCoord: Coord = new Coord(3, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, fallingCoord, Orthogonal.UP);
        expect(closestPusher).toEqual(MGPOptional.of({
            distance: 4,
            coord: new Coord(3, 4),
        }));
    });
    it('Should not count unpushable mountains', () => {
        const board: number[][] = [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, M, M, M, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
        ];
        const slice: SiamPartSlice = new SiamPartSlice(board, 0);
        const closestPusher: MGPOptional<{ distance: number, coord: Coord }> =
            SiamRules.getLineClosestPusher(slice, new Coord(4, 2), Orthogonal.RIGHT);
        expect(closestPusher).toEqual(MGPOptional.empty());
    });
    it('Should getScoreFromShortestDistances (Player Zero) correctly', () => {
        const currentPlayer: Player = Player.ZERO;
        const T: number = currentPlayer === Player.ZERO ? -1 : 1;
        const expectedValues: number[][] = [
        // 0:  won     1     2     3     4     5  nothing
            [null, null, null, null, null, null, null], // 1 has won
            [null, T, 55, 56, 57, 58, 59], // 1 has 1
            [null, -55, T, 46, 47, 48, 49], // 1 has 2
            [null, -56, -46, T, 37, 38, 39], // 1 has 3
            [null, -57, -47, -37, T, 28, 29], // 1 has 4
            [null, -58, -48, -38, -28, T, 19], // 1 has 5
            [null, -59, -49, -39, -29, -19, T], // 1 has nothing
        ];
        const actualValues: number[][] = [];
        for (let oneShortestDistance: number = 0; oneShortestDistance <= 6; oneShortestDistance++) {
            actualValues.push([]);
            for (let zeroShortestDistance: number = 0; zeroShortestDistance <= 6; zeroShortestDistance++) {
                if (oneShortestDistance === 0 ||
                    zeroShortestDistance === 0) {
                    actualValues[oneShortestDistance].push(null);
                } else {
                    const actualScore: number = SiamRules.getScoreFromShortestDistances(zeroShortestDistance,
                                                                                        oneShortestDistance,
                                                                                        currentPlayer);
                    actualValues[oneShortestDistance].push(actualScore);
                }
            }
        }
        expect(actualValues).toEqual(expectedValues);
    });
});
