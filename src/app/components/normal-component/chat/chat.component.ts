import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from '../../../services/chat/ChatService';
import { IMessage } from '../../../domain/imessage';
import { AuthenticationService } from 'src/app/services/authentication/AuthenticationService';
import { IChatId } from 'src/app/domain/ichat';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {

    public static VERBOSE: boolean = false;

    @Input() public chatId: string;
    @Input() public turn: number;
    public userName: string;

    public chat: IMessage[];
    public userMessage: string;
    public readMessages: number = 0;
    public unreadMessages: number = 0;

    public visible: boolean = true;

    constructor(private chatService: ChatService,
                private authenticationService: AuthenticationService) {
        if (ChatComponent.VERBOSE) {
            console.log("ChatComponent constructor");
        }
    }
    public ngOnInit() {
        if (ChatComponent.VERBOSE) {
            console.log('ChatComponent.ngOnInit');
        }

        if (this.chatId == null || this.chatId === '') throw new Error('No chat to join mentionned');

        this.authenticationService.getJoueurObs()
            .subscribe(joueur => {
                if (this.isConnectedUser(joueur)) {
                    if (ChatComponent.VERBOSE) console.log(JSON.stringify(joueur) + " just connected");
                    this.userName = joueur.pseudo;
                    this.loadChatContent();
                } else {
                    if (ChatComponent.VERBOSE) console.log("No User Logged");
                    this.showDisconnectedChat();
                }
            });
    }
    public isConnectedUser(joueur: { pseudo: string; verified: boolean;}): boolean {
        return joueur && joueur.pseudo &&
               joueur.pseudo != '' &&
               joueur.pseudo != 'null' &&
               joueur.pseudo != 'undefined';
    }
    public loadChatContent() {
        if (ChatComponent.VERBOSE) {
            console.log('User \'' + this.userName + '\' logged, loading chat content');
        }
        this.chatService.startObserving(this.chatId, this.updateMessages);
    }
    public updateMessages = (iChatId: IChatId) => {
        this.chat = iChatId.doc.messages;
        const nbMessages: number = this.chat.length;
        if (this.visible === false) {
            this.unreadMessages = nbMessages - this.readMessages;
        } else {
            this.readMessages = nbMessages;
            this.unreadMessages = 0;
        } 
    }
    public showDisconnectedChat() {
        const msg: IMessage = {sender: 'fake', content: 'vous devez être connecté pour voir le chat...', postedTime: Date.now(), lastTurnThen: null};
        this.chat = [msg, msg, msg, msg, msg];
    }
    public sendMessage() {
        if (this.userName === '') {
            if (ChatComponent.VERBOSE) {
                console.log('je t\'envoie un toast car t\'es pas connecté donc tu te tait!');
            }
        }
        this.chatService.sendMessage(this.userName, this.turn, this.userMessage);
        this.userMessage = '';
    }
    public ngOnDestroy() {
        if (this.chatService.isObserving())
            this.chatService.stopObserving();
    }
    public switchChatVisibility() {
        if (this.visible === true) {
            this.visible = false;
        } else {
            this.visible = true;
            this.unreadMessages = 0;
            this.readMessages = this.chat.length;
        }
    }
}