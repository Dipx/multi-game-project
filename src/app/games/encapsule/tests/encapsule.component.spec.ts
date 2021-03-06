import { EncapsuleComponent, EncapsuleComponentFailure } from '../encapsule.component';
import { EncapsuleMove } from 'src/app/games/encapsule/EncapsuleMove';
import { Coord } from 'src/app/jscaip/Coord';
import { EncapsuleCase, EncapsulePartSlice } from 'src/app/games/encapsule/EncapsulePartSlice';
import { EncapsuleFailure } from 'src/app/games/encapsule/EncapsuleRules';
import { EncapsuleMinimax } from 'src/app/games/encapsule/EncapsuleMinimax';
import { Player } from 'src/app/jscaip/Player';
import { EncapsulePiece } from 'src/app/games/encapsule/EncapsulePiece';
import { ComponentTestUtils } from 'src/app/utils/tests/TestUtils.spec';
import { fakeAsync } from '@angular/core/testing';
import { MGPNode } from 'src/app/jscaip/MGPNode';

describe('EncapsuleComponent', () => {
    let componentTestUtils: ComponentTestUtils<EncapsuleComponent>;

    const _: number = new EncapsuleCase(Player.NONE, Player.NONE, Player.NONE).encode();
    const emptyBoard: number[][] = [
        [_, _, _],
        [_, _, _],
        [_, _, _],
    ];
    const P0Turn: number = 6;

    beforeEach(fakeAsync(async() => {
        componentTestUtils = await ComponentTestUtils.forGame<EncapsuleComponent>('Encapsule');
    }));
    it('should create', () => {
        expect(componentTestUtils.wrapper).toBeTruthy('Wrapper should be created');
        expect(componentTestUtils.getComponent()).toBeTruthy('EncapsuleComponent should be created');
    });
    it('should drop a piece on the board when selecting it and dropping it', fakeAsync(async() => {
        await componentTestUtils.expectClickSuccess('#piece_0_SMALL_BLACK');

        const move: EncapsuleMove = EncapsuleMove.fromDrop(EncapsulePiece.SMALL_BLACK, new Coord(0, 0));
        await componentTestUtils.expectMoveSuccess('#click_0_0', move);
    }));
    it('should forbid clicking directly on the board without selecting a piece', fakeAsync(async() => {
        await componentTestUtils.expectClickFailure('#click_0_0', EncapsuleComponentFailure.INVALID_PIECE_SELECTED);
    }));
    it('should allow dropping a piece on a smaller one', fakeAsync(async() => {
        const x: number = new EncapsuleCase(Player.ONE, Player.NONE, Player.NONE).encode();
        const board: number[][] = [
            [_, _, _],
            [x, _, _],
            [_, _, _],
        ];
        componentTestUtils.setupSlice(new EncapsulePartSlice(board, P0Turn, [EncapsulePiece.MEDIUM_BLACK]));
        await componentTestUtils.expectClickSuccess('#piece_0_MEDIUM_BLACK');

        const move: EncapsuleMove = EncapsuleMove.fromDrop(EncapsulePiece.MEDIUM_BLACK, new Coord(0, 1));
        await componentTestUtils.expectMoveSuccess('#click_0_1', move);
    }));
    it('should forbid dropping a piece on a bigger one', fakeAsync(async() => {
        const x: number = new EncapsuleCase(Player.NONE, Player.ONE, Player.NONE).encode();
        const board: number[][] = [
            [_, _, _],
            [x, _, _],
            [_, _, _],
        ];
        componentTestUtils.setupSlice(new EncapsulePartSlice(board, P0Turn, [EncapsulePiece.SMALL_BLACK]));
        await componentTestUtils.expectClickSuccess('#piece_0_SMALL_BLACK');

        const move: EncapsuleMove = EncapsuleMove.fromDrop(EncapsulePiece.SMALL_BLACK, new Coord(0, 1));
        await componentTestUtils.expectMoveFailure('#click_0_1', EncapsuleFailure.INVALID_PLACEMENT, move);
    }));
    it('should forbid selecting a piece that is not remaining', fakeAsync(async() => {
        componentTestUtils.setupSlice(new EncapsulePartSlice(emptyBoard, P0Turn, []));

        componentTestUtils.expectElementNotToExist('#piece_0_SMALL_BLACK');
    }));
    it('should forbid selecting a piece from the other player', fakeAsync(async() => {
        componentTestUtils.setupSlice(new EncapsulePartSlice(emptyBoard, P0Turn, [EncapsulePiece.SMALL_WHITE]));

        await componentTestUtils.expectClickFailure('#piece_1_SMALL_WHITE', EncapsuleComponentFailure.NOT_DROPPABLE);
    }));
    it('should move a piece when clicking on the piece and clicking on its destination coord', fakeAsync(async() => {
        const x: number = new EncapsuleCase(Player.NONE, Player.ZERO, Player.NONE).encode();
        const board: number[][] = [
            [_, _, _],
            [x, _, _],
            [_, _, _],
        ];
        componentTestUtils.setupSlice(new EncapsulePartSlice(board, P0Turn, []));

        await componentTestUtils.expectClickSuccess('#click_0_1');

        const move: EncapsuleMove = EncapsuleMove.fromMove(new Coord(0, 1), new Coord(0, 2));
        await componentTestUtils.expectMoveSuccess('#click_0_2', move);
    }));
    it('should forbid moving from a case that the player is not controlling', fakeAsync(async() => {
        const x: number = new EncapsuleCase(Player.NONE, Player.ONE, Player.NONE).encode();
        const board: number[][] = [
            [_, _, _],
            [x, _, _],
            [_, _, _],
        ];
        componentTestUtils.setupSlice(new EncapsulePartSlice(board, P0Turn, []));

        await componentTestUtils.expectClickFailure('#click_0_1', EncapsuleComponentFailure.INVALID_PIECE_SELECTED);
    }));
    it('should allow moving a piece on top of a smaller one', fakeAsync(async() => {
        const x: number = new EncapsuleCase(Player.NONE, Player.ZERO, Player.NONE).encode();
        const X: number = new EncapsuleCase(Player.NONE, Player.NONE, Player.ZERO).encode();
        const board: number[][] = [
            [_, _, _],
            [x, X, _],
            [_, _, _],
        ];
        componentTestUtils.setupSlice(new EncapsulePartSlice(board, P0Turn, []));

        await componentTestUtils.expectClickSuccess('#click_1_1');

        const move: EncapsuleMove = EncapsuleMove.fromMove(new Coord(1, 1), new Coord(0, 1));
        await componentTestUtils.expectMoveSuccess('#click_0_1', move);
    }));
    it('should forbid moving a piece on top of a bigger one', fakeAsync(async() => {
        const x: number = new EncapsuleCase(Player.NONE, Player.ZERO, Player.NONE).encode();
        const X: number = new EncapsuleCase(Player.NONE, Player.NONE, Player.ZERO).encode();
        const board: number[][] = [
            [_, _, _],
            [x, X, _],
            [_, _, _],
        ];
        componentTestUtils.setupSlice(new EncapsulePartSlice(board, P0Turn, []));

        await componentTestUtils.expectClickSuccess('#click_0_1');

        const move: EncapsuleMove = EncapsuleMove.fromMove(new Coord(0, 1), new Coord(1, 1));
        await componentTestUtils.expectMoveFailure('#click_1_1', EncapsuleFailure.INVALID_PLACEMENT, move);
    }));
    it('should detect victory', fakeAsync(async() => {
        const x: number = new EncapsuleCase(Player.NONE, Player.ZERO, Player.NONE).encode();
        const X: number = new EncapsuleCase(Player.NONE, Player.NONE, Player.ZERO).encode();
        const board: number[][] = [
            [_, _, _],
            [x, X, _],
            [_, _, _],
        ];
        componentTestUtils.setupSlice(new EncapsulePartSlice(board, P0Turn, [EncapsulePiece.MEDIUM_BLACK]));

        await componentTestUtils.expectClickSuccess('#piece_0_MEDIUM_BLACK');

        const move: EncapsuleMove = EncapsuleMove.fromDrop(EncapsulePiece.MEDIUM_BLACK, new Coord(2, 1));
        await componentTestUtils.expectMoveSuccess('#click_2_1', move);

        const component: EncapsuleComponent = componentTestUtils.getComponent();
        const minimax: EncapsuleMinimax = new EncapsuleMinimax(component.rules, 'EncapsuleMinimax');

        expect(minimax.getBoardValue(new MGPNode(null, move, component.rules.node.gamePartSlice)).value)
            .toBe(Number.MIN_SAFE_INTEGER);
    }));
    it('should forbid selecting the same coord for destination and origin', fakeAsync(async() => {
        const x: number = new EncapsuleCase(Player.NONE, Player.ZERO, Player.NONE).encode();
        const board: number[][] = [
            [_, _, _],
            [x, _, _],
            [_, _, _],
        ];
        componentTestUtils.setupSlice(new EncapsulePartSlice(board, P0Turn, []));

        await componentTestUtils.expectClickSuccess('#click_0_1');

        await componentTestUtils.expectClickFailure('#click_0_1', EncapsuleComponentFailure.SAME_DEST_AS_ORIGIN);
    }));
    it('should forbid selecting a remaining piece is a move is being constructed', fakeAsync(async() => {
        const x: number = new EncapsuleCase(Player.NONE, Player.ZERO, Player.NONE).encode();
        const board: number[][] = [
            [_, _, _],
            [x, _, _],
            [_, _, _],
        ];
        componentTestUtils.setupSlice(new EncapsulePartSlice(board, P0Turn, [EncapsulePiece.SMALL_BLACK]));

        await componentTestUtils.expectClickSuccess('#click_0_1');

        await componentTestUtils.expectClickFailure('#piece_0_SMALL_BLACK', EncapsuleComponentFailure.END_YOUR_MOVE);
    }));
});
