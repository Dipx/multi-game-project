import { assert, JSONValue, JSONValueWithoutArray } from 'src/app/utils/utils';

export abstract class Encoder<T> {

    public static of<T>(encode: (t: T) => JSONValue, decode: (n: JSONValue) => T): Encoder<T> {
        return new class extends Encoder<T> {
            public encode(t: T): JSONValue {
                return encode(t);
            }
            public decode(n: JSONValue): T {
                return decode(n);
            }
        };
    }
    public abstract encode(t: T): JSONValue;

    public abstract decode(encoded: JSONValue): T;
}

export abstract class MoveEncoder<T> extends Encoder<T> {

    public encode(t: T): JSONValue {
        return this.encodeMove(t);
    }
    public abstract encodeMove(t: T): JSONValueWithoutArray;

    public decode(n: JSONValue): T {
        assert(Array.isArray(n) === false, 'MoveEncoder.decode called with an array');
        return this.decodeMove(n as JSONValueWithoutArray);
    }
    public abstract decodeMove(encoded: JSONValueWithoutArray): T;
}

export abstract class NumberEncoder<T> extends MoveEncoder<T> {

    public static ofN<T>(max: number,
                         encodeNumber: (t: T) => number,
                         decodeNumber: (n: number) => T)
    : NumberEncoder<T>
    {
        return new class extends NumberEncoder<T> {
            public maxValue(): number {
                return max;
            }
            public encodeNumber(t: T): number {
                return encodeNumber(t);
            }
            public decodeNumber(n: number): T {
                return decodeNumber(n);
            }
        };
    }
    public static booleanEncoder: NumberEncoder<boolean> = new class extends NumberEncoder<boolean> {
        public maxValue(): number {
            return 1;
        }
        public encodeNumber(b: boolean): number {
            if (b) {
                return 1;
            } else {
                return 0;
            }
        }
        public decodeNumber(n: number): boolean {
            if (n === 0) return false;
            if (n === 1) return true;
            throw new Error('Invalid encoded boolean');
        }
    };

    public static numberEncoder(max: number): NumberEncoder<number> {
        return new class extends NumberEncoder<number> {

            public maxValue(): number {
                return max;
            }
            public encodeNumber(n: number): number {
                if (n > max) {
                    throw new Error('Cannot encode number bigger than the max with numberEncoder');
                }
                return n;
            }
            public decodeNumber(encoded: number): number {
                if (encoded > max) {
                    throw new Error('Cannot decode number bigger than the max with numberEncoder');
                }
                return encoded;
            }
        };
    }

    public abstract maxValue(): number

    public shift(): number {
        return this.maxValue() + 1;
    }
    public abstract encodeNumber(t: T): number

    public encodeMove(t: T): JSONValueWithoutArray {
        return this.encodeNumber(t);
    }
    public abstract decodeNumber(n: number): T

    public decodeMove(n: JSONValueWithoutArray): T {
        assert(typeof n === 'number', 'Invalid encoded number');
        return this.decodeNumber(n as number);
    }
}

