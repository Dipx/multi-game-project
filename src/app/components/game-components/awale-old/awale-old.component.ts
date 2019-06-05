// import {Component} from '@angular/core';
// import {ActivatedRoute, Router} from '@angular/router';
//
// import {OnlineGame} from '../OnlineGame';
//
// import {MoveCoord} from '../../../jscaip/MoveCoord';
//
// import {AwaleRules} from '../../../games/awale/AwaleRules';
// import {AwalePartSlice} from '../../../games/awale/AwalePartSlice';
//
// import {UserService} from '../../../services/UserService';
// import {JoinerService} from '../../../services/JoinerService';
// import {GameService} from '../../../services/GameService';
//
// @Component({
// 	selector: 'app-awale',
// 	templateUrl: './awale-old.component.html',
// 	styleUrls: ['../onlineGame.css']
// })
// export class AwaleOldComponent extends OnlineGame {
//
// 	rules = new AwaleRules();
//
// 	scores: number[] = [0, 0];
//
// 	imagesLocation = 'assets/images/'; // en prod
// 	// imagesLocation = 'src/assets/images/'; // en dev
//
// 	lastX = -1;
// 	lastY = -1;
//
// 	constructor(_route: Router, actRoute: ActivatedRoute, userService: UserService,
// 				joinerService: JoinerService, partService: GameService) {
// 		super(_route, actRoute, userService, joinerService, partService);
// 	}
//
// 	onClick(x: number, y: number): boolean {
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
// 			/*if (this.rules.node.isEndGame()) {
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
// 		const x = encodedMove % 6;
// 		const y = (encodedMove - x) / 6;
// 		return new MoveCoord(x, y);
// 	}
//
// 	encodeMove(move: MoveCoord): number {
// 		// An awalé move goes on x from o to 5
// 		// and y from 0 to 1
// 		// encoded as y*6 + x
// 		return (move.coord.y * 6) + move.coord.x;
// 	}
//
// 	updateBoard(): void {
// 		console.log('updateBoard');
// 		const awalePartSlice: AwalePartSlice = this.rules.node.gamePartSlice as AwalePartSlice;
// 		const awaleMove: MoveCoord = this.rules.node.getMove() as MoveCoord;
//
// 		if (this.observerRole === 1) {
// 			const orientedBoard: number[][] = [];
// 			awalePartSlice.getCopiedBoard().forEach(
// 				line => orientedBoard.push(line.reverse()));
// 			this.board = orientedBoard;
// 		} else {
// 			this.board = awalePartSlice.getCopiedBoard().reverse();
// 		}
// 		this.turn = awalePartSlice.turn;
// 		this.currentPlayer = this.players[awalePartSlice.turn % 2];
//
// 		this.scores = awalePartSlice.getCapturedCopy();
// 		if (awaleMove != null) {
// 			this.lastX = awaleMove.coord.x;
// 			this.lastY = awaleMove.coord.y;
// 		}
// 	}
//
// }