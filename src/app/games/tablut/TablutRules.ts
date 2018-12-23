import {DIRECTION, ORTHOGONALE, ORTHOGONALES} from '../../jscaip/DIRECTION';
import {Rules} from '../../jscaip/Rules';
import {Coord} from '../../jscaip/Coord';
import {MNode} from '../../jscaip/MNode';
import {TablutPartSlice} from './TablutPartSlice';
import {MoveCoordToCoordAndCapture} from '../../jscaip/MoveCoordToCoordAndCapture';

export class TablutRules extends Rules {

	// statics fields :

	private static i = 42;

	static CASTLE_IS_LEFT_FOR_GOOD = false;
	// once the king leave the castle he cannot re-station there
	static NORMAL_CAPTURE_WORK_ON_THE_KING = false;
	// king can be capture by only two opposed invaders
	static CAPTURE_KING_AGAINST_THRONE_RULES = false;
	// the throne is considered an ennemy to the king
	static CAPTURE_PAWN_AGAINST_THRONE_RULES = true;
	// the throne is considered an ennemy to the pawn
	static THREE_INVADER_AND_A_BORDER_CAN_CAPTURE_KING = true;
	// the king can be captured by only three invaders if he's against the corner

	static readonly WIDTH = 9;

	static readonly SUCCESS = TablutRules.i++;
	static readonly NOT_IN_RANGE_ERROR = TablutRules.i++;
	static readonly IMMOBILE_MOVE_ERROR = TablutRules.i++;
	static readonly NOT_ORTHOGONAL_ERROR = TablutRules.i++;
	static readonly SOMETHING_IN_THE_WAY_ERROR = TablutRules.i++;
	static readonly PAWN_COORD_UNOCCUPIED_ERROR = TablutRules.i++;
	static readonly MOVING_OPPONENT_PIECE_ERROR = TablutRules.i++;
	static readonly LANDING_ON_OCCUPIED_CASE_ERROR = TablutRules.i++;

	private static readonly NONE = TablutRules.i++;
	private static readonly ENNEMY = TablutRules.i++;
	private static readonly PLAYER = TablutRules.i++;

	// statics methods :

	private static tryMove(turn: number, move: MoveCoordToCoordAndCapture, board: number[][]): number {
		const errorValue = TablutRules.getMoveValidity(turn, move, board);
		if (errorValue !== TablutRules.SUCCESS) {
			return errorValue;
		}

		// move is legal here
		const captureds: Coord[] = new Coord[3];
		let nbCaptureds = 0;
		let captured: Coord;
		const dir: ORTHOGONALE = move.coord.getOrthogonalDirectionToward(move.end);
		for (const d of ORTHOGONALES) {
			if (!DIRECTION.equals(d, dir)) {
				captured = TablutRules.capture(turn, move.end, d, board);
				if (captured != null) {
					captureds[nbCaptureds++] = captured;
				}
			}
		}
		if (nbCaptureds > 0) {
			const capturedsArray: Coord[] = []; // OLD new ArrayList<Coord>(nbCaptureds);
			for (let i = 0; i < nbCaptureds; i++) {
				capturedsArray.push(captureds[i]);
			}
			move.setCaptures(capturedsArray);
		}
		return TablutRules.SUCCESS;
	}

	private static getMoveValidity(turn: number, move: MoveCoordToCoordAndCapture, board: number[][]): number {
		if (move.coord.isInRange(TablutRules.WIDTH, TablutRules.WIDTH) === false) {
			return TablutRules.NOT_IN_RANGE_ERROR;
		}
		if (move.end.isInRange(TablutRules.WIDTH, TablutRules.WIDTH) === false) {
			return TablutRules.NOT_IN_RANGE_ERROR;
		}

		const cOwner: number = TablutRules.getOwner(turn, move.coord, board);
		if (cOwner === TablutRules.NONE) {
			return TablutRules.PAWN_COORD_UNOCCUPIED_ERROR;
		}
		if (cOwner === TablutRules.ENNEMY) {
			return TablutRules.MOVING_OPPONENT_PIECE_ERROR;
		}

		const dir: DIRECTION = move.coord.getDirectionToward(move.end);
		if (dir == null) {
			return TablutRules.IMMOBILE_MOVE_ERROR;
		}

		if (!DIRECTION.isOrthogonal(dir)) {
			return TablutRules.NOT_ORTHOGONAL_ERROR;
		}
		const dist: number = move.coord.getOrthogonalDistance(move.end);
		let c: Coord; // the inspected coord
		for (let i = 1; i < dist; i++) {
			c = move.coord.getNext(dir);
			if (board[c.y][c.x] !== TablutPartSlice.UNOCCUPIED) {
				return TablutRules.SOMETHING_IN_THE_WAY_ERROR;
			}
		}
	}

