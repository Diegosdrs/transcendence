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
                ball_real_speed: 8,
                ball_speed: 4.5,
                ball_max_speed: 12,
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
        //this.setup_event();
        //this.init_ball_direction()
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    setup_event() {
        document.addEventListener("keydown", this.handle_keydown);
        document.addEventListener("keyup", this.handle_keyup);
    }
    start() {
        //this.draw();
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
                    //this.game_loop();
                }
            }, 1000);
        }, 1000);
    }
    gameLoop(currentTime) {
        const delta = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.fps = Math.round(1000 / delta);
        console.log("FPS :", this.fps);
        // Ici tu mets ton update & draw
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
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
            //this.current_game.restart();
        }
    }
}
//# sourceMappingURL=game_solo_detectfps.js.map