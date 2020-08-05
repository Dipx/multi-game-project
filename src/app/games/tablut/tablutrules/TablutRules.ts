import {Orthogonale, Direction} from '../../../jscaip/DIRECTION';
import {Rules} from '../../../jscaip/Rules';
import {Coord} from '../../../jscaip/Coord';
import {MNode} from '../../../jscaip/MNode';
import {TablutPartSlice} from '../TablutPartSlice';
import { TablutMove } from '../tablutmove/TablutMove';
import { MGPMap } from 'src/app/collectionlib/mgpmap/MGPMap';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { TablutRulesConfig } from './TablutRulesConfig';
import { Player } from 'src/app/jscaip/Player';
import { TablutCase } from './TablutCase';
import { MGPOptional } from 'src/app/collectionlib/mgpoptional/MGPOptional';

abstract class TablutNode extends MNode<TablutRules, TablutMove, TablutPartSlice, LegalityStatus> {}

export class TablutRules extends Rules<TablutMove, TablutPartSlice, LegalityStatus> {

    public static VERBOSE: boolean = false;

    // statics fields :

    public static CASTLE_IS_LEFT_FOR_GOOD = false;
    // once the king leave the castle he cannot re-station there
    public static NORMAL_CAPTURE_WORK_ON_THE_KING = false;
    // king can be capture by only two opposed invaders
    public static CAPTURE_KING_AGAINST_THRONE_RULES = false;
    // the throne is considered an ennemy to the king
    public static CAPTURE_PAWN_AGAINST_THRONE_RULES = true;
    // the throne is considered an ennemy to the pawn
    public static THREE_INVADER_AND_A_BORDER_CAN_CAPTURE_KING = true;
    // the king can be captured by only three invaders if he's against the corner

    public static readonly SUCCESS = 10;
    public static readonly NOT_IN_RANGE_ERROR = 20;
    public static readonly SOMETHING_IN_THE_WAY_ERROR = 21;
    public static readonly PAWN_COORD_UNOCCUPIED_ERROR = 22;
    public static readonly MOVING_OPPONENT_PIECE_ERROR = 23;
    public static readonly LANDING_ON_OCCUPIED_CASE_ERROR = 24;
    public static readonly PAWN_LANDING_ON_THRONE_ERROR = 25;
    public static readonly CASTLE_IS_LEFT_FOR_GOOD_ERROR = 26;

    private static readonly NONE = 50;
    private static readonly ENNEMY = 51;
    private static readonly PLAYER = 52;

