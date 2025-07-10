// -------------------------- INTERFACES ------------------------------------
// ------------------------ FONCTIONS UTILES -----------------------
function get_random_playable_angle() {
    let angle = 0;
    while (true) {
        angle = Math.random() * 2 * Math.PI;
        const is_too_vertical = ((angle >= 1 && angle <= 2.1) || // proche de π/2
            (angle >= 4.4 && angle <= 5.1) // proche de 3π/2
        );
        const is_too_horizontal = ((angle >= 0 && angle <= 0.4) || // proche de 0
            (angle >= 2 * Math.PI - 0.4 && angle <= 2 * Math.PI) || // proche de 2π
            (angle >= Math.PI - 0.4 && angle <= Math.PI + 0.4) // proche de π
        );
        if (is_too_vertical || is_too_horizontal)
            continue;
        return angle;
    }
}
function random_number(min, max) {
    let num = 0;
    while (true) {
        num = Math.random();
        const to_max = (num > max);
        const to_min = (num < min);
        if (to_max || to_min)
            continue;
        return num;
    }
}
function calculate_ball_speed(ball) {
    return Math.sqrt(ball.ball_dir_x * ball.ball_dir_x + ball.ball_dir_y * ball.ball_dir_y);
}
function get_time(start_time) {
    return performance.now() - start_time;
}
function display_time(ctx, paddle) {
    if (!ctx)
        return;
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText("yoooo", paddle.paddle_width / 2, paddle.paddle_height / 2);
}
function random_bool() {
    return Math.random() < 0.5;
}
// --------------------------- CLASSES -----------------------------
class Pong {
    constructor(canvas) {
        this.keys_pressed = {};
        this.handle_keydown = (e) => {
            if (e.code === "Space")
                this.state.is_paused = !this.state.is_paused;
            else if (e.key === "b")
                console.log("Ball_dir_x = ", this.ball.ball_dir_x, ", Ball_dir_y = ", this.ball.ball_dir_y);
            else
                this.keys_pressed[e.key] = true;
        };
        this.handle_keyup = (e) => {
            this.keys_pressed[e.key] = false;
        };
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.start_time = performance.now();
        this.count_down = document.getElementById("countdowndisplay");
        this.animation_id = 0;
        this.config =
            {
                canvas_width: 800,
                canvas_height: 600,
                paddle_width: 10,
                paddle_height: 78,
                ball_real_speed: 4,
                ball_speed: 3.5,
                ball_max_speed: 4.5,
                paddle_speed: 8.5,
                score_to_win: 5,
                increase_vitesse: 250,
                time_before_new_ball: 3000
            };
        this.state =
            {
                left_score: 0,
                right_score: 0,
                is_paused: false,
                game_running: true,
                count_down_active: false,
            };
        this.ball =
            {
                ball_x: this.config.canvas_width / 2,
                ball_y: this.config.canvas_height / 2,
                ball_dir_x: 0,
                ball_dir_y: 0,
                angle: 0,
                current_rebond: 0
            };
        this.paddle =
            {
                paddles: {
                    p1_y: (this.config.canvas_height - this.config.paddle_height) / 4,
                    p2_y: 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
                    p3_y: (this.config.canvas_height - this.config.paddle_height) / 4,
                    p4_y: 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
                },
                marge: 5,
                current_shot: 0
            };
        this.setup_event();
        this.init_ball_direction();
    }
    setup_event() {
        document.addEventListener("keydown", this.handle_keydown);
        document.addEventListener("keyup", this.handle_keyup);
    }
    start() {
        this.draw();
        console.log("ca demarre");
        let countdown = 3;
        this.count_down.innerText = `Debut de partie dans`;
        setTimeout(() => {
            this.state.count_down_active = true;
            if (!this.count_down) {
                console.error("Element countdown non trouve");
                return;
            }
            this.count_down.innerText = `${countdown}`;
            let count_down_interval = setInterval(() => {
                countdown--;
                if (countdown > 0)
                    this.count_down.innerText = `${countdown}`;
                else {
                    clearInterval(count_down_interval);
                    this.count_down.innerText = "";
                    this.state.count_down_active = false;
                    this.start_time = performance.now();
                    this.game_loop();
                }
            }, 1000);
        }, 1000);
    }
    game_loop() {
        if (!this.state.is_paused) {
            this.update_paddle();
            this.update_ball();
            this.draw();
        }
        if (this.state.game_running == true)
            this.animation_id = requestAnimationFrame(() => this.game_loop()); // boucle infinie à 60 FPS
    }
    end_game() {
        const end_message_div = document.getElementById('endMessage');
        let message = '';
        setTimeout(() => {
            if (this.state.left_score == this.config.score_to_win)
                message = '🏆 Equipe 1 gagne la partie !';
            else
                message = '🏆 Equipe 2 gagne la partie !';
            if (end_message_div) {
                end_message_div.textContent = message;
                end_message_div.style.display = 'block';
            }
        }, 1000);
        this.state.game_running = false;
    }
    stop() {
        console.log("RESTART");
        this.state.game_running = false;
        //cancelAnimationFrame(this.animation_id);
        //document.removeEventListener("keydown", this.handle_keydown);
        //document.removeEventListener("keyup", this.handle_keyup);
        //this.ctx.clearRect(0, 0, this.config.canvas_width, this.config.canvas_height);
        setTimeout(() => {
            this.restart();
        }, 3000);
    }
    restart() {
        console.log("🔁 Redémarrage de la partie...");
        // Réinitialise les scores si tu veux une VRAIE nouvelle partie
        this.state.left_score = 0;
        this.state.right_score = 0;
        // Réinitialise les vitesses
        this.config.ball_speed = 3.5;
        this.config.paddle_speed = 8.5;
        this.start_time = performance.now();
        // Réinitialise la balle
        this.ball.ball_x = this.config.canvas_width / 2;
        this.ball.ball_y = this.config.canvas_height / 2;
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        this.ball.angle = 0;
        this.ball.current_rebond = 0;
        // Réinitialise les positions des paddles
        this.paddle.paddles.p1_y = (this.config.canvas_height - this.config.paddle_height) / 4;
        this.paddle.paddles.p2_y = 3 * (this.config.canvas_height - this.config.paddle_height) / 4;
        this.paddle.paddles.p3_y = (this.config.canvas_height - this.config.paddle_height) / 4;
        this.paddle.paddles.p4_y = 3 * (this.config.canvas_height - this.config.paddle_height) / 4;
        // Masquer le message de fin
        const endMessage = document.getElementById('endMessage');
        if (endMessage)
            endMessage.style.display = 'none';
        // Réactiver les états du jeu
        this.state.is_paused = false;
        this.state.game_running = true;
        this.state.count_down_active = false;
        // Relancer un compte à rebours + boucle de jeu
        this.init_ball_direction();
        this.start();
    }
    update_paddle() {
        if (this.state.count_down_active)
            return;
        // p1 move
        if (this.keys_pressed["w"] && this.paddle.paddles.p1_y > 0)
            this.paddle.paddles.p1_y -= this.config.paddle_speed;
        if (this.keys_pressed["s"] && this.paddle.paddles.p1_y <= (this.config.canvas_height / 2) - this.config.paddle_height)
            this.paddle.paddles.p1_y += this.config.paddle_speed;
        // p2 move
        if (this.keys_pressed["j"] && this.paddle.paddles.p2_y > (this.config.canvas_height / 2))
            this.paddle.paddles.p2_y -= this.config.paddle_speed;
        if (this.keys_pressed["m"] && this.paddle.paddles.p2_y < this.config.canvas_height - this.config.paddle_height)
            this.paddle.paddles.p2_y += this.config.paddle_speed;
        // p3 move
        if (this.keys_pressed["ArrowUp"] && this.paddle.paddles.p3_y > 0)
            this.paddle.paddles.p3_y -= this.config.paddle_speed;
        if (this.keys_pressed["ArrowDown"] && this.paddle.paddles.p3_y <= (this.config.canvas_height / 2) - this.config.paddle_height)
            this.paddle.paddles.p3_y += this.config.paddle_speed;
        // p4 move
        if (this.keys_pressed["9"] && this.paddle.paddles.p4_y > this.config.canvas_height / 2)
            this.paddle.paddles.p4_y -= this.config.paddle_speed;
        if (this.keys_pressed["6"] && this.paddle.paddles.p4_y < this.config.canvas_height - this.config.paddle_height)
            this.paddle.paddles.p4_y += this.config.paddle_speed;
    }
    update_ball() {
        if (this.state.is_paused)
            return;
        if (this.state.count_down_active)
            return;
        this.ball.ball_x += this.ball.ball_dir_x;
        this.ball.ball_y += this.ball.ball_dir_y;
        if (performance.now() - this.start_time >= this.config.increase_vitesse && this.config.ball_speed < this.config.ball_max_speed) {
            this.config.ball_speed += 0.1;
            this.config.paddle_speed += 0.05;
            this.start_time = performance.now();
        }
        if (this.ball.ball_x < 0 || this.ball.ball_x > this.config.canvas_width) {
            this.state.is_paused = true;
            console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x} et ballspeed = ${this.config.ball_speed}`);
            this.handle_goal();
            return;
        }
        // Rebonds sur les murs haut et bas
        if (this.ball.ball_y <= 5 || this.ball.ball_y >= this.config.canvas_height - 5) {
            console.log(`AVANT rebond avec ball_x = ${this.ball.ball_x} et ball_y = ${this.ball.ball_y}`);
            if (this.ball.ball_x <= 50) {
                if (this.ball.ball_y <= 5)
                    this.ball.ball_y = 6;
                else
                    this.ball.ball_y = this.config.canvas_height - 6;
                //console.log("ca passe ici zeubi")
            }
            if (this.ball.ball_x >= this.config.canvas_width - 50) {
                if (this.ball.ball_y <= 5)
                    this.ball.ball_y = 6;
                else
                    this.ball.ball_y = this.config.canvas_height - 6;
                //console.log("ca passe ici woula")
            }
            console.log(`APRES rebond avec ball_x = ${this.ball.ball_x} et ball_y = ${this.ball.ball_y}`);
            this.ball.ball_dir_y *= -1;
            this.ball.current_rebond++;
            this.normalize_ball_speed();
        }
        // // raquettes de gauche
        // if (
        //     this.ball.ball_x <= 40 &&
        //     this.ball.ball_x >= 25 &&
        //     ((this.ball.ball_y >= this.paddle.paddles.p1_y - this.paddle.marge &&
        //     this.ball.ball_y <= this.paddle.paddles.p1_y + this.config.paddle_height + this.paddle.marge &&
        //     this.ball.ball_dir_x < 0) ||
        //     (this.ball.ball_y >= this.paddle.paddles.p2_y - this.paddle.marge &&
        //     this.ball.ball_y <= this.paddle.paddles.p2_y + this.config.paddle_height + this.paddle.marge &&
        //     this.ball.ball_dir_x < 0)))
        // {
        //     if (this.ball.ball_y <= this.config.canvas_height / 2)
        //         console.log(`🏓 Rebond raquette P1 à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
        //     else
        //         console.log(`🏓 Rebond raquette P2 à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
        //     if (this.config.ball_speed < this.config.ball_real_speed)
        //         this.config.ball_speed = this.config.ball_real_speed;
        //     this.update_ball_dir(0);
        //     this.normalize_ball_speed();
        // }
        // raquettes de gauche
        if (this.ball.ball_x <= 40 && this.ball.ball_x >= 25) {
            if (this.ball.ball_y >= this.paddle.paddles.p1_y - this.paddle.marge &&
                this.ball.ball_y <= this.paddle.paddles.p1_y + this.config.paddle_height + this.paddle.marge &&
                this.ball.ball_dir_x < 0) {
                console.log(`🏓 Rebond raquette P1 à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
                if (this.config.ball_speed < this.config.ball_real_speed)
                    this.config.ball_speed = this.config.ball_real_speed;
                this.update_ball_dir(1);
                this.normalize_ball_speed();
            }
            else if (this.ball.ball_y >= this.paddle.paddles.p2_y - this.paddle.marge &&
                this.ball.ball_y <= this.paddle.paddles.p2_y + this.config.paddle_height + this.paddle.marge &&
                this.ball.ball_dir_x < 0) {
                console.log(`🏓 Rebond raquette P2 à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
                this.update_ball_dir(2);
                this.normalize_ball_speed();
            }
            // else
            // {
            //     this.state.is_paused = true;
            //     console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x} et ballspeed = ${this.config.ball_speed}`);
            //     this.handle_goal();
            //     return;
            // }
        }
        // raquettes droite
        if (this.ball.ball_x >= this.config.canvas_width - 40 && this.ball.ball_x <= this.config.canvas_width - 25) {
            if (this.ball.ball_y >= this.paddle.paddles.p3_y - this.paddle.marge &&
                this.ball.ball_y <= this.paddle.paddles.p3_y + this.config.paddle_height + this.paddle.marge &&
                this.ball.ball_dir_x > 0) {
                console.log(`🏓 Rebond raquette P3 à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
                this.update_ball_dir(3);
                this.normalize_ball_speed();
            }
            else if (this.ball.ball_y >= this.paddle.paddles.p4_y - this.paddle.marge &&
                this.ball.ball_y <= this.paddle.paddles.p4_y + this.config.paddle_height + this.paddle.marge &&
                this.ball.ball_dir_x > 0) {
                console.log(`🏓 Rebond raquette P4 à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
                if (this.config.ball_speed < this.config.ball_real_speed)
                    this.update_ball_dir(4);
                this.normalize_ball_speed();
            }
            // else
            // {
            //     this.state.is_paused = true;
            //     console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x} et ballspeed = ${this.config.ball_speed}`);
            //     this.handle_goal();
            //     return;
            // }
        }
    }
    handle_goal() {
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        this.update_score();
        if (this.state.left_score == this.config.score_to_win || this.state.right_score == this.config.score_to_win) {
            this.end_game();
            return;
        }
        this.config.ball_speed = 4.5;
        this.config.paddle_speed = 8.5;
        setTimeout(() => {
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.paddle.paddles.p1_y = (this.config.canvas_height - this.config.paddle_height) / 4,
                this.paddle.paddles.p2_y = 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
                this.paddle.paddles.p3_y = (this.config.canvas_height - this.config.paddle_height) / 4,
                this.paddle.paddles.p4_y = 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
                this.draw();
            this.start_count_down();
        }, 1500);
        return;
    }
    update_ball_dir(paddle) {
        let paddle_y = 0;
        if (paddle == 1)
            paddle_y = this.paddle.paddles.p1_y;
        else if (paddle == 2)
            paddle_y = this.paddle.paddles.p2_y;
        else if (paddle == 3)
            paddle_y = this.paddle.paddles.p3_y;
        else
            paddle_y = this.paddle.paddles.p4_y;
        let relative_impact = (this.ball.ball_y - paddle_y) / this.config.paddle_height;
        let max_bounce_angle = Math.PI / 4;
        // Convertit l'impact en angle [-max, +max]
        let bounce_angle = (relative_impact - 0.5) * 2 * max_bounce_angle;
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(bounce_angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(bounce_angle);
        if (paddle > 2)
            this.ball.ball_dir_x = -this.ball.ball_dir_x;
    }
    update_score() {
        const score_P1 = document.getElementById('scoreP1');
        const score_P2 = document.getElementById('scoreP2');
        if (this.ball.ball_x < 45)
            this.state.right_score++;
        else
            this.state.left_score++;
        if (score_P1)
            score_P1.textContent = `Equipe 1 : ${this.state.left_score}`;
        if (score_P2)
            score_P2.textContent = `Equipe 2 : ${this.state.right_score}`;
    }
    start_count_down() {
        let countdown = 3;
        setTimeout(() => {
            this.state.count_down_active = true;
            if (!this.count_down) {
                console.error("Element countdown non trouve");
                return;
            }
            this.count_down.innerText = `Reprise dans : ${countdown}`;
            let count_down_interval = setInterval(() => {
                countdown--;
                if (countdown > 0)
                    this.count_down.innerText = `Reprise dans : ${countdown}`;
                else {
                    clearInterval(count_down_interval);
                    this.count_down.innerText = "";
                    this.state.count_down_active = false;
                    this.init_ball_direction();
                    this.start_time = performance.now();
                    this.state.is_paused = false;
                }
            }, 1000);
        }, 1000);
    }
    normalize_ball_speed() {
        const current_speed = Math.sqrt(this.ball.ball_dir_x * this.ball.ball_dir_x + this.ball.ball_dir_y * this.ball.ball_dir_y);
        if (current_speed !== 0) {
            this.ball.ball_dir_x = (this.ball.ball_dir_x / current_speed) * this.config.ball_speed;
            this.ball.ball_dir_y = (this.ball.ball_dir_y / current_speed) * this.config.ball_speed;
        }
    }
    draw() {
        if (!this.ctx)
            return;
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.config.canvas_width, this.config.canvas_height);
        // Dessiner les raquettes
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(30, this.paddle.paddles.p1_y, this.config.paddle_width, this.config.paddle_height);
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(30, this.paddle.paddles.p2_y, this.config.paddle_width, this.config.paddle_height);
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(this.config.canvas_width - 30 - this.config.paddle_width, this.paddle.paddles.p3_y, this.config.paddle_width, this.config.paddle_height);
        this.ctx.fillStyle = "orange";
        this.ctx.fillRect(this.config.canvas_width - 30 - this.config.paddle_width, this.paddle.paddles.p4_y, this.config.paddle_width, this.config.paddle_height);
        // Dessiner la balle
        this.ctx.fillStyle = "black";
        this.ctx.beginPath();
        this.ctx.arc(this.ball.ball_x, this.ball.ball_y, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "black";
        this.ctx.font = "16px Arial";
        const currentSpeed = calculate_ball_speed(this.ball);
        this.ctx.fillText(`Vitesse: ${currentSpeed.toFixed(3)}`, 10, 30);
        // Indicateur de vitesse correcte
        if (Math.abs(currentSpeed - this.config.ball_speed) < 0.001) {
            this.ctx.fillStyle = "green";
            this.ctx.fillText("✅ Vitesse OK", 10, 50);
        }
        else {
            this.ctx.fillStyle = "red";
            this.ctx.fillText("❌ Vitesse incorrecte", 10, 50);
        }
        this.ctx.fillStyle = "black";
        this.ctx.font = "16px Arial";
        this.ctx.fillText(`⏱️ Temps : ${get_time(this.start_time).toFixed(0)} ms`, 10, 70);
        this.ctx.fillStyle = "black",
            this.ctx.font = "16px Arial";
        this.ctx.fillText(`Vitesse: ${currentSpeed.toFixed(3)}`, 10, 30);
    }
    init_ball_direction() {
        this.ball.angle = get_random_playable_angle();
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(this.ball.angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(this.ball.angle);
    }
}
class GamePong {
    static create_game(canvas) {
        return new Pong(canvas);
    }
}
export class Game_ligne {
    constructor() {
        this.current_game = null;
        this.canvas = document.getElementById("gameCanvas");
        this.restart_btn = document.getElementById("restartBtn");
        this.restart_btn.addEventListener('click', () => this.restart());
        this.current_game = GamePong.create_game(this.canvas);
    }
    start_game_loop() {
        if (this.current_game)
            this.current_game.start();
    }
    restart() {
        if (this.current_game) {
            this.current_game.stop();
            //this.current_game = null;
            //this.current_game = GamePong.create_game(this.canvas);
            //this.start_game_loop();
            // setTimeout (() =>
            // {
            //     this.start_game_loop();
            // }, 3000);
        }
    }
}
//# sourceMappingURL=game_ligne.js.map