// import {ActivatedRoute, Router} from '@angular/router';
// import {Component} from '@angular/core';
//
// import {OnlineGame} from '../OnlineGame';
//
// import {Move} from '../../../jscaip/Move';
//
// import {QuartoMove} from '../../../games/games.quarto/QuartoMove';
// import {QuartoPartSlice} from '../../../games/games.quarto/QuartoPartSlice';
// import {QuartoEnum} from '../../../games/games.quarto/QuartoEnum';
// import {QuartoRules} from '../../../games/games.quarto/QuartoRules';
//
// import {UserService} from '../../../services/UserService';
// import {JoinerService} from '../../../services/JoinerService';
// import {GameService} from '../../../services/GameService';
//
// @Component({
// 	selector: 'app-quarto',
// 	templateUrl: './quarto-old.component.html',
// 	styleUrls: ['../onlineGame.css']
// })
// export class QuartoOldComponent extends OnlineGame {
//
// 	rules = new QuartoRules();
//
// 	imagesLocation = 'assets/images/'; // en prod
// 	// imagesLocation = 'src/assets/images/'; // en dev
//
// 	chosenX = -1; // the piece clicked by the user
// 	chosenY = -1;
// 	lastX: number; // the last move made by the opponent
// 	lastY: number;
// 	pieceInHand = 0; // the piece that the current user must place on the board
// 	pieceToGive = -1; // the piece that the user want to give to the opponent
//
// 	constructor(_route: Router, actRoute: ActivatedRoute, userService: UserService,
// 				joinerService: JoinerService, partService: GameService) {
// 		super(_route, actRoute, userService, joinerService, partService);
// 	}
//
// 	// implementing abstract method from OnlineGame
//
// 	decodeMove(encodedMove: number): Move {
// 		return QuartoMove.decode(encodedMove);
// 	}
//
// 	encodeMove(move: QuartoMove): number {
// 		return QuartoMove.encode(move);
// 	}
//
// 	updateBoard() {
// 		console.log('update board');
// 		const quartoPartSlice = this.rules.node.gamePartSlice as QuartoPartSlice;
// 		const move: QuartoMove = this.rules.node.getMove() as QuartoMove;
// 		this.board = quartoPartSlice.getCopiedBoard();
// 		this.pieceInHand = quartoPartSlice.pieceInHand;
//
// 		this.turn = quartoPartSlice.turn;
// 		this.currentPlayer = this.players[quartoPartSlice.turn % 2];
//
// 		if (move != null) {
// 			this.lastX = move.coord.x;
// 			this.lastY = move.coord.y;
// 		}
//
// 		this.cancelMove();
// 	}
//
// 	// creating method for Quarto
//
// 	chooseCoord(event: MouseEvent): boolean {
// 		console.log('choose coord');
// 		// called when the user click on the quarto board
// 		if (!this.isPlayerTurn()) {
// 			console.log('ce n\'est pas ton tour!');
// 			return false;
// 		}
// 		if (this.rules.node.isEndGame()) {
// 			console.log('la partie est finie');
// 			return false;
// 		}
// 		this.hideLastMove(); // now the user tried to choose something
// 		// so I guess he don't need to see what's the last move of the opponent
//
// 		const x: number = Number(event.srcElement.id.substring(2, 3));
// 		const y: number = Number(event.srcElement.id.substring(1, 2));
//
// 		if (this.board[y][x] === QuartoEnum.UNOCCUPIED) {
// 			console.log('legal place to put the piece because ' + x + ', ' + y + ' : ' + this.board[y][x]);
// 			// if it's a legal place to put the piece
// 			this.showPieceInHandOnBoard(x, y); // let's show the user his decision
// 			if (this.turn === 15) {
// 				// on last turn user won't be able to click on a piece to give
// 				// thereby we must put his piece in hand right
// 				return this.suggestMove(new QuartoMove(x, y, QuartoEnum.UNOCCUPIED));
// 			}
// 			if (this.pieceToGive !== -1) {
// 				// the user has already chosen his piece before his coord
// 				return this.suggestMove(new QuartoMove(x, y, this.pieceToGive));
// 			}
// 			return true; // the user has just chosen his coord
// 		}
// 		console.log('NOT a legal place to put the piece because ' + +x + ', ' + y + ' : ' + this.board[y][x]);
// 		// the user chose an occupied place of the board, so an illegal move, so we cancel all
// 		this.cancelMove();
// 		return false;
// 	}
//
// 	choosePiece(event: MouseEvent): boolean {
// 		if (!this.isPlayerTurn()) {
// 			console.log('ce n\'est pas ton tour!');
// 			return false;
// 		}
// 		if (this.rules.node.isEndGame()) {
// 			console.log('la partie est finie');
// 			return false;
// 		}
// 		this.hideLastMove(); // now the user tried to choose something
// 		// so I guess he don't need to see what's the last move of the opponent
//
// 		const givenPiece: number = Number(event.srcElement.id.substring(1));
// 		if (this.isRemaining(givenPiece)) {
// 			this.pieceToGive = givenPiece;
// 			if (this.chosenX !== -1) {
// 				// the user has chosen the coord before the piece
// 				const chosenMove = new QuartoMove(this.chosenX, this.chosenY, this.pieceToGive);
// 				return this.suggestMove(chosenMove);
// 			}
// 			return true; // the user has just chosen his piece
// 		}
// 		// the user chose an empty piece, let's cancel this
// 		this.cancelMove();
// 		return false;
// 	}
//
// 	hideLastMove() {
// 		this.lastX = -1;
// 		this.lastY = -1;
// 	}
//
// 	cancelMove() {
// 		// called when the user do a wrong move, then, we unselect his pieceToGive and/or the chosen coord
// 		this.chosenX = -1;
// 		this.chosenY = -1;
// 		this.pieceToGive = -1;
// 	}
//
// 	showPieceInHandOnBoard(x: number, y: number) {
// 		this.chosenX = x;
// 		this.chosenY = y;
// 	}
//
// 	isRemaining(pawn: number) {
// 		return QuartoPartSlice.isGivable(pawn, this.board, this.pieceInHand);
// 	}
//
// 	// creating method for OnlineQuarto
//
// 	suggestMove(chosenMove: QuartoMove): boolean {
// 		if (this.rules.isLegal(chosenMove)) {
// 			console.log('Et javascript estime que votre mouvement est légal');
// 			// player make a correct move
// 			// let's confirm on java-server-side that the move is legal
// 			this.chosenX = -1;
// 			this.chosenY = -1;
// 			this.updateDBBoard(chosenMove);
// 			/* if (this.rules.node.isEndGame()) {
// 				if (this.rules.node.getOwnValue() === 0) {
// 					this.notifyDraw();
// 				} else {
// 					this.notifyVictory();
// 				}
// 			} */ // OLDLY
// 			return true;
// 		} else {
// 			console.log('Mais c\'est un mouvement illegal');
// 			return false;
// 		}
// 	}
//
// }
