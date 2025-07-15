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
function random_bool() {
    return Math.random() < 0.5;
}
// --------------------------- CLASSES -----------------------------
class Pong {
    constructor(canvas, mode) {
        this.keys_pressed = {};
        this.countdown_interval = null;
        this.restart_timeout = null;
        this.goal_timeout = null;
        this.start_timeout = null;
        this.end_message = null;
        this.accumulator = 0;
        this.fixed_timestep = 16.67;
        this.last_frame_time = 0;
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
        this.end_message = document.getElementById('endMessage');
        this.lastTime = performance.now();
        this.fps = 0;
        this.config =
            {
                canvas_width: 800,
                canvas_height: 600,
                paddle_width: 10,
                paddle_height: 100,
                ball_real_speed: 10, //8,
                ball_speed: 7, //4.5,
                ball_max_speed: 15, //12,
                paddle_speed: 10, //8.5,
                score_to_win: 5,
                increase_vitesse: 250, //250,
                time_before_new_ball: 3000
            };
        this.state =
            {
                left_score: 0,
                right_score: 0,
                is_paused: false,
                game_running: true,
                game_mode: mode,
                count_down_active: false,
                ia_mode: false,
                restart_active: false
            };
        this.ball =
            {
                ball_x: this.config.canvas_width / 2,
                ball_y: this.config.canvas_height / 2,
                ball_dir_x: 0,
                ball_dir_y: 0,
                angle: 0,
                ia_x: 0,
                ia_y: 0,
                time_ia_in_frame: 0,
                distance_ia: 0,
                current_rebond: 0
            };
        this.paddle =
            {
                left_paddle_y: (this.config.canvas_height - this.config.paddle_height) / 2,
                right_paddle_y: (this.config.canvas_height - this.config.paddle_height) / 2,
                marge: 5,
                time_ia_in_frame: 0,
                current_shot: 0
            };
        this.ia =
            {
                depart: 0,
                move_1: 0,
                move_2: 0,
                counter: 0,
                rebond: 0,
                random_move_1: false,
                random_move_2: false,
                move_flag: false,
                continue_flag: true,
                distance_with_marge: 0,
                super_flag: true,
                random_paddle_move: false,
                ia_debug: true,
                ia_debug_2: true,
                close_rebond: false,
                far_rebond: false,
                far_far_rebond: false,
                service: true,
                delta_paddle: 0,
                delta_error: 0,
                error_percent: 0.2
            };
        this.setup_event();
        this.init_ball_direction();
        //requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    setup_event() {
        document.addEventListener("keydown", this.handle_keydown);
        document.addEventListener("keyup", this.handle_keyup);
    }
    start() {
        this.draw();
        //console.log("ca demarre");
        let countdown = 3;
        this.count_down.innerText = `Debut de partie dans`;
        setTimeout(() => {
            this.state.count_down_active = true;
            if (!this.count_down) {
                //console.error("Element countdown non trouve");
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
    // gameLoop(currentTime: number)
    // {
    //     const delta = currentTime - this.lastTime;
    //     this.lastTime = currentTime;
    //     this.fps = Math.round(1000 / delta);
    //     console.log("FPS :", this.fps);
    //     // Ici tu mets ton update & draw
    //     requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    // }
    game_loop() {
        const current_time = performance.now();
        const delta_time = current_time - this.last_frame_time;
        this.last_frame_time = current_time;
        //let frame_fois = 0;
        this.accumulator += delta_time;
        while (this.accumulator >= this.fixed_timestep) {
            if (!this.state.is_paused) {
                if (this.state.game_mode == "solo" && this.state.ia_mode == false && this.ball.ball_dir_x > 0) {
                    if (this.ia.service == true) {
                        this.ia_detection();
                        this.ia.continue_flag = true;
                        this.ia.service = false;
                        //console.log("DETECTION servica IA");
                    }
                    //console.log("service IA");
                    this.ia_ajustement(5, false);
                }
                if (this.state.game_mode == "solo" && this.state.ia_mode == true) {
                    this.ia.counter++;
                    this.handle_paddle_move();
                }
                this.update_paddle();
                this.update_ball();
                //this.draw();
            }
            this.accumulator -= this.fixed_timestep;
            //frame_fois++;
        }
        //console.log(`fois frame = ${frame_fois}`)
        if (!this.state.is_paused)
            this.draw();
        if (this.state.game_running == true)
            this.animation_id = requestAnimationFrame(() => this.game_loop()); // boucle infinie à 60 FPS
    }
    // game_loop(): void
    // {
    //     if (!this.state.is_paused)
    //     {
    //         if (this.state.game_mode == "solo" && this.state.ia_mode == false && this.ball.ball_dir_x > 0)
    //         {
    //             if (this.ia.service == true)
    //             {
    //                 this.ia_detection();
    //                 this.ia.continue_flag = true;
    //                 this.ia.service = false;
    //                 //console.log("DETECTION servica IA");
    //             }
    //             //console.log("service IA");
    //             this.ia_ajustement(5, false);
    //         }
    //         if (this.state.game_mode == "solo" && this.state.ia_mode == true)
    //         {
    //             this.ia.counter++;
    //             this.handle_paddle_move();
    //         }
    //         this.update_paddle();
    //         this.update_ball();
    //         //this.draw();
    //     }
    //     if (!this.state.is_paused)
    //         this.draw();
    //     if (this.state.game_running == true)
    //         this.animation_id = requestAnimationFrame(() => this.game_loop()); // boucle infinie à 60 FPS
    // }
    end_game() {
        let message = '';
        setTimeout(() => {
            if (this.state.left_score == this.config.score_to_win)
                message = '🏆 Joueur 1 gagne la partie !';
            else
                message = '🏆 Joueur 2 gagne la partie !';
            if (this.end_message) {
                this.end_message.textContent = message;
                this.end_message.style.display = 'block';
            }
        }, 1000);
        this.state.game_running = false;
    }
    restart() {
        console.log("🔄 RESTART demandé");
        this.clear_all_timers();
        this.state.restart_active = true;
        if (this.end_message)
            this.end_message.style.display = 'none';
        this.state.is_paused = true;
        this.state.count_down_active = false;
        this.state.game_running = true; // Important : garder le jeu actif
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        this.update_score(0);
        this.config.ball_speed = 7, //4.5;
            this.config.paddle_speed = 10, //8.5;
            this.count_down.innerText = "Nouvelle partie...";
        this.restart_timeout = setTimeout(() => {
            console.log("🚀 Nouvelle partie");
            // Repositionner tous les éléments
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.draw();
            this.start_count_down_for_restart();
            this.state.restart_active = false;
        }, 1500);
    }
    // Fonction améliorée pour nettoyer TOUS les timers
    clear_all_timers() {
        if (this.countdown_interval) {
            clearInterval(this.countdown_interval);
            this.countdown_interval = null;
            //console.log("✅ Countdown interval nettoyé");
        }
        if (this.restart_timeout) {
            clearTimeout(this.restart_timeout);
            this.restart_timeout = null;
            //console.log("✅ Restart timeout nettoyé");
        }
        if (this.goal_timeout) {
            clearTimeout(this.goal_timeout);
            this.goal_timeout = null;
            //console.log("✅ Goal timeout nettoyé");
        }
        if (this.start_timeout) {
            clearTimeout(this.start_timeout);
            this.start_timeout = null;
            //console.log("✅ Start timeout nettoyé");
        }
        // Annule aussi l'animation frame si nécessaire
        if (this.animation_id) {
            cancelAnimationFrame(this.animation_id);
            this.animation_id = 0;
            //console.log("✅ Animation frame annulée");
        }
    }
    start_count_down_for_restart() {
        let countdown = 3;
        this.count_down.innerText = `Reprise dans : ${countdown}`;
        this.state.count_down_active = true;
        this.countdown_interval = setInterval(() => {
            countdown--;
            // Vérifier si le restart est toujours valide
            if (this.state.restart_active) {
                //console.log("⚠️ Restart annulé pendant le countdown");
                return;
            }
            if (countdown > 0) {
                this.count_down.innerText = `Reprise dans : ${countdown}`;
                //console.log(`⏰ Countdown : ${countdown}`);
            }
            else {
                //console.log("🎮 Fin du countdown, reprise du jeu");
                clearInterval(this.countdown_interval);
                this.countdown_interval = null;
                this.count_down.innerText = "";
                this.state.count_down_active = false;
                this.init_ball_direction();
                this.start_time = performance.now();
                this.state.is_paused = false;
                if (this.state.game_running) {
                    this.game_loop();
                }
            }
        }, 1000);
    }
    update_paddle() {
        if (this.state.count_down_active)
            return;
        if (this.keys_pressed["w"] && this.paddle.left_paddle_y > 0)
            this.paddle.left_paddle_y -= this.config.paddle_speed;
        if (this.keys_pressed["s"] && this.paddle.left_paddle_y < this.config.canvas_height - this.config.paddle_height - 0)
            this.paddle.left_paddle_y += this.config.paddle_speed;
        if (this.state.game_mode != "solo") {
            if (this.keys_pressed["ArrowUp"] && this.paddle.right_paddle_y > 0)
                this.paddle.right_paddle_y -= this.config.paddle_speed;
            if (this.keys_pressed["ArrowDown"] && this.paddle.right_paddle_y < this.config.canvas_height - this.config.paddle_height - 0)
                this.paddle.right_paddle_y += this.config.paddle_speed;
        }
    }
    update_ball() {
        if (this.state.is_paused)
            return;
        if (this.state.count_down_active)
            return;
        this.ball.ball_x += this.ball.ball_dir_x;
        this.ball.ball_y += this.ball.ball_dir_y;
        if (performance.now() - this.start_time >= this.config.increase_vitesse && this.config.ball_speed < this.config.ball_max_speed) {
            this.config.ball_speed += 0.1; //0.1;
            this.config.paddle_speed += 0.05; //0.05;
            this.start_time = performance.now();
        }
        if (this.ball.ball_x < 0 || this.ball.ball_x > this.config.canvas_width) {
            this.state.is_paused = true;
            console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x} et ballspeed = ${this.config.ball_speed} et rebond = ${this.ball.current_rebond} et delta error = ${this.ia.delta_error} et delta_paddle = ${this.ia.delta_paddle}`);
            this.handle_goal();
            if (this.state.game_mode == "solo") {
                this.state.ia_mode = false;
                this.ia.service = true;
                this.paddle.current_shot = 0;
                this.ia.delta_error = 0;
                this.ia.delta_paddle = 0;
            }
            return;
        }
        // Rebonds sur les murs haut et bas
        if (this.ball.ball_y <= 5 || this.ball.ball_y >= this.config.canvas_height - 5) {
            //console.log(`AVANT rebond avec ball_x = ${this.ball.ball_x} et ball_y = ${this.ball.ball_y}`);
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
            //console.log(`APRES rebond avec ball_x = ${this.ball.ball_x} et ball_y = ${this.ball.ball_y}`);
            this.ball.ball_dir_y *= -1;
            this.ball.current_rebond++;
            this.normalize_ball_speed();
        }
        // raquette gauche
        if (this.ball.ball_x <= 40 &&
            this.ball.ball_x >= 25 &&
            this.ball.ball_y >= this.paddle.left_paddle_y - this.paddle.marge &&
            this.ball.ball_y <= this.paddle.left_paddle_y + this.config.paddle_height + this.paddle.marge &&
            this.ball.ball_dir_x < 0) {
            console.log(`🏓 Rebond raquette gauche à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
            if (this.config.ball_speed < this.config.ball_real_speed)
                this.config.ball_speed = this.config.ball_real_speed;
            this.update_ball_dir(0);
            this.normalize_ball_speed();
            if (this.state.game_mode == "solo") {
                this.state.ia_mode = true;
                this.ia_init();
                this.ia_detection();
                this.ia_init_difficulty();
                this.ia.counter = 0;
                this.ball.current_rebond = 0;
                this.paddle.current_shot++;
            }
        }
        // raquette droite
        if (this.ball.ball_x >= this.config.canvas_width - 40 &&
            this.ball.ball_x <= this.config.canvas_width - 25 &&
            this.ball.ball_y >= this.paddle.right_paddle_y - this.paddle.marge &&
            this.ball.ball_y <= this.paddle.right_paddle_y + this.config.paddle_height + this.paddle.marge &&
            this.ball.ball_dir_x > 0) {
            console.log(`🏓 Rebond raquette droite à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
            if (this.config.ball_speed < this.config.ball_real_speed)
                this.config.ball_speed = this.config.ball_real_speed;
            this.update_ball_dir(1);
            this.normalize_ball_speed();
            if (this.state.game_mode == "solo") {
                this.state.ia_mode = false;
                this.ball.current_rebond = 0;
            }
        }
    }
    handle_goal() {
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        this.update_score(1);
        if (this.state.left_score == this.config.score_to_win || this.state.right_score == this.config.score_to_win) {
            this.end_game();
            return;
        }
        this.config.ball_speed = 7, //4.5;
            this.config.paddle_speed = 10, //8.5;
            this.goal_timeout = setTimeout(() => {
                this.ball.ball_x = this.config.canvas_width / 2;
                this.ball.ball_y = this.config.canvas_height / 2;
                this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
                this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
                this.draw();
                this.start_count_down();
            }, 1500);
        return;
    }
    update_ball_dir(side) {
        let paddle_y = side === 0 ? this.paddle.left_paddle_y : this.paddle.right_paddle_y;
        let relative_impact = (this.ball.ball_y - paddle_y) / this.config.paddle_height;
        let max_bounce_angle = Math.PI / 4;
        // Convertit l'impact en angle [-max, +max]
        let bounce_angle = (relative_impact - 0.5) * 2 * max_bounce_angle;
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(bounce_angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(bounce_angle);
        if (side === 1)
            this.ball.ball_dir_x = -this.ball.ball_dir_x;
    }
    update_score(flag) {
        const score_P1 = document.getElementById('scoreP1');
        const score_P2 = document.getElementById('scoreP2');
        if (this.ball.ball_x < 45)
            this.state.right_score++;
        else
            this.state.left_score++;
        if (flag == 0) {
            this.state.right_score = 0;
            this.state.left_score = 0;
        }
        if (score_P1)
            score_P1.textContent = `Joueur 1 : ${this.state.left_score}`;
        if (score_P2)
            score_P2.textContent = `Joueur 2 : ${this.state.right_score}`;
    }
    // Fonction start_count_down corrigée (après un but)
    start_count_down() {
        let countdown = 3;
        // Vérifier qu'on n'est pas en train de redémarrer
        if (this.state.restart_active) {
            //console.log("⚠️ Countdown annulé car restart actif");
            return;
        }
        this.goal_timeout = setTimeout(() => {
            // Double vérification
            if (this.state.restart_active) {
                //console.log("⚠️ Timeout de but annulé car restart actif");
                return;
            }
            this.state.count_down_active = true;
            this.count_down.innerText = `Reprise dans : ${countdown}`;
            // Utiliser this.countdown_interval
            this.countdown_interval = setInterval(() => {
                countdown--;
                if (this.state.restart_active) {
                    //console.log("⚠️ Countdown de but interrompu par restart");
                    return;
                }
                if (countdown > 0) {
                    this.count_down.innerText = `Reprise dans : ${countdown}`;
                }
                else {
                    clearInterval(this.countdown_interval);
                    this.countdown_interval = null;
                    this.count_down.innerText = "";
                    this.state.count_down_active = false;
                    this.init_ball_direction();
                    this.start_time = performance.now();
                    this.state.is_paused = false;
                }
            }, 1000);
        }, 1000);
    }
    init_ball_direction() {
        this.ball.angle = get_random_playable_angle();
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(this.ball.angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(this.ball.angle);
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
        // === 1. FOND NOIR AVEC DÉGRADÉ ===
        let bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.config.canvas_height);
        bgGradient.addColorStop(0, "#0f0f0f");
        bgGradient.addColorStop(1, "#1a1a1a");
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.config.canvas_width, this.config.canvas_height);
        // === 4. LIGNES DU MILIEU EN POINTILLÉS (optionnel mais rétro) ===
        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([10, 15]);
        this.ctx.strokeStyle = "#444";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.canvas_width / 2, 0);
        this.ctx.lineTo(this.config.canvas_width / 2, this.config.canvas_height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        // === 2. RAQUETTES STYLE NÉON ===
        // Effet glow : couleur + ombre
        this.ctx.shadowColor = "#00ffff";
        this.ctx.shadowBlur = 20;
        let paddleGradientLeft = this.ctx.createLinearGradient(0, this.paddle.left_paddle_y, 0, this.paddle.left_paddle_y + this.config.paddle_height);
        paddleGradientLeft.addColorStop(0, "#00ffff");
        paddleGradientLeft.addColorStop(1, "#005f5f");
        this.ctx.fillStyle = paddleGradientLeft;
        this.ctx.fillRect(30, this.paddle.left_paddle_y, this.config.paddle_width, this.config.paddle_height);
        this.ctx.shadowColor = "#ff00ff";
        this.ctx.shadowBlur = 20;
        let paddleGradientRight = this.ctx.createLinearGradient(0, this.paddle.right_paddle_y, 0, this.paddle.right_paddle_y + this.config.paddle_height);
        paddleGradientRight.addColorStop(0, "#ff00ff");
        paddleGradientRight.addColorStop(1, "#5f005f");
        this.ctx.fillStyle = paddleGradientRight;
        this.ctx.fillRect(this.config.canvas_width - 30 - this.config.paddle_width, this.paddle.right_paddle_y, this.config.paddle_width, this.config.paddle_height);
        // === 3. BALLE PULSANTE ET CLIGNOTANTE ===
        const pulse = 10 + Math.sin(Date.now() / 100) * 2;
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        this.ctx.shadowColor = blink ? "#ffff00" : "#ff00ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = blink ? "#ffff00" : "#ff00ff";
        this.ctx.beginPath();
        this.ctx.arc(this.ball.ball_x, this.ball.ball_y, pulse, 0, Math.PI * 2);
        this.ctx.fill();
        // === 5. HUD (score, vitesse) AVEC POLICE PIXEL ===
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = "#00ffcc";
        this.ctx.font = "bold 18px 'Courier New', monospace";
        const currentSpeed = calculate_ball_speed(this.ball);
        this.ctx.fillText(`🎯 Vitesse: ${currentSpeed.toFixed(2)}`, 20, 30);
        this.ctx.fillStyle = "#ff66cc";
        this.ctx.font = "14px 'Courier New', monospace";
        this.ctx.fillText(`⏱️ Temps: ${get_time(this.start_time).toFixed(0)} ms`, 20, 55);
    }
    ia_init() {
        this.ia.random_move_1 = random_bool();
        this.ia.random_move_2 = random_bool();
        this.ia.random_paddle_move = random_bool();
        this.ia.continue_flag = true;
        this.ia.move_flag = false;
        this.ia.super_flag = true;
        this.ia.rebond = 0;
        this.ball.distance_ia = 0;
        this.ia.ia_debug = true;
        this.ia.close_rebond = false;
        this.ia.far_rebond = false;
        this.ia.far_far_rebond = false;
        this.ia.delta_paddle = this.ia_delta_paddle();
        if (this.paddle.current_shot >= 4)
            this.handle_ia_error();
    }
    ia_detection() {
        let x = this.ball.ball_x;
        let y = this.ball.ball_y;
        let dir_x = this.ball.ball_dir_x;
        let dir_y = this.ball.ball_dir_y;
        let prev_x = x;
        let prev_y = y;
        while (x < this.config.canvas_width - 40) {
            if (y <= 0 || y >= this.config.canvas_height) {
                let distance = Math.sqrt(Math.pow(x - prev_x, 2) + Math.pow(y - prev_y, 2));
                this.ball.distance_ia += distance;
                dir_y *= -1;
                this.ia.rebond++;
                prev_x = x;
                prev_y = y;
                if (x <= this.config.canvas_width / 2)
                    this.ia.close_rebond = true;
                else if (x > this.config.canvas_width / 2)
                    this.ia.far_rebond = true;
                else if (x > (3 * this.config.canvas_width / 4))
                    this.ia.far_far_rebond = true;
            }
            x += dir_x;
            y += dir_y;
        }
        this.ball.ia_x = x;
        this.ball.ia_y = y;
        if (this.ia.rebond == 0)
            this.ball.distance_ia = Math.sqrt(Math.pow(this.ball.ball_x - x, 2) + Math.pow(this.ball.ball_y - y, 2));
        else {
            let final_distance = Math.sqrt(Math.pow(x - prev_x, 2) + Math.pow(y - prev_y, 2));
            this.ball.distance_ia += final_distance;
        }
        this.ball.time_ia_in_frame = this.ball.distance_ia / this.config.ball_speed;
        //this.paddle.time_ia_in_frame = Math.abs(this.ball.ia_y - this.paddle.right_paddle_y + 5) / this.config.paddle_speed;
    }
    ia_init_difficulty() {
        let random_depart = random_number(0.1, 0.2);
        //let random_depart = 0.10;
        this.ia.depart = random_depart * this.ball.time_ia_in_frame;
        let random_move_2 = random_number(0.1, 0.25);
        //let random_move_2 = 0.35;
        this.ia.move_2 = random_move_2 * this.ball.time_ia_in_frame;
        let random_move_1 = 1 - random_move_2 - random_depart;
        //let random_move_1 = 0.55;
        this.ia.move_1 = random_move_1 * this.ball.time_ia_in_frame;
        console.log(`TIME IN FRAME = ${this.ball.time_ia_in_frame}`);
        console.log(`random_depart = ${random_depart}`);
        console.log(`random_move_1 = ${random_move_1}`);
        console.log(`random_move_2 = ${random_move_2}`);
        // supression de l'erreur si paddle deja sur la trajectoire
        if (this.ball.ia_y >= this.paddle.right_paddle_y && this.ball.ia_y <= this.paddle.right_paddle_y + this.config.paddle_height)
            this.ia.delta_error = 0;
    }
    handle_paddle_move() {
        if (this.ia.rebond == 0) {
            if (this.ia.delta_error != 0)
                this.ia.random_move_1 = false;
            this.update_paddle_ia_with_time();
        }
        else if (this.ia.rebond == 1 && this.ia.close_rebond == true)
            this.update_paddle_ia_with_1_close_rebond();
        else if (this.ia.rebond == 1 && this.ia.far_rebond == true)
            this.update_paddle_ia_with_1_far_rebond();
        else if (this.ia.rebond == 2)
            this.update_paddle_ia_with_2_rebonds();
    }
    update_paddle_ia_with_time() {
        if (this.ia.depart >= this.ia.counter)
            return;
        if (this.ia.move_1 >= this.ia.counter - this.ia.depart) {
            if (this.ia.ia_debug == true) {
                console.log("****** TIME move 1 *********");
                this.ia.ia_debug = false;
            }
            this.ia_ajustement(80, this.ia.random_move_1);
            return;
        }
        if (this.ia.super_flag == true) {
            //console.log("---------------- SUPER FLAG ---------------");
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
            //this.ia.ia_debug_2 = true;
        }
        if (this.ia.move_2 >= (this.ia.counter - this.ia.move_1 - this.ia.depart)) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** TIME move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 11)
                this.ia_ajustement(10, this.ia.random_move_2);
            else
                this.ia_ajustement(5, this.ia.random_move_2);
            //console.log("FIN DE MOOOOVE");
            return;
        }
    }
    update_paddle_ia_with_1_close_rebond() {
        if (this.ball.current_rebond < 1 && this.ia.depart >= this.ia.counter)
            return;
        if (this.ia.move_1 >= this.ia.counter) {
            if (this.ia.ia_debug == true) {
                console.log("****** 1 CLOSE move 1 *********");
                this.ia.ia_debug = false;
            }
            this.ia_ajustement(200, this.ia.random_move_1);
            return;
        }
        if (this.ia.super_flag == true) {
            //console.log("---------------- SUPER FLAG ---------------");
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
            //this.ia.ia_debug_2 = true;
        }
        if (this.ia.move_2 >= (this.ia.counter - this.ia.move_1 - this.ia.depart)) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 1 CLOSE move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 11)
                this.ia_ajustement(10, this.ia.random_move_2);
            else
                this.ia_ajustement(5, this.ia.random_move_2);
            //console.log("FIN DE MOOOOVE");
            return;
        }
    }
    update_paddle_ia_with_1_far_rebond() {
        if (this.ia.depart >= this.ia.counter)
            return;
        if (this.ball.current_rebond < 1) {
            if (this.ia.ia_debug == true) {
                console.log("****** 1 FAR move 1 *********");
                this.ia.ia_debug = false;
            }
            this.ia_ajustement_rebond(200);
            return;
        }
        if (this.ia.super_flag == true) {
            //console.log("---------------- SUPER FLAG ---------------");
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
            //this.ia.ia_debug_2 = true;
        }
        if (this.ball.current_rebond >= 1) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 1 FAR move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 11)
                this.ia_ajustement(10, false);
            else
                this.ia_ajustement(5, false);
            //console.log("FIN DE MOOOOVE");
            return;
        }
    }
    update_paddle_ia_with_2_rebonds() {
        if (this.ball.current_rebond < 1 && this.ia.depart >= this.ia.counter)
            return;
        if (this.ball.current_rebond < 2) {
            if (this.ia.ia_debug == true) {
                console.log("****** 2 REBONDS move 1 *********");
                this.ia.ia_debug = false;
            }
            this.ia_ajustement_rebond(200);
            return;
        }
        if (this.ia.super_flag == true) {
            //console.log("---------------- SUPER FLAG ---------------");
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
            //this.ia.ia_debug_2 = true;
        }
        if (this.ball.current_rebond >= 2) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 2 REBONDS move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 11)
                this.ia_ajustement(10, false);
            else
                this.ia_ajustement(5, false);
            //console.log("FIN DE MOOOOVE");
            return;
        }
    }
    ia_ajustement(marge, random) {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;
        //console.log(`distance = ${Math.abs(distance)} et marge = ${marge} et continue = ${this.ia.continue_flag}`);
        if (Math.abs(distance) <= marge && random == false) {
            console.log("FIN DE MOVE avec random = false");
            return;
        }
        if (Math.abs(distance) <= marge && random == true && this.ia.move_flag == true) {
            if (this.ia.continue_flag == true) {
                //console.log(" ----- CONTINUE FLAG ----- ");
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement();
            console.log("FIN DE MOVE continue");
            return;
        }
        if (Math.abs(distance) <= marge) {
            console.log("FIN DE MOVE");
            return;
        }
        if (distance > 0 && this.ia.continue_flag == true) {
            console.log(`ajust 1 et marge = ${marge}`);
            this.paddle.right_paddle_y += this.config.paddle_speed;
            this.ia.move_flag = true;
        }
        else if (distance < 0 && this.ia.continue_flag == true) {
            console.log(`ajust 2 et marge = ${marge}`);
            this.paddle.right_paddle_y -= this.config.paddle_speed;
            this.ia.move_flag = true;
        }
        this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
    }
    ia_ajustement_rebond(marge) {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;
        if (Math.abs(distance) <= marge) {
            if (this.ia.continue_flag == true) {
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement_rebond();
            console.log("FIN DE MOVE continue");
            return;
        }
        if (distance > 0 && this.ia.continue_flag == true) {
            console.log(`ajust 1 et marge = ${marge}`);
            this.paddle.right_paddle_y += this.config.paddle_speed;
        }
        else if (distance < 0 && this.ia.continue_flag == true) {
            console.log(`ajust 2 et marge = ${marge}`);
            this.paddle.right_paddle_y -= this.config.paddle_speed;
        }
        this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
    }
    continue_movement() {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        if (this.ia.distance_with_marge < 0 && (this.config.canvas_height - target_y) >= (this.config.paddle_height / 2)) {
            if (center_paddle - target_y <= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y += this.config.paddle_speed;
                console.log("continue 1");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return;
        }
        else if (this.ia.distance_with_marge >= 0 && target_y >= (this.config.paddle_height / 2)) {
            if (center_paddle - target_y >= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y -= this.config.paddle_speed;
                console.log("continue 2");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return;
        }
        return;
    }
    continue_movement_rebond() {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        if (this.ia.distance_with_marge < 0) {
            if (center_paddle - target_y <= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y += this.config.paddle_speed;
                console.log("continue 1");
            }
            this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
            return;
        }
        else if (this.ia.distance_with_marge >= 0) {
            if (center_paddle - target_y >= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y -= this.config.paddle_speed;
                console.log("continue 2");
            }
            this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
            return;
        }
        return;
    }
    ia_delta_paddle() {
        let random = random_number(0, 0.38);
        let random_sign = random_bool();
        if (random_sign == true)
            random *= -1;
        return (random * 100);
    }
    handle_ia_error() {
        let random = random_number(0, 1);
        let ajust_percent_lose = 0;
        if (this.state.right_score - this.state.left_score >= 2)
            ajust_percent_lose = 0.15;
        if (this.state.right_score - this.state.left_score >= 3)
            ajust_percent_lose = 0.20;
        if (this.state.right_score - this.state.left_score >= 4)
            ajust_percent_lose = 0.30;
        if (this.paddle.current_shot < 9) {
            if (random < 0.15 + ajust_percent_lose) {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 80 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (80 + this.ia.delta_paddle) * -1;
            }
        }
        else if (this.paddle.current_shot < 12) {
            if (random < 0.25 + ajust_percent_lose) {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 80 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (80 + this.ia.delta_paddle) * -1;
            }
        }
        else {
            if (random < 0.35 + ajust_percent_lose) {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 80 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (80 + this.ia.delta_paddle) * -1;
            }
        }
        if (this.ia.delta_error != 0)
            console.log(`! ERROR ! avec cou = ${this.paddle.current_shot} avec delta = ${this.ia.delta_error}`);
    }
}
class GamePong {
    static create_game(canvas, mode) {
        return new Pong(canvas, mode);
    }
}
export class Game_solo {
    constructor(mode) {
        this.current_game = null;
        this.mode = mode;
        this.canvas = document.getElementById("gameCanvas");
        this.restart_btn = document.getElementById("restartBtn");
        this.restart_btn.addEventListener('click', () => this.restart());
        this.current_game = GamePong.create_game(this.canvas, this.mode);
    }
    start_game_loop() {
        if (this.current_game)
            this.current_game.start();
    }
    restart() {
        if (this.current_game) {
            this.current_game.restart();
        }
    }
}
//# sourceMappingURL=game_solo_real.js.map