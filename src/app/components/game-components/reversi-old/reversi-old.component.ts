// import {Component} from '@angular/core';
// import {OnlineGame} from '../OnlineGame';
// import {ActivatedRoute, Router} from '@angular/router';
// import {UserService} from '../../../services/UserService';
// import {JoinerService} from '../../../services/JoinerService';
// import {GameService} from '../../../services/GameService';
// import {MoveCoord} from '../../../jscaip/MoveCoord';
// import {ReversiRules} from '../../../games/reversi/ReversiRules';
// import {ReversiPartSlice} from '../../../games/reversi/ReversiPartSlice';
//
// @Component({
// 	selector: 'app-reversi',
// 	templateUrl: './reversi-old.component.html',
// 	styleUrls: ['../onlineGame.css']
// })
// export class ReversiOldComponent extends OnlineGame {
//
// 	rules = new ReversiRules();
//
// 	imagesLocation = 'assets/images/'; // en prod
// 	// imagesLocation = 'src/assets/images/'; // en dev
//
// 	lastX = -1;
// 	lastY = -1;
// 	canPass = false;
//
// 	constructor(_route: Router, actRoute: ActivatedRoute,
// 				userService: UserService,
// 				joinerService: JoinerService, partService: GameService) {
// 		super(_route, actRoute, userService, joinerService, partService);
// 	}
//
// 	onClick(x: number, y: number): boolean {
// 		const reversiPartSlice = this.rules.node.gamePartSlice as ReversiPartSlice;
// 		console.log('f9 0 nb choices : ' + ReversiRules.getListMoves(reversiPartSlice).length);
// 		console.log('f9 0 choices static : ' + JSON.stringify(ReversiRules.getListMoves(reversiPartSlice)));
// 		console.log('f9 0 choices nonono : ' + JSON.stringify(this.rules.getListMoves(this.rules.node)));
// 		console.log('f9 0 board value : ' + this.rules.node.getOwnValue());
// 		if (this.rules.node.isEndGame()) {
// 			console.log('Malheureusement la partie est finie');
// 			return false;
// 		}
// 		if (!this.isPlayerTurn()) {
// 			console.log('Mais c\'est pas ton tour !');
// 			return false;
// 		}
// 		console.log('ça tente bien c\'est votre tour');
// 		// player's turn
//
// 		console.log('vous tentez un mouvement en (' + x + ', ' + y + ')');
//
// 		this.lastX = -1; this.lastY = -1; // now the user stop try to do a move
// 		// we stop showing him the last move
// 		const chosenMove = new MoveCoord(x, y);
// 		if (this.rules.isLegal(chosenMove)) {
// 			console.log('Et javascript estime que votre mouvement est légal');
// 			// player make a correct move
// 			// let's confirm on java-server-side that the move is legal
// 			this.updateDBBoard(chosenMove);
// 			/* if (this.rules.node.isEndGame()) {
// 				if (this.rules.node.getOwnValue() === 0) {
// 					this.notifyDraw();
// 				} else {
// 					this.notifyVictory();
// 				}
// 			}*/ // OLDLY
// 		} else {
// 			console.log('Mais c\'est un mouvement illegal');
// 		}
// 	}
//
// 	decodeMove(encodedMove: number): MoveCoord {
// 		if (encodedMove === ReversiRules.passNumber) {
// 			return ReversiRules.pass;
// 		}
// 		const x = encodedMove % 8;
// 		const y = (encodedMove - x) / 8;
// 		return new MoveCoord(x, y);
// 	}
//
// 	encodeMove(move: MoveCoord): number {
// 		// A quarto move goes on x from o to 7
// 		// and y from 0 to 7
// 		// encoded as y*8 + x
// 		if (move.equals(ReversiRules.pass)) {
// 			return ReversiRules.passNumber;
// 		}
// 		return (move.coord.y * 8) + move.coord.x;
// 	}
//
// 	updateBoard(): void {
// 		console.log('updateBoard');
// 		const reversiPartSlice: ReversiPartSlice = this.rules.node.gamePartSlice as ReversiPartSlice;
// 		const moveCoord: MoveCoord = this.rules.node.getMove() as MoveCoord;
//
// 		this.board = reversiPartSlice.getCopiedBoard();
// 		this.turn = reversiPartSlice.turn;
// 		this.currentPlayer = this.players[reversiPartSlice.turn % 2];
//
// 		if (moveCoord != null) {
// 			this.lastX = moveCoord.coord.x;
// 			this.lastY = moveCoord.coord.y;
// 		}
// 		console.log('f9 choices : ' + JSON.stringify(ReversiRules.getListMoves(reversiPartSlice)));
// 		console.log('f9 board value : ' + this.rules.node.getOwnValue());
// 		if (ReversiRules.playerCanOnlyPass(reversiPartSlice) && (!this.endGame)) {
// 			console.log('f9 l\'utilisateur ne peut que passer son tour!');
// 			this.canPass = true;
// 		} else {
// 			console.log('f9 they pretend that you have choices, is it true');
// 			this.canPass = false;
// 		}
// 	}
//
// 	pass() {
// 		this.onClick(ReversiRules.pass.coord.x, ReversiRules.pass.coord.y);
// 	}
//
// }