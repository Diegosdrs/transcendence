import { Game } from './game.js';
export let selected_game_mode = null;
const game_controler = new Game();
export function init_menu() {
    const menu = document.getElementById("menu");
    const game = document.getElementById("game");
    const solo_btn = document.getElementById('soloBtn');
    const versus_btn = document.getElementById('versusBtn');
    function start_game(mode) {
        selected_game_mode = mode;
        menu.style.display = "none";
        game.style.display = "block";
        game_controler.start_game_loop(mode);
    }
    solo_btn.addEventListener('click', () => start_game('solo'));
    versus_btn.addEventListener('click', () => start_game('versus'));
}
//# sourceMappingURL=menu.js.map