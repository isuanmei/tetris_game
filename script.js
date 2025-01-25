const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-block');
const nextContext = nextCanvas.getContext('2d');
const scale = 40;
const arenaWidth = 15;
const arenaHeight = 20;
const dropInterval = 1000; // 初始下落间隔时间为1秒
let dropCounter = 0;
let lastTime = 0;
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score'), 10) : 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore'), 10) : 0;
let status = localStorage.getItem('status') || 'Playing';

// 更新分数显示
document.getElementById('score').textContent = score;
document.getElementById('high-score').textContent = highScore;
document.getElementById('status').textContent = status;

let gameDuration = 0; // 添加: 用于跟踪游戏持续时间
const speedIncreaseInterval = 300000; // 5分钟，单位为毫秒
const speedIncreaseRate = 0.9; // 每次速度增加的比率
const colors = [
    null,
    '#FFA500', // 橘黄色
    '#FFFFE0', // 浅黄色，替换原来的柔和的粉红色。
    '#FF8C69', // 灰橙色
    '#ADD8E6', // 雾霾蓝
    '#90EE90', // 灰绿色
    '#D8BFD8', // 浅灰紫
    '#87CEEB'  // 灰蓝色
];

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2]
        ];
    } else if (type === 'L') {
        return [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ];
    } else if (type === 'J') {
        return [
            [4, 0, 0],
            [4, 4, 4],
            [0, 0, 0]
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0]
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0]
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
                context.strokeStyle = '#000';
                context.strokeRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
            }
        });
    });
}

function drawNextMatrix(matrix) {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                nextContext.fillStyle = colors[value];
                nextContext.fillRect(x * 40, y * 40, 40, 40);
                nextContext.strokeStyle = '#000';
                nextContext.strokeRect(x * 40, y * 40, 40, 40);
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    drawNextMatrix(player.matrix);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        score = 0;
        updateScore();
    }
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        score += rowCount * 10;
        rowCount *= 2;
    }
}

// 更新分数时，保存到 localStorage
function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
    localStorage.setItem('score', score);

    // 更新最高分
    if (score > highScore) {
        highScore = score;
        document.getElementById('high-score').textContent = highScore;
        localStorage.setItem('highScore', highScore);
    }
}

let isPaused = false; // 添加: 用于跟踪游戏是否暂停

function pauseGame() {
    if (isPaused) {
        isPaused = false;
        update(); // 重新开始游戏循环
    } else {
        isPaused = true;
        alert("你想去NN吗？");
        isPaused = false; // 自动继续游戏
        update(); // 重新开始游戏循环
    }
}

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    gameDuration += deltaTime; // 更新游戏持续时间

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    // 检查是否需要增加速度
    if (gameDuration >= speedIncreaseInterval) {
        dropInterval *= speedIncreaseRate; // 增加速度
        gameDuration = 0; // 重置游戏持续时间
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);

    requestAnimationFrame(update);
}

function moveLeft() {
    playerMove(-1);
}

function moveRight() {
    playerMove(1);
}

function rotateLeft() {
    rotate(player.matrix, -1);
    const pos = player.pos.x;
    let offset = 1;
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, 1);
            player.pos.x = pos;
            return;
        }
    }
}

function rotateRight() {
    rotate(player.matrix, 1);
    const pos = player.pos.x;
    let offset = 1;
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -1);
            player.pos.x = pos;
            return;
        }
    }
}

const arena = createMatrix(arenaWidth, arenaHeight);
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
};

let touchStartX = 0;
let touchStartY = 0;
let touchMoveX = 0;
let touchMoveY = 0;
let touchStartTime = 0;

canvas.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchStartTime = Date.now();
});

canvas.addEventListener('touchmove', (event) => {
    touchMoveX = event.touches[0].clientX;
    touchMoveY = event.touches[0].clientY;
});

canvas.addEventListener('touchend', (event) => {
    const deltaX = touchMoveX - touchStartX;
    const deltaY = touchMoveY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;

    if (deltaTime < 300 && Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
        // Short tap, rotate left
        rotateLeft();
    } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
            moveRight();
        } else {
            moveLeft();
        }
    } else if (deltaY > 0) {
        // Vertical swipe down
        playerDrop();
    }
});

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        moveLeft();
    } else if (event.keyCode === 39) {
        moveRight();
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 65) { // 修改: 65 对应 A 键
        rotateLeft();
    } else if (event.keyCode === 90) { // 修改: 90 对应 Z 键
        rotateRight();
    } else if (event.keyCode === 32) { // 添加: 32 对应空格键
        pauseGame();
    }
});

// 更新状态时，保存到 localStorage
function updateStatus(newStatus) {
    status = newStatus;
    document.getElementById('status').textContent = status;
    localStorage.setItem('status', status);
}

// 重置游戏时，清除 localStorage 中的数据
function resetGame() {
    localStorage.clear(); // 清除所有存储的数据

    score = 0;
    highScore = 0;
    status = 'Playing';

    document.getElementById('score').textContent = score;
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('status').textContent = status;
}

playerReset();
updateScore();
update();