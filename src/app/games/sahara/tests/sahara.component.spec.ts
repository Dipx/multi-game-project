import { SaharaComponent } from '../sahara.component';
import { Coord } from 'src/app/jscaip/coord/Coord';
import { SaharaMove } from 'src/app/games/sahara/SaharaMove';
import { NumberTable } from 'src/app/utils/collection-lib/array-utils/ArrayUtils';
import { SaharaPawn } from 'src/app/games/sahara/SaharaPawn';
import { SaharaPartSlice } from 'src/app/games/sahara/SaharaPartSlice';
import { ComponentTestUtils } from 'src/app/utils/TestUtils.spec';
import { fakeAsync } from '@angular/core/testing';

describe('SaharaComponent', () => {
    let componentTestUtils: ComponentTestUtils<SaharaComponent>;
    const N: number = SaharaPawn.NONE;
    const O: number = SaharaPawn.BLACK;
    const X: number = SaharaPawn.WHITE;
    const _: number = SaharaPawn.EMPTY;

    beforeEach(fakeAsync(() => {
        componentTestUtils = new ComponentTestUtils<SaharaComponent>('Sahara');
    }));
    it('should create', () => {
        expect(componentTestUtils.wrapper).toBeTruthy('Wrapper should be created');
        expect(componentTestUtils.getComponent()).toBeTruthy('Component should be created');
    });
    it('should delegate decoding to move', () => {
        spyOn(SaharaMove, 'decode').and.callThrough();
        componentTestUtils.getComponent().decodeMove(1);
        expect(SaharaMove.decode).toHaveBeenCalledTimes(1);
    });
    it('should delegate encoding to move', () => {
        spyOn(SaharaMove, 'encode').and.callThrough();
        componentTestUtils.getComponent().encodeMove(new SaharaMove(new Coord(1, 1), new Coord(2, 1)));
        expect(SaharaMove.encode).toHaveBeenCalledTimes(1);
    });
    it('Should play correctly shortest victory', fakeAsync(async() => {
        const board: NumberTable = [
            [N, N, _, X, _, _, _, O, X, N, N],
            [N, _, O, _, _, _, _, _, _, _, N],
            [X, _, _, _, _, _, _, _, _, _, O],
            [O, _, _, _, _, _, _, _, _, _, X],
            [N, _, _, _, _, _, _, X, _, _, N],
            [N, N, X, O, _, _, _, _, O, N, N],
        ];
        const initialSlice: SaharaPartSlice = new SaharaPartSlice(board, 2);
        componentTestUtils.setupSlice(initialSlice);

        await componentTestUtils.expectClickSuccess('#click_2_1'); // select first piece
        const move: SaharaMove = new SaharaMove(new Coord(2, 1), new Coord(1, 2));
        await componentTestUtils.expectMoveSuccess('#click_1_2', move); // select landing

        expect(componentTestUtils.wrapper.endGame).toBeTrue();
    }));
    it('should not allow to click on empty case when no pyramid selected', fakeAsync(async() => {
        // given initial board
        // when clicking on empty case, expect move to be refused
        await componentTestUtils.expectClickFailure('#click_2_2', 'Vous devez d\'abord choisir une de vos pyramides!');
    }));
    it('should not allow to select ennemy pyramid', fakeAsync(async() => {
        // given initial board
        // when clicking on empty case, expect move to be refused
        await componentTestUtils.expectClickFailure('#click_0_4', 'Vous devez choisir une de vos pyramides!');
    }));
    it('should not allow to land on ennemy pyramid', fakeAsync(async() => {
        // given initial board
        await componentTestUtils.expectClickSuccess('#click_2_0');
        const move: SaharaMove = new SaharaMove(new Coord(2, 0), new Coord(3, 0));
        await componentTestUtils.expectMoveFailure('#click_3_0', 'Vous devez arriver sur une case vide.', move);
    }));
    it('should not allow to bounce on occupied brown case', fakeAsync(async() => {
        // given initial board
        await componentTestUtils.expectClickSuccess('#click_7_0');
        const move: SaharaMove = new SaharaMove(new Coord(7, 0), new Coord(8, 1));
        const reason: string = 'Vous ne pouvez rebondir que sur les cases rouges!';
        await componentTestUtils.expectMoveFailure('#click_8_1', reason, move);
    }));
    it('should not allow invalid moves', fakeAsync(async() => {
        // given initial board
        await componentTestUtils.expectClickSuccess('#click_0_3');
        const reason: string = 'Vous pouvez vous déplacer maximum de 2 cases, pas de 3.';
        await componentTestUtils.expectClickFailure('#click_2_2', reason);
    }));
});