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
        const to_min = (num <= min);
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
    constructor(canvas, mode) {
        this.keys_pressed = {};
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.start_time = performance.now();
        this.count_down = document.getElementById("countdowndisplay");
        this.config =
            {
                canvas_width: 800,
                canvas_height: 600,
                paddle_width: 10,
                paddle_height: 100,
                ball_real_speed: 8,
                ball_speed: 4.5,
                paddle_speed: 8.5,
                score_to_win: 5,
                increase_vitesse: 5000,
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
                ia_mode: false
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
                time_ia_in_frame: 0
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
                delta_paddle: 0
            };
        this.setup_event();
        this.init_ball_direction();
    }
    setup_event() {
        document.addEventListener("keydown", (e) => {
            if (e.code === "Space")
                this.state.is_paused = !this.state.is_paused;
            else if (e.key === "b")
                console.log("Ball_dir_x = ", this.ball.ball_dir_x, ", Ball_dir_y = ", this.ball.ball_dir_y);
            else
                this.keys_pressed[e.key] = true;
        });
        document.addEventListener("keyup", (e) => {
            this.keys_pressed[e.key] = false;
        });
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
            this.draw();
        }
        if (this.state.game_running == true)
            requestAnimationFrame(() => this.game_loop()); // boucle infinie à 60 FPS
    }
    end_game() {
        const end_message_div = document.getElementById('endMessage');
        let message = '';
        setTimeout(() => {
            if (this.state.left_score == this.config.score_to_win)
                message = '🏆 Joueur 1 gagne la partie !';
            else
                message = '🏆 Joueur 2 gagne la partie !';
            if (end_message_div) {
                end_message_div.textContent = message;
                end_message_div.style.display = 'block';
            }
        }, 1000);
        this.state.game_running = false;
    }
    stop() {
        console.log("ca stoppe");
    }
    update_paddle() {
        if (this.state.count_down_active)
            return;
        if (this.keys_pressed["w"] && this.paddle.left_paddle_y > 0)
            this.paddle.left_paddle_y -= this.config.paddle_speed;
        if (this.keys_pressed["s"] && this.paddle.left_paddle_y < this.config.canvas_height - this.config.paddle_height)
            this.paddle.left_paddle_y += this.config.paddle_speed;
        if (this.state.game_mode != "solo") {
            if (this.keys_pressed["ArrowUp"] && this.paddle.right_paddle_y > 0)
                this.paddle.right_paddle_y -= this.config.paddle_speed;
            if (this.keys_pressed["ArrowDown"] && this.paddle.right_paddle_y < this.config.canvas_height - this.config.paddle_height)
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
        if (this.ball.ball_x < 0 || this.ball.ball_x > this.config.canvas_width) {
            this.state.is_paused = true;
            console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x}`);
            this.handle_goal();
            if (this.state.game_mode == "solo") {
                this.state.ia_mode = false;
                this.ia.service = true;
            }
            return;
        }
        // Rebonds sur les murs haut et bas
        if (this.ball.ball_y <= 0 || this.ball.ball_y >= this.config.canvas_height) {
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
            if (performance.now() - this.start_time >= this.config.increase_vitesse && this.config.ball_speed < 15) {
                this.config.ball_speed += 1.5;
                this.config.paddle_speed += 0.5;
                this.start_time = performance.now();
            }
            console.log(`🏓 Rebond raquette gauche à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
            if (this.config.ball_speed == 4.5)
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
            }
        }
        // raquette droite
        if (this.ball.ball_x >= this.config.canvas_width - 40 &&
            this.ball.ball_x <= this.config.canvas_width - 25 &&
            this.ball.ball_y >= this.paddle.right_paddle_y - this.paddle.marge &&
            this.ball.ball_y <= this.paddle.right_paddle_y + this.config.paddle_height + this.paddle.marge &&
            this.ball.ball_dir_x > 0) {
            if (performance.now() - this.start_time >= this.config.increase_vitesse && this.config.ball_speed < 15) {
                this.config.ball_speed += 1.5;
                this.config.paddle_speed += 0.5;
                this.start_time = performance.now();
            }
            console.log(`🏓 Rebond raquette droite à x=${this.ball.ball_x} et y=${this.ball.ball_y}`);
            if (this.config.ball_speed == 4.5)
                this.config.ball_speed = this.config.ball_real_speed;
            this.update_ball_dir(1);
            this.normalize_ball_speed();
            this.ball.current_rebond = 0;
            if (this.state.game_mode == "solo") {
                this.state.ia_mode = false;
            }
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
    update_score() {
        const score_P1 = document.getElementById('scoreP1');
        const score_P2 = document.getElementById('scoreP2');
        if (this.ball.ball_x < 45)
            this.state.right_score++;
        else
            this.state.left_score++;
        if (score_P1)
            score_P1.textContent = `Joueur 1 : ${this.state.left_score}`;
        if (score_P2)
            score_P2.textContent = `Joueur 2 : ${this.state.right_score}`;
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
        this.ctx.fillRect(30, this.paddle.left_paddle_y, this.config.paddle_width, this.config.paddle_height); // gauche
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(this.config.canvas_width - 30 - this.config.paddle_width, this.paddle.right_paddle_y, this.config.paddle_width, this.config.paddle_height); // droite
        // Dessiner la balle
        this.ctx.fillStyle = "black";
        this.ctx.beginPath();
        this.ctx.arc(this.ball.ball_x, this.ball.ball_y, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "grey";
        this.ctx.beginPath();
        this.ctx.arc(this.ball.ia_x, this.ball.ia_y, 10, 0, Math.PI * 2);
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
        // let random = random_number(0, 1);
        // if (random >= 0.25)
        //     this.ball.angle = 120;
        // else
        //     this.ball.angle = 60;
        this.ball.angle = get_random_playable_angle();
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(this.ball.angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(this.ball.angle);
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
    }
    handle_paddle_move() {
        if (this.ia.rebond == 0)
            this.update_paddle_ia_with_time();
        else if (this.ia.rebond == 1 && this.ia.close_rebond == true)
            this.update_paddle_ia_with_1_close_rebond();
        else if (this.ia.rebond = 1 || this.ia.far_rebond == true)
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
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** TIME move 2 *********");
                console.log(`distance = ${distance}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 10)
                    this.ia.random_move_2 = false;
            }
            this.ia_ajustement(5, this.ia.random_move_2);
            console.log("FIN DE MOOOOVE");
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
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 1 CLOSE move 2 *********");
                console.log(`distance = ${Math.abs(distance)}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 10)
                    this.ia.random_move_2 = false;
            }
            this.ia_ajustement(5, this.ia.random_move_2);
            console.log("FIN DE MOOOOVE");
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
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 1 FAR move 2 *********");
                console.log(`distance = ${Math.abs(distance)}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 10)
                    this.ia.random_move_2 = false;
            }
            //this.ia.random_move_2 = true;   
            this.ia_ajustement(5, false);
            console.log("FIN DE MOOOOVE");
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
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 2 REBONDS move 2 *********");
                console.log(`distance = ${Math.abs(distance)}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 10)
                    this.ia.random_move_2 = false;
            }
            this.ia_ajustement(5, false);
            console.log("FIN DE MOOOOVE");
            return;
        }
    }
    ia_ajustement(marge, random) {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;
        //console.log(`distance = ${Math.abs(distance)} et marge = ${marge} et continue = ${this.ia.continue_flag}`);
        if (Math.abs(distance) <= marge && random == false) {
            //console.log("CA RETURN LA");
            return;
        }
        if (Math.abs(distance) <= marge && random == true && this.ia.move_flag == true) {
            if (this.ia.continue_flag == true) {
                //console.log(" ----- CONTINUE FLAG ----- ");
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement();
            //console.log("CA RETURN PAR CONTINUE");
            return;
        }
        if (Math.abs(distance) <= marge) {
            //console.log("CA RETURN ICI");
            return;
        }
        if (distance > 0 && this.ia.continue_flag == true) {
            console.log("ajust 1");
            this.paddle.right_paddle_y += this.config.paddle_speed;
            this.ia.move_flag = true;
        }
        else if (distance < 0 && this.ia.continue_flag == true) {
            console.log("ajust 2");
            this.paddle.right_paddle_y -= this.config.paddle_speed;
            this.ia.move_flag = true;
        }
        this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
    }
    ia_ajustement_rebond(marge) {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;
        if (Math.abs(distance) <= marge) {
            if (this.ia.continue_flag == true) {
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement_rebond();
            return;
        }
        if (distance > 0 && this.ia.continue_flag == true) {
            console.log("ajust 1");
            this.paddle.right_paddle_y += this.config.paddle_speed;
        }
        else if (distance < 0 && this.ia.continue_flag == true) {
            console.log("ajust 2");
            this.paddle.right_paddle_y -= this.config.paddle_speed;
        }
        this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
    }
    continue_movement() {
        let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
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
        let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        if (this.ia.distance_with_marge < 0) {
            if (center_paddle - target_y <= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y += this.config.paddle_speed;
                console.log("continue 1");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return;
        }
        else if (this.ia.distance_with_marge >= 0) {
            if (center_paddle - target_y >= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y -= this.config.paddle_speed;
                console.log("continue 2");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return;
        }
        return;
    }
    ia_delta_paddle() {
        let random = random_number(0, 0.45);
        let random_sign = random_bool();
        if (random_sign == true)
            random *= -1;
        return (random * 100);
    }
}
class GamePong {
    static create_game(canvas, mode) {
        return new Pong(canvas, mode);
    }
}
export class Game {
    constructor() {
        this.current_game = null;
    }
    start_game_loop(mode) {
        if (this.current_game)
            this.current_game.stop();
        const canvas = document.getElementById("gameCanvas");
        this.current_game = GamePong.create_game(canvas, mode);
        this.current_game.start();
    }
}
//# sourceMappingURL=game.js.map