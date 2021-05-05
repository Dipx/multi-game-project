import { ICurrentPart, PICurrentPart, ICurrentPartId } from 'src/app/domain/icurrentpart';
import { FirebaseFirestoreDAOMock } from '../firebase-firestore-dao/FirebaseFirestoreDAOMock.spec';
import { ObservableSubject } from 'src/app/utils/collection-lib/ObservableSubject';
import { MGPMap } from 'src/app/utils/mgp-map/MGPMap';
import { FirebaseCollectionObserver } from '../FirebaseCollectionObserver';
import { display } from 'src/app/utils/utils/utils';

type PartOS = ObservableSubject<ICurrentPartId>

export class PartDAOMock extends FirebaseFirestoreDAOMock<ICurrentPart, PICurrentPart> {
    public static VERBOSE: boolean = false;

    private static partDB: MGPMap<string, PartOS>;

    public constructor() {
        super('PartDAOMock', PartDAOMock.VERBOSE);
        display(this.VERBOSE || FirebaseFirestoreDAOMock.VERBOSE, 'PartDAOMock.constructor');
    }
    public getStaticDB(): MGPMap<string, PartOS> {
        return PartDAOMock.partDB;
    }
    public resetStaticDB(): void {
        PartDAOMock.partDB = new MGPMap();
    }
    public observeActivesParts(callback: FirebaseCollectionObserver<ICurrentPart>): () => void {
        return () => {}; // TODO, observingWhere should be coded!
    }
}