	private static captureOld(turn: number, c: Coord, d: ORTHOGONALE, board: number[][]): Coord {
		// TODO TablutRules.capture
		/* 1: the threatened case dont exist         -> no capture
         * 2: the threatened case is not an ennemy   -> no capture
         * 3: if the opposing case dont exist        -> no capture
         * x: if the opposing case is another ennemy -> no capture
         * x: if the opposing case is an empty throne :
         *     x: if the threatened case is a king
         *         x: is the king capturable by sandwich
         *             x: is the king capturable by an empty throne -> captured king
         *         x: else the king capturable by 4
         *             x: is the king capturable by
         *     x: the threatened case is a pawn
         *         x:
         * x: the opposing case is an ally
         *     x: if the threatened case is a king
         *         x: is the king capturable by a sandwich -> captured king
         *         x: else is the king capturable by 4
         *             x:
         */
		const threatened: Coord = c.getNext(d);
		if (!threatened.isInRange(TablutRules.WIDTH, TablutRules.WIDTH)) {
			return null; // 1
		}
		const threatenedPawnOwner: number = TablutRules.getOwner(turn, threatened, board);
		if (threatenedPawnOwner !== TablutRules.ENNEMY) {
			return null; // 2
		}
		const opposing: Coord = threatened.getNext(d);
		if (!opposing.isInRange(TablutRules.WIDTH, TablutRules.WIDTH)) {
			return null;
		}
		const isAllie: boolean = TablutRules.getOwner(turn, opposing, board) === TablutRules.PLAYER;
		if (isAllie) {
			board[opposing.y][opposing.x] = TablutPartSlice.UNOCCUPIED;
			return opposing;
		}
		const isOpposingUnocuppiedThrone: boolean = TablutRules.isUnoccupiedThrone(opposing);
		if (isOpposingUnocuppiedThrone && TablutRules.CAPTURE_PAWN_AGAINST_THRONE_RULES) {

		}
		return null;
	}

	private static capture(turn: number, c: Coord, d: ORTHOGONALE, board: number[][]): Coord {
		/* c is the piece that just moved, d the direction in witch we look for capture
		 * return the captured coord, or null if no capture possible
		 * 1. the threatened case dont exist         -> no capture
         * 2: the threatened case is not an ennemy   -> no capture
		 * 3: the threatened case is a king -> delegate calculation
		 * 4: the threatened case is a pawn -> delegate calculation
		 */
		const threatened: Coord = c.getNext(d);
		if (!threatened.isInRange(TablutRules.WIDTH, TablutRules.WIDTH)) {
			return null; // 1: the threatened case dont exist, no capture
		}
		const threatenedPawnOwner: number = TablutRules.getOwner(turn, threatened, board);
		if (threatenedPawnOwner !== TablutRules.ENNEMY) {
			return null; // 2: the threatened case is not an ennemy
		}
		if (TablutRules.isKing(board[threatened.y][threatened.x])) {
			return TablutRules.captureKing(turn, c, threatened, board);
		}
		return TablutRules.capturePawn(turn, threatened, board);
	}

	private static isKing(piece: number): boolean {
		return (piece === TablutPartSlice.PLAYER_ZERO_KING) || (piece === TablutPartSlice.PLAYER_ONE_KING);
	}

