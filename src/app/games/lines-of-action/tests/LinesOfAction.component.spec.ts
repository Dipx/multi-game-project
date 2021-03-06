import { fakeAsync } from '@angular/core/testing';
import { Coord } from 'src/app/jscaip/Coord';
import { Player } from 'src/app/jscaip/Player';
import { ComponentTestUtils } from 'src/app/utils/tests/TestUtils.spec';
import { LinesOfActionComponent } from '../LinesOfAction.component';
import { LinesOfActionMove } from '../LinesOfActionMove';
import { LinesOfActionFailure } from '../LinesOfActionFailure';
import { LinesOfActionState } from '../LinesOfActionState';

describe('LinesOfActionComponent', () => {
    let componentTestUtils: ComponentTestUtils<LinesOfActionComponent>;
    const X: number = Player.ZERO.value;
    const O: number = Player.ONE.value;
    const _: number = Player.NONE.value;


    beforeEach(fakeAsync(async() => {
        componentTestUtils = await ComponentTestUtils.forGame<LinesOfActionComponent>('LinesOfAction');
    }));
    it('should create', () => {
        expect(componentTestUtils.wrapper).toBeTruthy('Wrapper should be created');
        expect(componentTestUtils.getComponent()).toBeTruthy('GipfComponent should be created');
    });
    it('should allow a simple move', fakeAsync(async() => {
        await componentTestUtils.expectClickSuccess('#click_2_0');
        const move: LinesOfActionMove = new LinesOfActionMove(new Coord(2, 0), new Coord(2, 2));
        await componentTestUtils.expectMoveSuccess('#click_2_2', move);
    }));
    it('should forbid moving in an invalid direction', fakeAsync(async() => {
        await componentTestUtils.expectClickSuccess('#click_2_0');
        await componentTestUtils.expectClickFailure('#click_4_5', LinesOfActionFailure.INVALID_DIRECTION);
    }));
    it('should forbid selecting a piece that has no valid targets', fakeAsync(async() => {
        const board: number[][] = [
            [O, X, X, X, X, X, X, _],
            [X, X, _, _, _, _, _, O],
            [O, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, O],
            [O, _, _, _, _, _, _, O],
            [O, _, _, _, _, _, _, O],
            [O, _, _, _, _, _, _, O],
            [_, X, _, X, X, X, X, _],
        ];
        const state: LinesOfActionState = new LinesOfActionState(board, 1);
        componentTestUtils.setupSlice(state);

        await componentTestUtils.expectClickFailure('#click_0_0', LinesOfActionFailure.PIECE_CANNOT_MOVE);
    }));
    it('should forbid selecting a piece of the opponent', fakeAsync(async() => {
        await componentTestUtils.expectClickFailure('#click_0_2', LinesOfActionFailure.NOT_YOUR_PIECE);
    }));
    it('should allow selecting a different piece in one click', fakeAsync(async() => {
        await componentTestUtils.expectClickSuccess('#click_2_0');
        await componentTestUtils.expectClickSuccess('#click_3_0');
        const move: LinesOfActionMove = new LinesOfActionMove(new Coord(3, 0), new Coord(3, 2));
        await componentTestUtils.expectMoveSuccess('#click_3_2', move);
    }));
    it('should show selected piece', fakeAsync(async() => {
        await componentTestUtils.expectClickSuccess('#click_2_0');
        const component: LinesOfActionComponent = componentTestUtils.getComponent();
        expect(component.getPieceClasses(2, 0, component.getState().getAt(new Coord(2, 0))))
            .toEqual(['player0', 'selected']);
    }));
    it('should show last move cases', fakeAsync(async() => {
        await componentTestUtils.expectClickSuccess('#click_2_0');
        const move: LinesOfActionMove = new LinesOfActionMove(new Coord(2, 0), new Coord(2, 2));
        await componentTestUtils.expectMoveSuccess('#click_2_2', move);

        const component: LinesOfActionComponent = componentTestUtils.getComponent();
        expect(component.getCaseClasses(2, 2)).toEqual(['moved']);
        expect(component.getCaseClasses(2, 0)).toEqual(['moved']);
    }));
    it('should show captures', fakeAsync(async() => {
        const board: number[][] = [
            [O, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, O],
            [_, _, O, _, _, _, _, _],
            [O, _, _, _, _, _, _, O],
            [O, _, _, _, _, _, _, O],
            [O, _, _, _, _, _, _, O],
            [O, _, _, _, _, _, _, O],
            [_, X, _, X, X, X, X, _],
        ];
        const state: LinesOfActionState = new LinesOfActionState(board, 0);
        componentTestUtils.setupSlice(state);

        await componentTestUtils.expectClickSuccess('#click_2_0');
        const move: LinesOfActionMove = new LinesOfActionMove(new Coord(2, 0), new Coord(2, 2));
        await componentTestUtils.expectMoveSuccess('#click_2_2', move);

        const component: LinesOfActionComponent = componentTestUtils.getComponent();
        expect(component.getCaseClasses(2, 2)).toEqual(['captured']);
    }));
});
