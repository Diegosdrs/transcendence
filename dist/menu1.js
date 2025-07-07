import { startGameLoop } from './game_without_classes.js';
export let selectedGameMode = null;
export function initMenu() {
    console.log("Menu initialisé");
    // Récupère les éléments une seule fois
    const menu = document.getElementById("menu");
    const game = document.getElementById("game");
    const soloBtn = document.getElementById('soloBtn');
    const versusBtn = document.getElementById('versusBtn');
    // Fonction commune pour démarrer le jeu
    function startGame(mode) {
        // 1. Sauvegarder le mode choisi
        selectedGameMode = mode;
        console.log("Mode sélectionné:", mode);
        // 2. Transition visuelle : cacher menu, afficher jeu
        menu.style.display = "none";
        game.style.display = "block";
        // 3. Démarrer la boucle de jeu
        startGameLoop();
    }
    // Attacher les écouteurs UNE SEULE FOIS
    soloBtn.addEventListener('click', () => startGame('solo'));
    versusBtn.addEventListener('click', () => startGame('versus'));
}
//# sourceMappingURL=menu1.js.map