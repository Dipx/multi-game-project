import { Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FirstPlayer, IJoiner, IJoinerId, PartStatus } from '../domain/ijoiner';
import { JoinerDAO } from '../dao/JoinerDAO';
import { assert, display } from 'src/app/utils/utils';
import { ArrayUtils } from '../utils/ArrayUtils';

@Injectable({
    providedIn: 'root',
})
export class JoinerService {
    public static VERBOSE: boolean = false;

    public static readonly EMPTY_JOINER: IJoiner = {
        creator: null,
        candidates: [],
        chosenPlayer: '',
        firstPlayer: FirstPlayer.CREATOR.value, // by default: creator
        partStatus: PartStatus.PART_CREATED.value,
    };

    private observedJoinerId: string;
    private observedJoinerObs: Observable<IJoinerId>;
    private observedJoinerSub: Subscription;

    constructor(private joinerDao: JoinerDAO) {
        display(JoinerService.VERBOSE, 'JoinerService.constructor');
    }
    public startObserving(joinerId: string, callback: (iJoinerId: IJoinerId) => void): void {
        display(JoinerService.VERBOSE, 'JoinerService.startObserving ' + joinerId);

        if (this.observedJoinerId == null) {
            display(JoinerService.VERBOSE, '[start observing joiner ' + joinerId);

            this.observedJoinerId = joinerId;
            this.observedJoinerObs = this.joinerDao.getObsById(joinerId);
            this.observedJoinerSub = this.observedJoinerObs
                .subscribe((joinerId: IJoinerId) => callback(joinerId));
        } else {
            throw new Error('JoinerService.startObserving should not be called while already observing a joiner');
        }
    }
    public async createInitialJoiner(creatorName: string, joinerId: string): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.createInitialJoiner(' + creatorName + ', ' + joinerId + ')');

