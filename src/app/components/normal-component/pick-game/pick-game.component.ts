import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-pick-game',
    templateUrl: './pick-game.component.html',
    styleUrls: ['./pick-game.component.css'],
})
export class PickGameComponent {

    public readonly gameNameList: ReadonlyArray<string> = [ // After Gipf: median = 26j; average = 34j
        'Awale', // ///////  2ème: 2018.11.29 (93 jours après P4)
        'Coerceo', // ///// 16ème: 2021.03.21 (76 jours après Epaminondas)
        'Dvonn', // /////// 13ème: 2020.10.21 (18 jours après Kamisado) ** Quentin
        'Encapsule', // ///  7ème: 2019.12.30 ( 9 jours après Go)
        'Epaminondas', // / 14ème: 2021.01.06 (22 jours après Quixo)
        'Gipf', // //////// 15ème: 2021.02.22 ( 4  mois après Dvonn) ***** Quentin
        'Go', // //////////  6ème: 2019.12.21 (11  mois après Reversi)
        'Kamisado', // //// 11ème: 2020.10.03 (26 jours après arrivée) *** Quentin
        'LinesOfAction', // 18ème: 2020.04.28 (65 jours après Six) ******* Quentin
        // 'MinimaxTesting', nor counted nor showed on the list, but it could be reached
        'P4', // //////////  1 er: 2018.08.28  (????????????????????)
        'Pylos', // /////// 10ème: 2020.10.02 ( 7  mois après Sahara)
        'Quarto', // //////  3ème: 2018.12.09 (10 jours après P4)
        'Quixo', // /////// 12ème: 2020.10.15 (13 jours après Pylos)
        'Reversi', // /////  5ème: 2019.01.16 (20 jours après Tablut)
        'Sahara', // //////  9ème: 2020.02.29 (49 jours après Siam)
        'Siam', // ////////  8ème: 2020.01.11 (12 jours après Encapsule)
        'Six', // ///////// 17ème: 2021.04.08 (18 jours après Coerceo)
        'Tablut', // //////  4ème: 2018.12.27 (26 jours après Quarto)
    ]; // 9j 10j 12j 13j 18j - 18j 20j 22j (26j) 26j 49j 65j - 76j 93j 4m 7m 11m

    @Output('pickGame') pickGame: EventEmitter<string> = new EventEmitter<string>();

    public onChange(game: string): void {
        this.pickGame.emit(game);
    }
}
