import {Injectable, OnDestroy} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {IChat, IChatId} from '../../domain/ichat';
import {ChatDAO} from '../../dao/chat/ChatDAO';
import {IMessage} from '../../domain/imessage';

@Injectable({
    providedIn: 'root'
})
export class ChatService implements OnDestroy {

    public static VERBOSE: boolean = false;

    private followedChatId: string;

    private followedChatObs: Observable<IChatId>;

    private followedChatSub: Subscription;

    public static isForbiddenMessage(message: string): boolean {
        return (message === ''); // TODO: améliorer ?
    }
    constructor(private chatDao: ChatDAO) {
        if (ChatService.VERBOSE) console.log("ChatService.constructor");
    }
    public async sendMessage(userName: string, lastTurnThen: number, content: string) {
        if (this.userForbid(this.followedChatId, userName)) {
            if (ChatService.VERBOSE) {
                console.log('you\'re not allow to sent message here');
            }
            return;
        }
        if (ChatService.isForbiddenMessage(content)) {
            if (ChatService.VERBOSE) {
                console.log('HOW DARE YOU SAY THAT !');
            }
            return;
        }
        const iChat: IChat = await this.chatDao.read(this.followedChatId);
        const messages: IMessage[] = iChat.messages;
        const newMessage: IMessage = {
            content,
            sender: userName,
            postedTime: Date.now(), // timeStamp of the publication time
            lastTurnThen // number of the turn when this was write
        };
        messages.push(newMessage);
        await this.chatDao.update(this.followedChatId, { messages })
        if (ChatService.VERBOSE) {
            console.log('message envoyé');
        }
    }
    public userForbid(chatId: string, userName: string): boolean {
        return userName == null ||
               userName === '' ||
               userName === 'null' ||
               userName === 'undefined'; // TODO: implémenter le blocage de chat
    }
    public startObserving(chatId: string, callback: (iChat: IChatId) => void) {
        if (ChatService.VERBOSE) console.log("ChatService.startObserving " + chatId);

        if (this.followedChatId == null) {
            if (ChatService.VERBOSE) {
                console.log('[start watching chat ' + chatId);
            }
            this.followedChatId = chatId;
            this.followedChatObs = this.chatDao.getObsById(chatId);
            this.followedChatSub = this.followedChatObs
                .subscribe(onFullFilled => callback(onFullFilled));
        } else if (chatId === this.followedChatId) {
            console.log('WTF :: Already observing chat \'' + chatId + '\'');
        } else {
            // this.stopObserving();
            // this.startObserving(chatId, callback); // TODO: remove comments
            throw new Error('Cannot ask to watch \'' + this.followedChatId + '\' while watching \'' + chatId + "\'");
        }
    }
    public stopObserving() {
        if (!this.isObserving()) {
            throw new Error('ChatService.stopObserving should not be called if not observing');
        }
        if (ChatService.VERBOSE) 
            console.log('stopped watching chat ' + this.followedChatId + ']');
        this.followedChatId = null;
        if (this.followedChatSub)
            this.followedChatSub.unsubscribe();
        this.followedChatObs = null;
    }
    public isObserving(): boolean {
        return this.followedChatId != null
    }
    public async deleteChat(chatId: string): Promise<void> {
        if (ChatService.VERBOSE) {
            console.log('ChatService.deleteChat ' + chatId);
        }
        if (chatId == null) {
            throw new Error('Cannot delete chat of null id');
        }
        return this.chatDao.delete(chatId);
    }
    // delegate

    public async set(id: string, chat: IChat): Promise<void> {
        return this.chatDao.set(id, chat);
    }
    public ngOnDestroy() {
        if (this.isObserving())
            this.stopObserving();
    }
}