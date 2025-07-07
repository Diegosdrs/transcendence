import { Game } from './game.js';

export let selected_game_mode: 'solo' | 'versus' | null = null;
const game_controler = new Game();


export function init_menu(): void {
    const menu = document.getElementById("menu") as HTMLElement;
    const game = document.getElementById("game") as HTMLElement;
    const solo_btn = document.getElementById('soloBtn') as HTMLButtonElement;
    const versus_btn = document.getElementById('versusBtn') as HTMLButtonElement;
    
    function start_game(mode: 'solo' | 'versus'): void {
        selected_game_mode = mode;
        
        menu.style.display = "none";
        game.style.display = "block";
        
        game_controler.start_game_loop(mode);
    }
    
    solo_btn.addEventListener('click', () => start_game('solo'));
    versus_btn.addEventListener('click', () => start_game('versus'));
}
