import { Coord } from 'src/app/jscaip/coord/Coord';
import { MGPMap } from 'src/app/utils/mgp-map/MGPMap';
import { CoerceoPartSlice } from '../CoerceoPartSlice';
import { CoerceoRules } from '../CoerceoRules';
import { CoerceoFailure } from '../CoerceoFailure';
import { CoerceoMove, CoerceoStep } from '../CoerceoMove';

describe('CoerceoMove', () => {
    it('Should distinguish move and capture based on presence or not of capture', () => {
        const move: CoerceoMove = CoerceoMove.fromDeplacement(new Coord(5, 5), CoerceoStep.UP_RIGHT);
        expect(move.isTileExchange()).toBeFalse();
        const capture: CoerceoMove = CoerceoMove.fromTilesExchange(new Coord(6, 4));
        expect(capture.isTileExchange()).toBeTrue();
    });
    describe('fromMove', () => {
        it('Should not create move with nulls values', () => {
            expect(() => CoerceoMove.fromDeplacement(new Coord(2, 2), null))
                .toThrowError('Step cannot be null.');
        });
        it('Should not create move of invalid distance', () => {
            expect(() => CoerceoMove.fromCoordToCoord(new Coord(2, 2), new Coord(9, 9)))
                .toThrowError(CoerceoFailure.INVALID_DISTANCE);
        });
        it('Should not allow out of range starting coord', () => {
            expect(() => CoerceoMove.fromDeplacement(new Coord(-1, 0), CoerceoStep.LEFT))
                .toThrowError('Starting coord cannot be out of range (width: 15, height: 10).');
        });
        it('Should not allow out of range landing coord', () => {
            expect(() => CoerceoMove.fromDeplacement(new Coord(0, 0), CoerceoStep.LEFT))
                .toThrowError('Landing coord cannot be out of range (width: 15, height: 10).');
        });
    });
    describe('fromTilesExchange', () => {
        it('Should not allow out of range capture coord', () => {
            const reason: string = 'Captured coord cannot be out of range (width: 15, height: 10).';
            expect(() => CoerceoMove.fromTilesExchange(new Coord(-1, 16))).toThrowError(reason);
        });
    });
    describe('Overrides', () => {
        it('should have functionnal equals', () => {
            const a: Coord = new Coord(0, 0);
            const b: Coord = new Coord(2, 0);
            const c: Coord = new Coord(4, 0);
            const d: Coord = new Coord(6, 0);
            const tileExchange: CoerceoMove = CoerceoMove.fromTilesExchange(a);
            const differentCapture: CoerceoMove = CoerceoMove.fromTilesExchange(b);
            const deplacement: CoerceoMove = CoerceoMove.fromCoordToCoord(a, b);
            const differentStart: CoerceoMove = CoerceoMove.fromCoordToCoord(c, b);
            const differentEnd: CoerceoMove = CoerceoMove.fromCoordToCoord(c, d);

            expect(tileExchange.equals(null)).toBeFalse();
            expect(tileExchange.equals(differentCapture)).toBeFalse();
            expect(tileExchange.equals(tileExchange)).toBeTrue();

            expect(deplacement.equals(differentStart)).toBeFalse();
            expect(deplacement.equals(differentEnd)).toBeFalse();
            expect(deplacement.equals(deplacement)).toBeTrue();
        });
        it('Should forbid non integer number to decode', () => {
            expect(() => CoerceoMove.decode(0.5)).toThrowError('EncodedMove must be an integer.');
        });
        it('should delegate decoding to static method', () => {
            const testMove: CoerceoMove = CoerceoMove.fromTilesExchange(new Coord(5, 5));
            spyOn(CoerceoMove, 'decode').and.callThrough();
            testMove.decode(testMove.encode());
            expect(CoerceoMove.decode).toHaveBeenCalledTimes(1);
        });
        it('should stringify nicely', () => {
            const tileExchange: CoerceoMove = CoerceoMove.fromTilesExchange(new Coord(5, 5));
            const deplacement: CoerceoMove = CoerceoMove.fromCoordToCoord(new Coord(5, 5), new Coord(7, 5));
            expect(tileExchange.toString()).toBe('CoerceoMove((5, 5))');
            expect(deplacement.toString()).toBe('CoerceoMove((5, 5) > RIGHT > (7, 5))');
        });
        it('CoerceoMove.encode and CoerceoMove.decode should be reversible', () => {
            const rules: CoerceoRules = new CoerceoRules(CoerceoPartSlice);
            const moves: MGPMap<CoerceoMove, CoerceoPartSlice> = rules.getListMoves(rules.node);
            for (let i: number = 0; i < moves.size(); i++) {
                const move: CoerceoMove = moves.getByIndex(i).key;
                const encodedMove: number = move.encode();
                const decodedMove: CoerceoMove = CoerceoMove.decode(encodedMove);
                expect(decodedMove).toEqual(move);
            }
        });
    });
});