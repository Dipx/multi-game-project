import { Rules } from '../../jscaip/Rules';
import { MGPNode } from 'src/app/jscaip/MGPNode';
import { AwalePartSlice } from './AwalePartSlice';
import { AwaleMove } from './AwaleMove';
import { MGPMap } from 'src/app/utils/MGPMap';
import { AwaleLegalityStatus } from './AwaleLegalityStatus';
import { ArrayUtils } from 'src/app/utils/ArrayUtils';
import { display } from 'src/app/utils/utils';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { Player } from 'src/app/jscaip/Player';
import { Coord } from 'src/app/jscaip/Coord';

abstract class AwaleNode extends MGPNode<AwaleRules, AwaleMove, AwalePartSlice, AwaleLegalityStatus> {}

export class AwaleRules extends Rules<AwaleMove, AwalePartSlice, AwaleLegalityStatus> {

    public static VERBOSE: boolean = false;

    public applyLegalMove(move: AwaleMove, slice: AwalePartSlice, status: AwaleLegalityStatus): AwalePartSlice {
        display(AwaleRules.VERBOSE, 'applyLegalMove');
        const turn: number = slice.turn;
        const PLAYER: number = slice.getCurrentPlayer().value;
        const ENNEMY: number = slice.getCurrentEnnemy().value;

        const awalePartSlice: AwalePartSlice = this.node.gamePartSlice;
        const captured: number[] = awalePartSlice.getCapturedCopy();

        captured[PLAYER] += status.captured[PLAYER];
        captured[ENNEMY] += status.captured[ENNEMY];

        return new AwalePartSlice(status.resultingBoard, turn + 1, captured);
    }
    private static mansoon(mansooningPlayer: number, board: number[][]): number {
        /* capture all the seeds of the mansooning player
         * return the sum of all captured seeds
         * is called when a game is over because of starvation
         */
        let sum: number = 0;
        let x: number = 0;
        do {
            sum += board[mansooningPlayer][x];
            board[mansooningPlayer][x] = 0;
            x++;
        } while (x < 6);
        return sum;
    }
    public isLegal(move: AwaleMove, slice: AwalePartSlice): AwaleLegalityStatus {
        /* modify the move to addPart the capture
         * modify the board to get the after-move result
         * return -1 if it's not legal, if so, the board should not be affected
         * return the number captured otherwise
         */
        const turn: number = slice.turn;
        let resultingBoard: number[][] = slice.getCopiedBoard();

        let captured: [number, number] = [0, 0];

        const y: number = move.coord.y;
        const player: number = turn % 2;
        const ennemi: number = (turn + 1) % 2;

        if (y !== player) {
            return AwaleLegalityStatus.failure('you cannot distribute from the ennemy\'s home');
            // on ne distribue que ses maisons
        }
        const x: number = move.coord.x;
        if (resultingBoard[y][x] === 0) {
            return AwaleLegalityStatus.failure('You must choose a non-empty house to distribute.');
        }

        if (!AwaleRules.doesDistribute(x, y, resultingBoard) && AwaleRules.isStarving(ennemi, resultingBoard) ) {
            // you can distribute but you don't, illegal move
            return AwaleLegalityStatus.failure('you can distribute but you don\'t');
        }
        // arrived here you can distribute this house
        // but we'll have to check if you can capture
        const lastCase: Coord = AwaleRules.distribute(x, y, resultingBoard);
        // do the distribution and retrieve the landing part
        // of the last stone
        const landingCamp: number = lastCase.y;
        if (landingCamp === player) {
            // on termine la distribution dans son propre camp, rien d'autre à vérifier
            return { legal: MGPValidation.SUCCESS, captured: [0, 0], resultingBoard };
        }
        // on as donc terminé la distribution dans le camps adverse, capture est de mise
        const boardBeforeCapture: number[][] = ArrayUtils.copyBiArray(resultingBoard);
        captured[player] = AwaleRules.capture(lastCase.x, ennemi, player, resultingBoard);
        if (AwaleRules.isStarving(ennemi, resultingBoard)) {
            if (captured[player] > 0) {
                // if the distribution would capture all seeds
                // the move is legal but the capture is forbidden and cancelled
                resultingBoard = boardBeforeCapture; // undo the capturing
                captured = [0, 0];
            }
        }
        if (AwaleRules.isStarving(player, resultingBoard) && !AwaleRules.canDistribute(ennemi, resultingBoard)) {
            // if the player distributed his last seeds and the opponent could not give him seeds
            captured[ennemi] += AwaleRules.mansoon(ennemi, resultingBoard);
        }
        return { legal: MGPValidation.SUCCESS, captured, resultingBoard };
    }
    private static doesDistribute(x: number, y: number, board: number[][]): boolean {
        if (y === 0) { // distribution from left to right
            return board[y][x] > (5 - x);
        }
        return board[y][x] > x; // distribution from right to left
    }
    private static canDistribute(player: number, board: number[][]): boolean {
        let x: number = 0;
        do {
            if (AwaleRules.doesDistribute(x++, player, board)) {
                return true;
            }
        } while (x < 6);
        return false;
    }
    private static isStarving(player: number, board: number[][]): boolean {
        let i: number = 0;
        do {
            if (board[player][i++] > 0) {
                return false; // found some food there, so not starving
            }
        } while (i < 6);
        return true;
    }
    private static distribute(x: number, y: number, board: number[][]): Coord {
        // just apply's the move on the board (the distribution part)
        // does not make the capture nor verify the legality of the move
        // return the coord of the last case the move got down

        // iy et ix sont les cases initiales
        const ix: number = x;
        const iy: number = y;
        // à retenir pour appliquer la règle de la jachère en cas de tour complet
        let inHand: number = board[y][x];
        board[y][x] = 0; // on vide la case
        while (inHand > 0) {
            // get next case
            if (y === 0) {
                if (x === 5) {
                    y = 1; // passage de frontière du bas vers le haut
                } else {
                    x++; // sens horloger en haut = de gauche à droite
                }
            } else {
                if (x === 0) {
                    y = 0; // passage de frontière du haut vers le bas
                } else {
                    x--; // sens horloger en bas = de droite à gauche
                }
            }
            if ((x !== ix) || (y !== iy)) {
                // pour appliquer la règle de jachère
                board[y][x] += 1;
                inHand--; // on dépose dans cette case une pierre qu'on a en main
            }
        }

        return new Coord(x, y);
    }
    private static capture(x: number, y: number, player: number, board: number[][]): number {
        /* only called if y and player are not equal
         * if the condition are make to make an capture into the ennemi's side are met
         * capture and return the number of captured
         * capture even if this could mean doing an illegal starvation
         */

        let target: number = board[y][x];
        if ((target < 2) || (target > 3)) {
            return 0; // first case not capturable
        }

        let captured: number = 0;
        let direction: number = -1; // by defaut, capture from right to left
        let limite: number = -1;
        if (player === 0) {
            /* if turn == 0 capture is on the bottom line
             * means capture goes from left to right ( + 1)
             * so one ending condition of the loop is reaching index 6
             */
            direction = +1;
            limite = 6;
        }

        do {
            captured += target; // we addPart to the player score the captured seeds
            board[y][x] = 0; // since now they're capture, we get them off the board
            x += direction;
        } while ((x !== limite) && (((target = board[y][x]) === 2) || (target === 3)));
        return captured;
    }
    public getListMoves(n: AwaleNode): MGPMap<AwaleMove, AwalePartSlice> {

        const choices: MGPMap<AwaleMove, AwalePartSlice> = new MGPMap<AwaleMove, AwalePartSlice>();
        const oldSlice: AwalePartSlice = n.gamePartSlice;
        const turn: number = oldSlice.turn;
        const player: number = turn % 2;
        let newMove: AwaleMove;
        let newSlice: AwalePartSlice;
        let x: number = 0;
        do {
            // for each house that might be playable

            if (n.gamePartSlice.getBoardByXY(x, player) !== 0) {
                // if the house is not empty

                newMove = new AwaleMove(x, player);
                const legality: AwaleLegalityStatus = this.isLegal(newMove, oldSlice); // see if the move is legal

                if (legality.legal.isSuccess()) {
                    // if the move is legal, we addPart it to the listMoves
                    const capturedCopy: number[] = oldSlice.getCapturedCopy();
                    capturedCopy[player] += legality.captured[player];
                    capturedCopy[(player + 1) % 2] += legality.captured[(player + 1) % 2];
                    newMove = new AwaleMove(x, player);

                    newSlice = new AwalePartSlice(legality.resultingBoard, turn + 1, capturedCopy);
                    choices.set(newMove, newSlice);
                }
            }
            x++;
        } while (x < 6);
        return choices;
    }
    public getBoardValue(move: AwaleMove, slice: AwalePartSlice): number {

        const player: number = slice.turn % 2;
        const ennemy: number = (player + 1) % 2;
        const captured: number[] = slice.getCapturedCopy();
        const c1: number = captured[1];
        const c0: number = captured[0];
        const board: number[][] = slice.getCopiedBoard();
        if (AwaleRules.isStarving(player, board)) { // TODO tester de l'enlever
            if (!AwaleRules.canDistribute(ennemy, board)) {
                return (c0 > c1) ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
            }
        }

        if (c1 > 24) {
            return Player.ONE.getVictoryValue();
        }
        if (c0 > 24) {
            return Player.ZERO.getVictoryValue();
        }
        return c1 - c0;
    }
}
