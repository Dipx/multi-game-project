import { Component, EventEmitter, Output, Type } from '@angular/core';
import { AwaleComponent } from 'src/app/games/awale/awale.component';
import { CoerceoComponent } from 'src/app/games/coerceo/coerceo.component';
import { DvonnComponent } from 'src/app/games/dvonn/dvonn.component';
import { EncapsuleComponent } from 'src/app/games/encapsule/encapsule.component';
import { EpaminondasComponent } from 'src/app/games/epaminondas/epaminondas.component';
import { GipfComponent } from 'src/app/games/gipf/gipf.component';
import { GoComponent } from 'src/app/games/go/go.component';
import { KamisadoComponent } from 'src/app/games/kamisado/kamisado.component';
import { LinesOfActionComponent } from 'src/app/games/lines-of-action/LinesOfAction.component';
import { MinimaxTestingComponent } from 'src/app/games/minimax-testing/minimax-testing.component';
import { P4Component } from 'src/app/games/p4/p4.component';
import { PentagoComponent } from 'src/app/games/pentago/Pentago.component';
import { PylosComponent } from 'src/app/games/pylos/pylos.component';
import { QuartoComponent } from 'src/app/games/quarto/quarto.component';
import { QuixoComponent } from 'src/app/games/quixo/quixo.component';
import { ReversiComponent } from 'src/app/games/reversi/reversi.component';
import { SaharaComponent } from 'src/app/games/sahara/sahara.component';
import { SiamComponent } from 'src/app/games/siam/siam.component';
import { SixComponent } from 'src/app/games/six/six.component';
import { TablutComponent } from 'src/app/games/tablut/tablut.component';
import { GamePartSlice } from 'src/app/jscaip/GamePartSlice';
import { Move } from 'src/app/jscaip/Move';
import { AbstractGameComponent } from '../../game-components/abstract-game-component/AbstractGameComponent';

export class GameInfo {
    // Games sorted by creation date
    public static ALL_GAMES: GameInfo[] = [
        new GameInfo('MinimaxTesting', 'MinimaxTesting', MinimaxTestingComponent, new Date('1970-01-01'), '', false),

        new GameInfo('Puissance 4', 'P4', P4Component, new Date('2018-08-28')),
        new GameInfo('Awalé', 'Awale', AwaleComponent, new Date('2018-11-29')), // 93 days after P4
        new GameInfo('Quarto', 'Quarto', QuartoComponent, new Date('2018-12-09')), // 10 days after Awale
        new GameInfo('Tablut', 'Tablut', TablutComponent, new Date('2018-12-27')), // 26 days after Quarto
        new GameInfo('Reversi', 'Reversi', ReversiComponent, new Date('2019-01-16')), // 20 days after Tablut)
        new GameInfo('Go', 'Go', GoComponent, new Date('2019-12-21')), // 11 months after Reversi
        new GameInfo('Encapsule', 'Encapsule', EncapsuleComponent, new Date('2019-12-30')), // 9 days after Go
        new GameInfo('Siam', 'Siam', SiamComponent, new Date('2020-01-11')), // 12 days after Encapsule
        new GameInfo('Sahara', 'Sahara', SaharaComponent, new Date('2020-02-29')), // 49 days after Siam
        new GameInfo('Pylos', 'Pylos', PylosComponent, new Date('2020-10-02')), // 7 months after Sahara
        new GameInfo('Kamisado', 'Kamisado', KamisadoComponent, new Date('2020-10-03')), // 26 days after joining *Quentin
        new GameInfo('Quixo', 'Quixo', QuixoComponent, new Date('2020-10-15')), // 13 days after Pylos
        new GameInfo('Dvonn', 'Dvonn', DvonnComponent, new Date('2020-10-21')), // 18 days after Kamisado *Quentin
        new GameInfo('Epaminondas', 'Epaminondas', EpaminondasComponent, new Date('2021-01-16')), // 22 days after Quixo
        new GameInfo('Gipf', 'Gipf', GipfComponent, new Date('2021-02-22')), // 4 months after Dvonn *Quentin
        new GameInfo('Coerceo', 'Coerceo', CoerceoComponent, new Date('2021-03-21')), // 76 days after Epaminondas
        new GameInfo('Six', 'Six', SixComponent, new Date('2021-04-08')), // 18 days after Coerceo
        new GameInfo('Lines of Action', 'LinesOfAction', LinesOfActionComponent, new Date('2020-04-28')), // 65 days after Gipf *Quentin
        new GameInfo('Pentago', 'Pentago', PentagoComponent, new Date('2021-05-23')), // 25 days after Six
    ].sort((a: GameInfo, b: GameInfo) => a.name.localeCompare(b.name));
    // After Gipf: median = 26d; average = 34d
    // 9d 10d 12d 13d 18d - 18d 20d 22d (25d 26d) 26d 49d 65d - 76d 93d 4m 7m 11m

    public constructor(public readonly name: string,
                       public readonly urlName: string,
                       public readonly component: Type<AbstractGameComponent<Move, GamePartSlice>>,
                       public readonly creationDate: Date,
                       public readonly description: string = '',
                       public readonly display: boolean = true) {
    }
}

@Component({
    selector: 'app-pick-game',
    templateUrl: './pick-game.component.html',
    styleUrls: ['./pick-game.component.css'],
})
export class PickGameComponent {

    public readonly gameNameList: ReadonlyArray<string> =
        GameInfo.ALL_GAMES
            .filter((game: GameInfo) => game.display === true)
            .map((game: GameInfo): string => game.urlName);


    @Output('pickGame') pickGame: EventEmitter<string> = new EventEmitter<string>();

    public onChange(game: string): void {
        this.pickGame.emit(game);
    }
}