	private static captureKing(turn: number, c: Coord, d: ORTHOGONALE, board: number[][]): Coord {
		/* the king is the next coord after c (in direction d)
		 * c partipate in the capture
		 *
		 *  1: allied is out-of-range
		 *      2: if two other are invaders                            -> capture king (1 border + 3 invaders)
		 *      3: if one invaders and one empty throne
		 *          3.1: if king capturable by empty-throne and borders -> capture king (1 border, 1 throne, 2 invaders)
		 *  4: allied is empty
		 *      5: if allied is not a throne                            -> no capture
		 *      here, allied is a throne
		 *      6: if king not capturable by empty throne               -> no capture
		 *      7: if king capturable by 2                              -> capture king (1 invader + throne)
		 *      8: else if two-other-coord are invader                  -> capture king (3 invaders + throne)
		 *  9: allied is an invader                                     -> no capture
		 * here allied is an invader
		 * 10: if king is capturable by two                             -> capture king (2 invaders)
		 * 11: if 2 others around king are invaders                     -> capture king (4 invaders)
		 * So these are the different victory way for the invaders :
		 * - 2 invaders
		 * - 1 invaders 1 empty-throne
		 * - 3 invaders 1 throne
		 * - 2 invaders 1 throne 1 border
		 * - 3 invaders 1 border
		 * - 4 invaders
		 */
		const kingCoord = c.getNext(d);
		const alliedCoord = kingCoord.getNext(d);
		if (!alliedCoord.isInRange(TablutRules.WIDTH, TablutRules.WIDTH)) { // 1

		}
	}

	private static isUnoccupiedThrone(opposing: Coord): boolean {
		// TODO Auto-generated method stub
		return false;
	}

	private static getOwner(turn: number, c: Coord, board: number[][]): number {
		const case_c: number = board[c.y][c.x];
		let owner: number;
		switch (case_c) {
			case TablutPartSlice.PLAYER_ZERO_KING:
			case TablutPartSlice.PLAYER_ZERO_PAWN:
				owner = 0;
				break;
			case TablutPartSlice.PLAYER_ONE_KING:
			case TablutPartSlice.PLAYER_ONE_PAWN:
				owner = 1;
				break;
			default :
				owner = -1;
		}
		const player: number = turn % 2;
		if (owner === -1) {
			return TablutRules.NONE;
		}
		if (player !== owner) {
			return TablutRules.ENNEMY;
		}
		return TablutRules.PLAYER;
	}

	// instance methods :

	getListMoves(n: MNode<TablutRules>): { key: MoveCoordToCoordAndCapture, value: TablutPartSlice }[] {
		// TODO Auto-generated method stub
		return null;
	}

	getBoardValue(n: MNode<TablutRules>): number {
		// TODO Auto-generated method stub

		// 1. is the king escaped ?
		// 2. is the king captured ?
		// 3. is one player immobilised ?
		// 4.
		return 0;
	}

	choose(move: MoveCoordToCoordAndCapture): boolean {
		// recherche
		let choice: MNode<TablutRules>;
		if (this.node.hasMoves()) { // if calculation has already been done by the AI
			choice = this.node.getSonByMove(move); // let's not doing if twice
			if (choice !== null) {
				console.log('recalculation spared!');
				this.node.keepOnlyChoosenChild(choice);
				this.node = choice; // qui devient le plateau actuel
				return true;
			}
		}

		// copies
		let partSlice: TablutPartSlice = this.node.gamePartSlice;
		const board: number[][] = partSlice.getCopiedBoard();
		const turn: number = partSlice.turn;

		// test
		if (TablutRules.tryMove(turn, move, board) === TablutRules.SUCCESS) {
			partSlice = new TablutPartSlice(board, turn);
			choice = new MNode<TablutRules>(this.node, move, partSlice);
			this.node.keepOnlyChoosenChild(choice);
			this.node = choice;
			return true;
		}
		return false;
	}

	setInitialBoard() {
		if (this.node == null) {
			this.node = MNode.getFirstNode(
				new TablutPartSlice(TablutPartSlice.getStartingBoard(), 0),
				this
			);
		} else {
			this.node = this.node.getInitialNode();
		}
	}

}
