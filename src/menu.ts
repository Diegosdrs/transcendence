import { Game_solo } from './game_solo.js';
import { Game_ligne } from './game_ligne.js';


export const restart_btn = document.getElementById("restartBtn") as HTMLButtonElement;
export let selected_game_mode: 'solo' | 'versus' | 'multi' | null = null;
const game_solo = new Game_solo();
//const game_ligne = new Game_ligne();


export function init_menu(): void {
    const menu = document.getElementById("menu") as HTMLElement;
    const local_btn = document.getElementById('localBtn') as HTMLButtonElement;
    const ligne_btn = document.getElementById('ligneBtn') as HTMLButtonElement;

    const menu_local = document.getElementById("menu_local") as HTMLElement;
    const solo_btn = document.getElementById('soloBtn') as HTMLButtonElement;
    const versus_btn = document.getElementById('versusBtn') as HTMLButtonElement;

    const menu_ligne = document.getElementById("menu_ligne") as HTMLElement;
    const solo_ligne_btn = document.getElementById('solo_ligneBtn') as HTMLButtonElement;
    const multi_btn = document.getElementById('multiBtn') as HTMLButtonElement;
    const tournoi_btn = document.getElementById('tournoiBtn') as HTMLButtonElement;

    const game = document.getElementById("game") as HTMLElement;
    
    
    function choose_mode(mode: 'local' | 'ligne'): void {
        
        menu.style.display = "none";

        if (mode == 'local')
            menu_local.style.display = "block";
        else
            menu_ligne.style.display = "block";
    }

    function start_game_solo(mode: 'solo' | 'versus'): void {
        selected_game_mode = mode;
        
        menu_local.style.display = "none";
        menu_ligne.style.display = "none";
        game.style.display = "block";
        
        game_solo.start_game_loop(mode);
    }

    function start_game_ligne(): void
    {
        const game_ligne = new Game_ligne();

        menu_ligne.style.display = "none";
        game.style.display = "block";
        
        game_ligne.start_game_loop();
    }
    
    local_btn.addEventListener('click', () => choose_mode('local'));
    ligne_btn.addEventListener('click', () => choose_mode('ligne'));

    // en local
    solo_btn.addEventListener('click', () => start_game_solo('solo'));
    versus_btn.addEventListener('click', () => start_game_solo('versus'));

    // en ligne
    solo_ligne_btn.addEventListener('click', () => start_game_solo('versus'));
    multi_btn.addEventListener('click', () => start_game_ligne());
    //tournoi_btn.addEventListener('click', () => start_game('versus'));
}
