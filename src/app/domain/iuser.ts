export interface IUser {
	code: string;
	pseudo: string;
	email?: string;
	inscriptionDate?: Date;
	lastActionTime: Date;
	status?: number; // playing, waiting-joiner, observering, chat-room, inactive, offline
}
export interface IUserId {
	id: string;
	user: IUser;
}
export class User {
	constructor(
		public code: string, // lol
		public pseudo: string,
		public email: string,
		public inscriptionDate: Date,
		public lastActionTime: Date,
		public status: number) {}
}
