import { Component } from '@angular/core';
import { GamePartSlice } from 'src/app/jscaip/GamePartSlice';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { Move } from 'src/app/jscaip/Move';
import { Player } from 'src/app/jscaip/player/Player';
import { AbstractGameComponent } from '../wrapper-components/AbstractGameComponent';

@Component({ template: '' })
export abstract class TriangularGameComponent<M extends Move,
                                              S extends GamePartSlice,
                                              L extends LegalityStatus>
    extends AbstractGameComponent<M, S, L>
{

    public CASE_SIZE: number = 50;

    public getTriangleCoordinate(x: number, y: number) : string {
        if ((x+y)%2 === 1) return this.getDownwardCoordinate(x, y);
        else return this.getUpwardCoordinate(x, y);
    }
    public getDownwardCoordinate(x: number, y: number): string {
        return (x * this.CASE_SIZE / 2) + ',' + (this.CASE_SIZE * y) + ',' +
               ((this.CASE_SIZE / 2) * (x + 1)) + ',' + (this.CASE_SIZE*(y+1)) + ',' +
               ((this.CASE_SIZE / 2) * (x + 2)) + ',' + (this.CASE_SIZE*y) + ',' +
               (x*this.CASE_SIZE / 2) + ',' + (this.CASE_SIZE*y);
    }
    public getUpwardCoordinate(x: number, y: number): string {
        return (x * this.CASE_SIZE / 2) + ',' + (this.CASE_SIZE*(y+1)) + ',' +
               ((this.CASE_SIZE / 2) * (x + 1)) + ',' + (this.CASE_SIZE*y) + ',' +
               ((this.CASE_SIZE / 2) * (x+2)) + ',' + (this.CASE_SIZE*(y+1)) + ',' +
               (x*this.CASE_SIZE / 2) + ',' + (this.CASE_SIZE*(y+1));
    }
    public getPyramidCoordinate(x: number, y: number) : string {
        if ((x+y)%2 === 1) return this.getDownwardPyramidCoordinate(x, y);
        else return this.getUpwardPyramidCoordinate(x, y);
    }
    public getDownwardPyramidCoordinate(x: number, y: number): string {
        const zx: number = this.CASE_SIZE * x / 2;
        const zy: number = this.CASE_SIZE * y;
        const UP_LEFT: string = zx + ', ' + zy;
        const UP_RIGHT: string = (zx+this.CASE_SIZE) + ', ' + zy;
        const DOWN_CENTER: string = (zx+(this.CASE_SIZE/2)) + ', ' + (zy+this.CASE_SIZE);
        const CENTER: string = (zx+(this.CASE_SIZE / 2)) + ', ' + (zy+(this.CASE_SIZE / 2));
        return UP_LEFT + ',' +
               DOWN_CENTER + ',' +
               CENTER + ',' +
               UP_LEFT + ',' +
               CENTER + ',' +
               UP_RIGHT + ',' +
               UP_LEFT + ',' +
               UP_RIGHT + ',' +
               DOWN_CENTER + ',' +
               CENTER + ',' +
               UP_RIGHT;
    }
    public getUpwardPyramidCoordinate(x: number, y: number): string {
        const zx: number = this.CASE_SIZE * x / 2;
        const zy: number = (y + 1) * this.CASE_SIZE;
        const DOWN_LEFT: string = zx + ', ' + zy;
        const DOWN_RIGHT: string = (zx + this.CASE_SIZE) + ', ' + zy;
        const UP_CENTER: string = (zx + (this.CASE_SIZE / 2)) + ', ' + (zy - this.CASE_SIZE);
        const CENTER: string = (zx + (this.CASE_SIZE / 2)) + ', ' + (zy- (this.CASE_SIZE / 2));
        return DOWN_LEFT + ',' +
               UP_CENTER + ',' +
               CENTER + ',' +
               DOWN_LEFT + ',' +
               CENTER + ',' +
               DOWN_RIGHT + ',' +
               DOWN_LEFT + ',' +
               DOWN_RIGHT + ',' +
               UP_CENTER + ',' +
               CENTER + ',' +
               DOWN_RIGHT;
    }
    public getPlayerFill(x: number, y: number): string {
        return this.getPlayerColor(Player.of(this.board[y][x]));
    }
}