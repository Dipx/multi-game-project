import { MGPMap } from 'src/app/utils/MGPMap';
import { ObservableSubject } from 'src/app/utils/ObservableSubject';
import { FirebaseFirestoreDAOMock } from './FirebaseFirestoreDAOMock.spec';
import { IChat, PIChat, IChatId } from 'src/app/domain/ichat';
import { display } from 'src/app/utils/utils';

type ChatOS = ObservableSubject<IChatId>

export class ChatDAOMock extends FirebaseFirestoreDAOMock<IChat, PIChat> {
    public static VERBOSE: boolean = false;

    private static chatDB: MGPMap<string, ChatOS>;

    public constructor() {
        super('ChatDAOMock', ChatDAOMock.VERBOSE);
        display(this.VERBOSE, 'ChatDAOMock.constructor');
    }
    public getStaticDB(): MGPMap<string, ChatOS> {
        return ChatDAOMock.chatDB;
    }
    public resetStaticDB(): void {
        ChatDAOMock.chatDB = new MGPMap();
    }
}
