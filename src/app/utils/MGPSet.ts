import { Comparable, comparableEquals, ComparableObject } from './Comparable';
import { Sets } from './Sets';

export class MGPSet<T extends Comparable> implements ComparableObject {

    constructor(private values?: T[]) {
        if (values == null) {
            this.values = [];
        } else {
            this.values = Sets.toComparableSet(values);
        }
    }
    public equals(other: MGPSet<T>): boolean {
        if (other.size() !== this.size()) {
            return false;
        }
        for (let i: number = 0; i < this.size(); i++) {
            const thisElement: T = this.values[i];
            if (other.contains(thisElement) === false) {
                return false;
            }
        }
        return true;
    }
    public toString(): string {
        const printer: (element: T) => string = (element: T) => element.toString();

        let result: string = '';
        for (const element of this.values) {
            result += printer(element) + ', ';
        }
        return '[' + result.slice(0, -2) + ']';
    }
    public add(element: T): boolean {
        if (this.contains(element)) {
            return false;
        } else {
            this.values.push(element);
            return true;
        }
    }
    public contains(element: T): boolean {
        for (const value of this.values) {
            if (comparableEquals(value, element)) {
                return true;
            }
        }
        return false;
    }
    public size(): number {
        return this.values.length;
    }
    public get(index: number): T {
        return this.values[index];
    }
    public getCopy(): T[] {
        const result: T[] = [];
        for (const value of this.values) {
            result.push(value);
        }
        return result;
    }
}
