import { Game_solo } from './game_solo.js';
import { Game_ligne } from './game_ligne.js';
export function init_menu() {
    const menu = document.getElementById("menu");
    const local_btn = document.getElementById('localBtn');
    const ligne_btn = document.getElementById('ligneBtn');
    const menu_local = document.getElementById("menu_local");
    const solo_btn = document.getElementById('soloBtn');
    const versus_btn = document.getElementById('versusBtn');
    const menu_ligne = document.getElementById("menu_ligne");
    const solo_ligne_btn = document.getElementById('solo_ligneBtn');
    const multi_btn = document.getElementById('multiBtn');
    const tournoi_btn = document.getElementById('tournoiBtn');
    const game = document.getElementById("game");
    const restart = document.getElementById("restartBtn");
    const control_1 = document.getElementById("control_1");
    const control_2 = document.getElementById("control_2");
    const score_equip_1 = document.getElementById("scoreP1");
    const score_equip_2 = document.getElementById("scoreP2");
    const control_player_2 = document.getElementById("control_player_2");
    const control_player_2_command = document.getElementById("control_player_2_command");
    function choose_mode(mode) {
        menu.style.display = "none";
        if (mode == 'local')
            menu_local.style.display = "block";
        else
            menu_ligne.style.display = "block";
    }
    // mode de jeu SOLO
    function start_game_solo(mode) {
        const game_solo = new Game_solo(mode);
        menu_local.style.display = "none";
        menu_ligne.style.display = "none";
        game.style.display = "block";
        restart.style.display = "block";
        if (mode == "solo") {
            control_player_2.textContent = 'IA';
            control_player_2_command.textContent = "";
        }
        control_1.style.display = 'block';
        game_solo.start_game_loop();
    }
    // mode en ligne MULTI (2v2)
    function start_game_multi() {
        const game_ligne = new Game_ligne();
        menu_ligne.style.display = "none";
        game.style.display = "block";
        control_2.style.display = 'block';
        score_equip_1.textContent = "Equipe 1 : 0";
        score_equip_2.textContent = "Equipe 2 : 0";
        game_ligne.start_game_loop();
    }
    // mode en ligne SOLO (1v1)
    function start_game_ligne_solo() {
        const game_solo = new Game_solo('solo');
        menu_local.style.display = "none";
        menu_ligne.style.display = "none";
        game.style.display = "block";
        restart.style.display = "block";
        game_solo.start_game_loop();
    }
    local_btn.addEventListener('click', () => choose_mode('local'));
    ligne_btn.addEventListener('click', () => choose_mode('ligne'));
    // en local
    solo_btn.addEventListener('click', () => start_game_solo('solo'));
    versus_btn.addEventListener('click', () => start_game_solo('versus'));
    // en ligne
    solo_ligne_btn.addEventListener('click', () => start_game_ligne_solo());
    multi_btn.addEventListener('click', () => start_game_multi());
    //tournoi_btn.addEventListener('click', () => start_game('versus'));
}
//# sourceMappingURL=menu.js.map