    // statics methods :
    private static applyLegalMove(move: TablutMove, slice: TablutPartSlice, status: LegalityStatus): { resultingMove: TablutMove; resultingSlice: TablutPartSlice; } {
        if (TablutRules.VERBOSE) console.log( { context: "TablutRules.applyLegalMove(move, slice, status)", move, slice, status } );
        // copies
        const board: number[][] = slice.getCopiedBoard();
        const turn: number = slice.turn;
        const invaderStart: boolean = slice.invaderStart;

        // test
        const player: 0|1 = turn % 2 === 0 ? 0 : 1;
        const resultingBoard: number[][] = TablutRules.tryMove(player, invaderStart, move, board).resultingBoard;
        const resultingSlice: TablutPartSlice = new TablutPartSlice(resultingBoard, turn + 1, invaderStart);
        return {resultingSlice, resultingMove: move};
    }
    public static tryMove(player: 0|1, invaderStart: boolean, move: TablutMove, board: number[][]): {success: number, resultingBoard: number[][]} {
        if (TablutRules.VERBOSE) console.log( { call_context: "TablutRules.tryMove", player, invaderStart, move, board });
        const errorValue: number = this.getMoveValidity(player, invaderStart, move, board);
        if (errorValue !== this.SUCCESS) {
            return {success: errorValue, resultingBoard: null};
        }

        // move is legal here
        const depart: Coord = move.coord;
        const arrival: Coord = move.end;
        board[arrival.y][arrival.x] = board[depart.y][depart.x]; // dédoublement
        board[depart.y][depart.x] = TablutCase.UNOCCUPIED.value; // suppression du précédent
        let captured: Coord;
        for (const d of Orthogonale.ORTHOGONALES) {
            captured = this.tryCapture(player, invaderStart, move.end, d, board);
            if (captured != null) {
                board[captured.y][captured.x] = TablutCase.UNOCCUPIED.value; // do capture, unless if king
            }
        }
        return {success: this.SUCCESS, resultingBoard: board};
    }
    private static getMoveValidity(player: 0|1, invaderStart: boolean, move: TablutMove, board: number[][]): number {
        const cOwner: number = this.getRelativeOwner(player, invaderStart, move.coord, board);
        if (cOwner === this.NONE) {
            return this.PAWN_COORD_UNOCCUPIED_ERROR;
        }
        if (cOwner === this.ENNEMY) { // TODO OwnerEnum/Type
            return this.MOVING_OPPONENT_PIECE_ERROR;
        }

        const landingCoordOwner: number = this.getRelativeOwner(player, invaderStart, move.end, board);
        if (landingCoordOwner !== this.NONE) {
            return this.LANDING_ON_OCCUPIED_CASE_ERROR;
        }
        if (this.isThrone(move.end)) {
            if (this.isKing(board[move.coord.y][move.coord.x])) {
                if (this.isCentralThrone(move.end) && this.CASTLE_IS_LEFT_FOR_GOOD) {
                    return this.CASTLE_IS_LEFT_FOR_GOOD_ERROR;
                }
            } else {
                return this.PAWN_LANDING_ON_THRONE_ERROR;
            }
        }

        const dir: Direction = move.coord.getDirectionToward(move.end);

        const dist: number = move.coord.getOrthogonalDistance(move.end);
        let c: Coord = move.coord.getNext(dir); // the inspected coord
        for (let i = 1; i < dist; i++) {
            if (board[c.y][c.x] !== TablutCase.UNOCCUPIED.value) {
                return this.SOMETHING_IN_THE_WAY_ERROR;
            }
            c = c.getNext(dir);
        }
        return this.SUCCESS;
    }
    private static tryCapture(player: 0|1, invaderStart: boolean, landingPawn: Coord, d: Orthogonale, board: number[][]): Coord {
        const LOCAL_VERBOSE: boolean = false;
        /* landingPawn is the piece that just moved
         * d the direction in witch we look for capture
         * return the captured coord, or null if no capture possible
         * 1. the threatened case dont exist         -> no capture
         * 2: the threatened case is not an ennemy   -> no capture
         * 3: the threatened case is a king -> delegate calculation
         * 4: the threatened case is a pawn -> delegate calculation
         */
        const threatened: Coord = landingPawn.getNext(d);
        if (!threatened.isInRange(TablutRulesConfig.WIDTH, TablutRulesConfig.WIDTH)) {
            return null; // 1: the threatened case dont exist, no capture
        }
        const threatenedPawnOwner: number = this.getRelativeOwner(player, invaderStart, threatened, board);
        if (threatenedPawnOwner !== this.ENNEMY) {
            return null; // 2: the threatened case is not an ennemy
        }
        if (this.isKing(board[threatened.y][threatened.x])) {
            return this.captureKing(player, invaderStart, landingPawn, d, board);
        }
        return this.capturePawn(player, invaderStart, landingPawn, d, board);
    }
    private static isKing(piece: number): boolean {
        return (piece === TablutCase.PLAYER_ZERO_KING.value) ||
               (piece === TablutCase.PLAYER_ONE_KING.value);
    }
    private static captureKing(player: 0|1, invaderStart: boolean, landingPiece: Coord, d: Orthogonale, board: number[][]): Coord {
        /* the king is the next coord after c (in direction d)
         * the landingPiece partipate in the capture
         *
         *  1: allied is out-of-range
         *      2: if two other are invaders AND LEGAL                  -> capture king (1 border + 3 invaders)
         *      3: if one invaders and one empty throne
         *          3.1: if king capturable by empty-throne and borders -> capture king (1 border, 1 throne, 2 invaders)
         *  4: back is empty
         *      5: if back is not a throne                              -> no capture
         *      here, back is an empty throne
         *      6: if king not capturable by empty throne               -> no capture
         *      7: if king capturable by 2                              -> capture king (1 invader + throne)
         *      8: else if two-other-coord are invader                  -> capture king (3 invaders + throne)
         *  9: allied is an invader
         *     10: if king is capturable by two                         -> capture king (2 invaders)
         *     11: if 2 others around king are invaders                 -> capture king (4 invaders)
         * So these are the different victory way for the invaders :
         * - 2 invaders
         * - 1 invaders 1 empty-throne
         * - 3 invaders 1 throne
         * - 2 invaders 1 throne 1 border
         * - 3 invaders 1 border
         * - 4 invaders
         */
        const LOCAL_VERBOSE: boolean = false;
        const kingCoord: Coord = landingPiece.getNext(d);

        const {
            backCoord,  back, backInRange,
            leftCoord,  left,
            rightCoord, right
        } = this.getSurroundings(kingCoord, d, player, invaderStart, board);

        if (!backInRange) { /////////////////////// 1
            let nbInvaders: number = (left === this.PLAYER ? 1 : 0);
            nbInvaders += (right === this.PLAYER ? 1 : 0);
            if (nbInvaders === 2 && this.THREE_INVADER_AND_A_BORDER_CAN_CAPTURE_KING) { // 2
                // king captured by 3 invaders against 1 border
                if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                    console.log('king captured by 3 invaders against 1 border'); }
                return kingCoord;
            } else if (nbInvaders === 1) {
                if (this.isEmptyThrone(leftCoord, board) ||
                    this.isEmptyThrone(rightCoord, board)) {
                    if (this.CAPTURE_KING_AGAINST_THRONE_RULES) { //////////////////////// 3
                        // king captured by 1 border, 1 throne, 2 invaders
                        if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                            console.log('king captured by 2 invaders against 1 corner and 1 border'); }
                        return kingCoord;
                    }
                }
            }
            // those were the only two way to capture against the border
            return null;
        }
        if (back === this.NONE) { //////////////////////////////////////////////////////// 4
            if (!this.isThrone(backCoord)) { ///////////////////////////////////////////// 5
                return null;
            } // here, back is an empty throne
            if (!this.CAPTURE_KING_AGAINST_THRONE_RULES) { /////////////////////////////// 6
                return null;
            } // here king is capturable by this empty throne
            if (this.NORMAL_CAPTURE_WORK_ON_THE_KING) { ////////////////////////////////// 7
                if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                    console.log('king captured by 1 invader and 1 throne'); }
                return kingCoord; // king captured by 1 invader and 1 throne
            }
            if (left === this.PLAYER && right === this.PLAYER) {
                if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                    console.log('king captured by 3 invaders + 1 throne'); }
                return kingCoord; // king captured by 3 invaders + 1 throne
            }
        }
        if (back === this.PLAYER) {
            if (this.NORMAL_CAPTURE_WORK_ON_THE_KING) {
                if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                    console.log('king captured by two invaders'); }
                return kingCoord; // king captured by two invaders
            }
            if (left === this.PLAYER && right === this.PLAYER) {
                if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                    console.log('king captured by 4 invaders'); }
                return kingCoord; // king captured by 4 invaders
            }
        }
        return null;
    }
    public static getSurroundings(c: Coord, d: Direction, player: 0|1, invaderStart: boolean, board: number[][]) {
        const backCoord: Coord = c.getNext(d); // the piece that just move came from the front direction (by definition)
        const backInRange: boolean = backCoord.isInRange(TablutRulesConfig.WIDTH, TablutRulesConfig.WIDTH);
        const back: number = backInRange ?
            this.getRelativeOwner(player, invaderStart, backCoord, board) :
            this.NONE;

        const leftCoord: Coord = c.getLeft(d);
        const leftInRange: boolean = leftCoord.isInRange(TablutRulesConfig.WIDTH, TablutRulesConfig.WIDTH);
        const left: number = leftInRange ?
            this.getRelativeOwner(player, invaderStart, leftCoord, board) :
            this.NONE;

        const rightCoord: Coord = c.getRight(d);
        const rightInRange: boolean = rightCoord.isInRange(TablutRulesConfig.WIDTH, TablutRulesConfig.WIDTH);
        const right: number = rightInRange ?
            this.getRelativeOwner(player, invaderStart, rightCoord, board) :
            this.NONE;
        return {
            backCoord,  back, backInRange,
            leftCoord,  left,
            rightCoord, right
        };
    }
    private static capturePawn(player: 0|1, invaderStart: boolean, c: Coord, d: Orthogonale, board: number[][]): Coord {
        /* the pawn is the next coord after c (in direction d)
         * c partipate in the capture
         *
         * So these are the different capture ways :
         * - 2 ennemies
         * - 1 ennemies 1 empty-throne
         */
        const LOCAL_VERBOSE: boolean = false;

        const threatenedPieceCoord: Coord = c.getNext(d);

        const backCoord: Coord = threatenedPieceCoord.getNext(d); // the piece that just move is always considered in front
        if (!backCoord.isInRange(TablutRulesConfig.WIDTH, TablutRulesConfig.WIDTH)) {
            if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                console.log('cannot capture a pawn against a wall; ' + threatenedPieceCoord + 'threatened by ' + player + '\'s pawn in  ' + c
                    + ' coming from this direction (' + d.x + ', ' + d.y + ')');
            }
            return null; // no ally no sandwich (against pawn)
        }

        const back: number = this.getRelativeOwner(player, invaderStart, backCoord, board);
        if (back === this.NONE) {
            if (!this.isThrone(backCoord)) {
                if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                    console.log('cannot capture a pawn without an ally; ' + threatenedPieceCoord + 'threatened by ' + player + '\'s pawn in  ' + c
                        + ' coming from this direction (' + d.x + ', ' + d.y + ')');
                    console.log('cannot capture a pawn without an ally behind');
                }
                return null;
            } // here, back is an empty throne
            if (this.CAPTURE_PAWN_AGAINST_THRONE_RULES) {
                if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                    console.log('pawn captured by 1 ennemy and 1 throne; ' + threatenedPieceCoord + 'threatened by ' + player + '\'s pawn in  ' + c
                        + ' coming from this direction (' + d.x + ', ' + d.y + ')');
                }
                return threatenedPieceCoord; // pawn captured by 1 ennemy and 1 throne
            }
        }
        if (back === this.PLAYER) {
            if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                console.log('pawn captured by 2 ennemies; ' + threatenedPieceCoord + 'threatened by ' + player + '\'s pawn in  ' + c
                    + ' coming from this direction (' + d.x + ', ' + d.y + ')');
            }
            return threatenedPieceCoord; // pawn captured by two ennemies
        }
        if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
            if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                console.log('no captures; ' + threatenedPieceCoord + 'threatened by ' + player + '\'s pawn in  ' + c
                    + ' coming from this direction (' + d.x + ', ' + d.y + ')');
            }
        }
        return null;
    }
    private static isEmptyThrone(c: Coord, board: number[][]): boolean {
        if (this.isThrone(c)) {
            return board[c.y][c.x] === TablutCase.UNOCCUPIED.value;
        }
        return false;
    }
    public static isThrone(c: Coord): boolean {
        if (this.isExternalThrone(c)) {
            return true;
        } else {
            return this.isCentralThrone(c);
        }
    }
    private static isExternalThrone(c: Coord): boolean {
        const fin = TablutRulesConfig.WIDTH - 1;
        if (c.x === 0) {
            return (c.y === 0) || (c.y === fin);
        } else if (c.x === fin) {
            return (c.y === 0) || (c.y === fin);
        }
        return false;
    }
    private static isCentralThrone(c: Coord): boolean {
        let center: number = TablutRulesConfig.WIDTH / 2;
        center -= center % 2;
        return (c.x === center && c.y === center);
    }
    private static getAbsoluteOwner(c: Coord, invaderStart: boolean, board: ReadonlyArray<ReadonlyArray<number>>): Player {
        const case_c: number = board[c.y][c.x];
        let owner: Player;
        switch (case_c) {
            case TablutCase.PLAYER_ZERO_KING.value:
                owner = Player.ZERO;
                break;
            case TablutCase.PLAYER_ONE_KING.value:
                owner = Player.ONE;
                break;
            case TablutCase.INVADERS.value:
                owner = invaderStart ? Player.ZERO : Player.ONE;
                break;
            case TablutCase.DEFENDERS.value:
                owner = invaderStart ? Player.ONE : Player.ZERO;
                break;
            case TablutCase.UNOCCUPIED.value:
                owner = Player.NONE;
                break;
            default :
                throw new Error('Invalid value on the board');
        }
        return owner;
    }
    public static getRelativeOwner(player: 0|1, invaderStart: boolean, c: Coord, board: ReadonlyArray<ReadonlyArray<number>>): number {
        if (!c.isInRange(TablutRulesConfig.WIDTH, TablutRulesConfig.WIDTH)) {
            throw new Error('cannot call getRelativeOwner on Out Of Range Coord' + c);
        }
        const case_c: number = board[c.y][c.x];
        const owner: Player = this.getAbsoluteOwner(c, invaderStart, board);
        let relativeOwner: number;
        if (owner === Player.NONE) {
            relativeOwner = this.NONE;
        } else if (owner.value === player) {
            relativeOwner = this.PLAYER;
        } else {
            relativeOwner = this.ENNEMY;
        }
        // TESTS
        if (case_c === TablutCase.UNOCCUPIED.value) {
            if (relativeOwner !== this.NONE) {
                console.log('WTF, empty is on no one side but here is on ' + relativeOwner + ' :: ' + owner + ' :: ' + player); }
        } else if (player === 0) {
            if (case_c === TablutCase.INVADERS.value) {
                if (invaderStart) {
                    if (relativeOwner !== this.PLAYER) {
                        console.log('player start, invader start, case is invader, but player don\'t own the case '
                            + relativeOwner + ' :: ' + owner + ' :: ' + player);
                    }
                } else {
                    if (relativeOwner !== this.ENNEMY) {
                        console.log('player start, defender start, case is invader, but is not ennemy ??? '
                            + relativeOwner + ' :: ' + owner + ' :: ' + player);
                    }
                }
            } else {
                // TODO
            }
        } else { // player follow
            if (invaderStart) {
                if (case_c === TablutCase.INVADERS.value) {
                    if (relativeOwner !== this.ENNEMY) {
                        console.log('player follow, invader start, case is invader, but case is not ennemy '
                            + relativeOwner + ' :: ' + owner + ' :: ' + player);
                    }
                }
            } else { // invader follow
                if (case_c === TablutCase.INVADERS.value) {
                    if (relativeOwner !== this.PLAYER) {
                        console.log('player follow, invader follow, case is invader, but player don\t own it ??? '
                            + relativeOwner + ' :: ' + owner + ' :: ' + player);
                    }
                } else {
                    // TODO
                }
            }
        }
        // FIN DE TESTS
        return relativeOwner;
    }
    public static getPossibleDestinations(invaderStart: boolean, depart: Coord, board: number[][]): Coord[] {
        // search the possible destinations for the pawn at "depart"
        const destinations: Coord[] = [];
        let endFound: boolean;
        let foundDestination: Coord;
        for (const dir of Orthogonale.ORTHOGONALES) {
            // we look for empty existing destinations in each direction as far as we can
            foundDestination = depart;
            endFound = false;
            while (!endFound) {
                foundDestination = foundDestination.getNext(dir);
                endFound =
                    !foundDestination.isInRange(TablutRulesConfig.WIDTH, TablutRulesConfig.WIDTH) ||
                    this.getAbsoluteOwner(foundDestination, invaderStart, board) !== Player.NONE;
                if (!endFound) {
                    destinations.push(foundDestination);
                }
            }
        }
        return destinations;
    }
    public static getKingCoord(board: number[][]): MGPOptional<Coord> {
        if (TablutRules.VERBOSE) {
            console.log("TablutRules.getKingCoord");
            console.table(board);
        }
        for (let y = 0; y < TablutRulesConfig.WIDTH; y++) {
            for (let x = 0; x < TablutRulesConfig.WIDTH; x++) {
                if (this.isKing(board[y][x])) {
                    return MGPOptional.of(new Coord(x, y));
                }
            }
        }
        return MGPOptional.empty();
    }
    public static getInvaderVictoryValue(invaderStart: boolean): number {
        if (TablutRules.VERBOSE) {
            console.log('TablutRules.getInvaderVictoryValue');
        }
        if (invaderStart) {
            return Number.MIN_SAFE_INTEGER;
        } else {
            return Number.MAX_SAFE_INTEGER;
        }
    }
    public static getDefenderVictoryValue(invaderStart: boolean): number {
        if (invaderStart) {
            return Number.MAX_SAFE_INTEGER;
        } else {
            return Number.MIN_SAFE_INTEGER;
        }
    }
    public static isPlayerImmobilised(player: 0|1, invaderStart: boolean, board: number[][]) {
        return this.getPlayerListMoves(
            player,
            invaderStart,
            board).length === 0;
    }
    public static getPlayerListPawns(player: 0|1, invaderStart: boolean, board: number[][]): Coord[] {
        const listPawn: Coord[] = [];
        let pawn: Coord;
        let owner: number;
        for (let y = 0; y < TablutRulesConfig.WIDTH; y++) {
            for (let x = 0; x < TablutRulesConfig.WIDTH; x++) {
                // pour chaque case
                pawn = new Coord(x, y);
                owner = this.getRelativeOwner(player, invaderStart, pawn, board);
                if (owner === this.PLAYER) {
                    listPawn.push(pawn);
                }
            }
        }
        return listPawn;
    }
    public static getPlayerListMoves(player: 0|1, invaderStart: boolean, board: number[][]): TablutMove[] {
        // player : 0 for the current player
        //          1 for his ennemy
        const LOCAL_VERBOSE: boolean = false;
        const listMoves: TablutMove[] = [];
        const listPawns: Coord[] = this.getPlayerListPawns(player, invaderStart, board);
        if (LOCAL_VERBOSE) console.log('liste des pions ' + listPawns);

        let pawnDestinations: Coord[];
        let newMove: TablutMove;
        for (const pawn of listPawns) {
            pawnDestinations = this.getPossibleDestinations(invaderStart, pawn, board);
            for (const destination of pawnDestinations) {
                newMove = new TablutMove(pawn, destination);
                listMoves.push(newMove);
            }
        }
        return listMoves;
    }
    public static getBoardValue(board: number[][], invaderStart: boolean): number {
        
        const optionalKingCoord: MGPOptional<Coord> = TablutRules.getKingCoord(board);
        if (!optionalKingCoord.isPresent()) { // the king is dead, long live the king
            return TablutRules.getInvaderVictoryValue(invaderStart);
        }
        const kingCoord: Coord = optionalKingCoord.get();
        if (TablutRules.isExternalThrone(kingCoord)) {
            // king reached one corner !
            console.log('king reached the corner ' + kingCoord);
            return TablutRules.getDefenderVictoryValue(invaderStart);
        }
        if (TablutRules.isPlayerImmobilised(0, invaderStart, board)) {
            return Number.MIN_SAFE_INTEGER;
        }
        if (TablutRules.isPlayerImmobilised(1, invaderStart, board)) {
            return Number.MAX_SAFE_INTEGER;
        }
        const nbPlayerZeroPawns = TablutRules.getPlayerListPawns(0, invaderStart, board).length;
        const nbPlayerOnePawns = TablutRules.getPlayerListPawns(1, invaderStart, board).length;
        const zeroMult = invaderStart ? 1 : 2; // invaders pawn are twice as numerous
        const oneMult = invaderStart ? 2 : 1; // so they're twice less valuable
        const scoreZero = nbPlayerZeroPawns * zeroMult;
        const scoreOne = nbPlayerOnePawns * oneMult;
        return scoreOne - scoreZero; // TODO : countInvader vs Defenders
    }
    constructor() {
        super(false);
        this.node = MNode.getFirstNode(
            new TablutPartSlice(TablutPartSlice.getStartingBoard(true), 0, true),
            this
        );
    }
    // instance methods :

    public applyLegalMove(move: TablutMove, slice: TablutPartSlice, status: LegalityStatus): { resultingMove: TablutMove; resultingSlice: TablutPartSlice; } {
        return TablutRules.applyLegalMove(move, slice, status);
    }
    public getListMoves(n: TablutNode): MGPMap<TablutMove, TablutPartSlice> {
        const LOCAL_VERBOSE: boolean = false;
        if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
            console.log('get list move available to ');
            console.log(n);
        }
        const listCombinaison: MGPMap<TablutMove, TablutPartSlice> = new MGPMap<TablutMove, TablutPartSlice>();

        const currentPartSlice: TablutPartSlice = n.gamePartSlice;

        const currentTurn: number = currentPartSlice.turn;
        let currentBoard: number[][] = currentPartSlice.getCopiedBoard();
        const currentPlayer: 0|1 = currentTurn % 2 === 0 ? 0 : 1;
        const invaderStart: boolean = currentPartSlice.invaderStart;

        const listMoves: TablutMove[] =
            TablutRules.getPlayerListMoves(currentPlayer, invaderStart, currentBoard);
        if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
            console.log({listMoves});
        }
        const nextTurn: number = currentTurn + 1;

        let newPartSlice: TablutPartSlice;
        let moveResult: number;
        for (const newMove of listMoves)    {
            currentBoard = currentPartSlice.getCopiedBoard();
            moveResult = TablutRules.tryMove(currentPlayer, invaderStart, newMove, currentBoard).success;
            if (moveResult === TablutRules.SUCCESS) {
                newPartSlice = new TablutPartSlice(currentBoard, nextTurn, currentPartSlice.invaderStart);
                listCombinaison.set(newMove, newPartSlice);
            } else if (TablutRules.VERBOSE || LOCAL_VERBOSE) {
                console.log('how is it that I receive a moveResult == to '
                    + moveResult + ' with ' + newMove + ' at turn ' + currentTurn + ' of player ' + currentPlayer);
            }
        }
        return listCombinaison;
    }
    public getListMovesPeared(n: TablutNode): { key: TablutMove, value: TablutPartSlice }[] {
        // TODO: pear this method, make it smarter
        const currentPartSlice: TablutPartSlice = n.gamePartSlice;
        const currentBoard: number[][] = currentPartSlice.getCopiedBoard();
        const currentTurn: number = currentPartSlice.turn;
        const invaderStart: boolean = currentPartSlice.invaderStart;
        let coord: Coord;
        let owner: number;
        const currentPlayer: 0|1 = (currentTurn % 2 === 0) ? 0 : 1;
        for (let y = 0; y < TablutRulesConfig.WIDTH; y++) {
            for (let x = 0; x < TablutRulesConfig.WIDTH; x++) {
                // pour chaque case
                coord = new Coord(x, y);
                owner = TablutRules.getRelativeOwner(currentPlayer, invaderStart, coord, currentBoard);
                if (owner === TablutRules.PLAYER) {
                    // pour l'envahisseur :
                    //     if the king is capturable : the only choice is the capturing
                    //     if the king is close to escape:  the only choice are the blocking one
                    // pour les défenseurs :
                    //     if the king can win : the only choice is the winning
                    //     if king threatened : the only choice is to save him
                    //         a: by escape
                    //         b: by interceding
                    //         c: by killing the threatener
                }
            }
        }
        return null;
    }
    public getBoardValue(n: TablutNode): number {

        // 1. is the king escaped ?
        // 2. is the king captured ?
        // 3. is one player immobilised ?
        // 4. let's just for now just count the pawns
        const tablutPartSlice: TablutPartSlice = n.gamePartSlice;
        const board: number[][] = tablutPartSlice.getCopiedBoard();
        const invaderStart: boolean = tablutPartSlice.invaderStart;

        return TablutRules.getBoardValue(board, invaderStart);
    }
    public isLegal(move: TablutMove): LegalityStatus {
        // copies
        const partSlice: TablutPartSlice = this.node.gamePartSlice;
        const board: number[][] = partSlice.getCopiedBoard();
        const turn: number = partSlice.turn;
        const invaderStart: boolean = partSlice.invaderStart;

        // test
        const player: 0|1 = turn % 2 === 0 ? 0 : 1;
        return {legal: TablutRules.tryMove(player, invaderStart, move, board).success === TablutRules.SUCCESS };
    }
    public setInitialBoard() {
        if (this.node == null) {
            this.node = MNode.getFirstNode(
                new TablutPartSlice(TablutPartSlice.getStartingBoard(true), 0, true), // TODO: rendre ça configurable
                this
            );
        } else {
            this.node = this.node.getInitialNode();
        }
    }
}