        const newJoiner: IJoiner = {
            ...JoinerService.EMPTY_JOINER,
            creator: creatorName,
        };
        return this.set(joinerId, newJoiner);
    }
    public async joinGame(partId: string, userName: string): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.joinGame(' + partId + ', ' + userName + ')');

        const joiner: IJoiner = await this.joinerDao.read(partId);
        if (!joiner) {
            throw new Error('No Joiner Received from DAO');
        }
        const joinerList: string[] = ArrayUtils.copyImmutableArray(joiner.candidates);
        if (joinerList.includes(userName)) {
            throw new Error('JoinerService.joinGame was called by a user already in the game');
        } else if (userName === joiner.creator) {
            return Promise.resolve();
        } else {
            joinerList[joinerList.length] = userName;
            return this.joinerDao.update(partId, { candidates: joinerList });
        }
    }
    public async cancelJoining(userName: string): Promise<void> {
        display(JoinerService.VERBOSE,
                'JoinerService.cancelJoining(' + userName + '); this.observedJoinerId =' + this.observedJoinerId);

        if (this.observedJoinerId == null) {
            throw new Error('cannot cancel joining when not observing a joiner');
        }
        const joiner: IJoiner = await this.joinerDao.read(this.observedJoinerId);
        if (joiner == null) {
            throw new Error('DAO Did not found a joiner with id ' + this.observedJoinerId);
        } else {
            const joinersList: string[] = ArrayUtils.copyImmutableArray(joiner.candidates);
            const indexLeaver: number = joinersList.indexOf(userName);
            let chosenPlayer: string = joiner.chosenPlayer;
            let partStatus: number = joiner.partStatus;
            if (chosenPlayer === userName) {
                // if the chosenPlayer leave, we're back to partStatus 0 (waiting for a chosenPlayer)
                chosenPlayer = '';
                partStatus = PartStatus.PART_CREATED.value;
            } else if (indexLeaver >= 0) { // candidate including chosenPlayer
                joinersList.splice(indexLeaver, 1);
            } else {
                throw new Error('someone that was nor candidate nor chosenPlayer just left the chat: ' + userName);
            }
            const modification: Partial<IJoiner> = {
                chosenPlayer,
                partStatus,
                candidates: joinersList,
            };
            return this.joinerDao.update(this.observedJoinerId, modification);
        }
    }
    public async updateCandidates(candidates: string[]): Promise<void> {
        const modification: Partial<IJoiner> = { candidates };
        return this.joinerDao.update(this.observedJoinerId, modification);
    }
    public async deleteJoiner(): Promise<void> {
        display(JoinerService.VERBOSE,
                'JoinerService.deleteJoiner(); this.observedJoinerId = ' + this.observedJoinerId);

        if (this.observedJoinerId == null) {
            throw new Error('observed joiner id is null');
        }
        return this.joinerDao.delete(this.observedJoinerId);
    }
    public async setChosenPlayer(chosenPlayerPseudo: string): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.setChosenPlayer(' + chosenPlayerPseudo + ')');

        const joiner: IJoiner = await this.joinerDao.read(this.observedJoinerId);
        const candidates: string[] = ArrayUtils.copyImmutableArray(joiner.candidates);
        const chosenPlayerIndex: number = candidates.indexOf(chosenPlayerPseudo);
        if (chosenPlayerIndex < 0 ) {
            throw new Error('Cannot choose player, ' + chosenPlayerPseudo + ' is not in the room');
        }

        // if user is still present, take him off the candidate list
        candidates.splice(chosenPlayerIndex, 1);
        const oldChosenPlayer: string = joiner.chosenPlayer;
        if (oldChosenPlayer !== '') {
            // if there is a previous chosenPlayer, put him in the candidates list
            candidates.push(oldChosenPlayer);
            // so he don't just disappear
        }
        return this.joinerDao.update(this.observedJoinerId, {
            partStatus: PartStatus.PLAYER_CHOSEN.value,
            candidates,
            chosenPlayer: chosenPlayerPseudo,
        });
    }
    public unselectChosenPlayer(candidatesList: string[],
                                chosenPlayer: string,
                                keepHimInLobby: boolean): Promise<void>
    {
        if (keepHimInLobby) {
            candidatesList.push(chosenPlayer);
        }
        const modification: Partial<IJoiner> = {
            chosenPlayer: '',
            candidates: candidatesList,
            partStatus: PartStatus.PART_CREATED.value,
        };
        return this.joinerDao.update(this.observedJoinerId, modification);
    }
    public proposeConfig(maximalMoveDuration: number,
                         firstPlayer: FirstPlayer,
                         totalPartDuration: number)
    : Promise<void> {
        display(JoinerService.VERBOSE,
                { joinerService_proposeConfig: { maximalMoveDuration, firstPlayer, totalPartDuration } });
        display(JoinerService.VERBOSE, 'this.followedJoinerId: ' + this.observedJoinerId);
        assert(this.observedJoinerId !== undefined, 'observedJoinerId is undefined');

        return this.joinerDao.update(this.observedJoinerId, {
            partStatus: PartStatus.CONFIG_PROPOSED.value,
            // timeoutMinimalDuration: timeout,
            maximalMoveDuration: maximalMoveDuration,
            totalPartDuration: totalPartDuration,
            firstPlayer: firstPlayer.value,
        });
    }
    public acceptConfig(): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.acceptConfig');

        if (this.observedJoinerId == null) {
            throw new Error('Can\'t acceptConfig when no joiner doc observed !!');
        }

        return this.joinerDao.update(this.observedJoinerId, { partStatus: PartStatus.PART_STARTED.value });
    }
    public stopObserving(): void {
        display(JoinerService.VERBOSE,
                'JoinerService.stopObserving(); // this.observedJoinerId = ' + this.observedJoinerId);

        if (this.observedJoinerId == null) {
            throw new Error('!!! JoinerService.stopObserving: we already stop watching doc');
        } else {
            this.observedJoinerId = null;
            this.observedJoinerSub.unsubscribe();
            this.observedJoinerObs = null;
        }
    }
    // DELEGATE

    public readJoinerById(partId: string): Promise<IJoiner> {
        display(JoinerService.VERBOSE, 'JoinerService.readJoinerById(' + partId + ')');

        return this.joinerDao.read(partId);
    }
    public set(partId: string, joiner: IJoiner): Promise<void> {
        display(JoinerService.VERBOSE, 'JoinerService.set(' + partId + ', ' + JSON.stringify(joiner) + ')');

        return this.joinerDao.set(partId, joiner);
    }
    public updateJoinerById(partId: string, update: Partial<IJoiner>): Promise<void> {
        display(JoinerService.VERBOSE, { joinerService_updateJoinerById: { partId, update } });

        return this.joinerDao.update(partId, update);
    }
}
