'use strict';

const MINE = `<img src="img/ball.png">`;
const PRESSED_MINE = `<img src="img/blowed-ball.png">`;
const MARK = '🚩';

let gIsFirstClick = true;
let gIsHintClick = false;
let gIsTimerRunning = false;
let gIsProcessing = false; //avoid user clicking too fast
let gTimerIntervalId;
let gBoard;
let gLevel = {
    SIZE: 4,
    MINE: 2
}

let gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3,
    hints: 3,
    score: 0
}

function initGame() {
    gBoard = buildBoard();
    renderBoard(gBoard, '.game-table');
    document.querySelector('.game-timer').innerText = '00:00';
    let elBestScore = document.querySelector('.best-score span');
    elBestScore.innerText = localStorage.getItem(`BestScore${gLevel.SIZE}`);
    gGame.isOn = true;
}

function buildBoard() {
    let size = gLevel.SIZE;
    let board = [];
    let cell = null;
    for (let i = 0; i < size; i++) {
        board.push([]);
        for (let j = 0; j < size; j++) {
            cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            board[i][j] = cell;
        }
    }
    return board;
}

function handleClick(event, elCell, i, j) {
    if (!gGame.isOn) return;
    let startTS = Date.now();
    if (!gIsTimerRunning) startTimer(startTS);
    let cell = gBoard[i][j];
    if (event.button === 0) cellClicked(cell, elCell, i, j); //left click
    else if (event.button === 2) cellMark(cell, elCell); //right click
}

function cellClicked(cell, elCell, i, j) {
    if (cell.isShown || cell.isMarked || gIsProcessing) return;
    if (gIsFirstClick) handleFirstClick(cell);
    else if (gIsHintClick) {
        checkHint(cell, i, j);
        return;
    }
    cell.isShown = true;
    elCell.classList.remove('hidden');
    if (cell.isMine) {
        elCell.innerHTML = PRESSED_MINE;
        checkUserLives();
    } else {
        gGame.shownCount++;
        expandShown(gBoard, i, j);
        if ((gLevel.SIZE ** 2 - gLevel.MINE) === gGame.shownCount) checkGameOver(elCell);
    }
}

function checkUserLives() {
    let elLive = document.querySelector(`.live${gGame.lives}`);
    gGame.markedCount++; //count mines as marked
    gGame.lives--;
    elLive.style.display = 'none';
    if (gGame.lives !== 0) blockAudio.play();
    checkGameOver();
}


function expandShown(board, iPos, jPos) {
    for (let i = iPos - 1; i <= iPos + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (let j = jPos - 1; j <= jPos + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue;
            if (gIsHintClick) {
                let elCell = document.querySelector(`.cell-${i}-${j}`);
                if (!board[i][j].isShown && !board[i][j].isMarked || (iPos === i && jPos === j)) { //if not shown or its our pos (our pos is shown by earlier func);
                    elCell.classList.remove('hidden');
                    if (gBoard[i][j].isMine) elCell.innerHTML = MINE;
                    else elCell.innerText = gBoard[i][j].minesAroundCount;
                    setTimeout(() => {
                        elCell.classList.add('hidden');
                        elCell.innerText = '';
                        gIsProcessing = false;
                    }, 1000);
                }
            } else if (!board[i][j].isMine && !board[i][j].isMarked) {
                if (!board[i][j].isShown) gGame.shownCount++;
                let elCell = document.querySelector(`.cell-${i}-${j}`);
                gBoard[i][j].isShown = true;
                elCell.classList.remove('hidden');
                elCell.innerText = gBoard[i][j].minesAroundCount;
            }
        }
    }
}


function cellMark(cell, elCell) {
    if (cell.isShown) return;
    cell.isMarked = (cell.isMarked) ? false : true;
    gGame.markedCount += (cell.isMarked) ? 1 : -1;
    elCell.innerText = (cell.isMarked) ? MARK : '';
    if (gLevel.MINE === gGame.markedCount) checkGameOver(elCell);
}

function changeDifficulty(elBtn) {
    let difficultyBtns = document.querySelectorAll('.difficulty-btn');
    for (let i = 0; i < difficultyBtns.length; i++) {
        difficultyBtns[i].classList.remove('selected-btn');
    }
    elBtn.classList.add('selected-btn');
    let minesAmout = +elBtn.dataset.mine;
    let boardSize = +elBtn.dataset.size;
    gLevel.MINE = minesAmout;
    gLevel.SIZE = boardSize;
    restartGame();
}


function checkGameOver() {
    let elMsgContainer = document.querySelector('.game-msg');
    let elRestartContainer = document.querySelector('.restart-game');
    if (gLevel.MINE === gGame.markedCount && (gLevel.SIZE ** 2 - gLevel.MINE) === gGame.shownCount) {
        gGame.isOn = false;
        elMsgContainer.querySelector('span').innerText = 'YOU WON!';
        elMsgContainer.style.display = 'block';
        elRestartContainer.src = 'img/winningBuu.png';
        clearInterval(gTimerIntervalId);
    } else if (gGame.lives === 0) {
        blowAudio.play();
        gGame.isOn = false;
        elMsgContainer.querySelector('span').innerText = 'YOU LOST!';
        elMsgContainer.style.display = 'block';
        elRestartContainer.src = 'img/angryBuu.png';
        clearInterval(gTimerIntervalId);
        viewMinesOnBoard();
    }
}

function restartGame() {
    gIsFirstClick = true;
    gIsTimerRunning = false;
    let elMsgContainer = document.querySelector('.game-msg');
    elMsgContainer.style.display = 'none';
    let elRestartContainer = document.querySelector('.restart-game');
    elRestartContainer.src = 'img/normalBuu.png';
    //reset hints and lives
    let elLivesAndHints = document.querySelectorAll('.lives,.hints');
    for (let i = 0; i < elLivesAndHints.length; i++) {
        elLivesAndHints[i].style.display = 'inline-block';
    }
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gGame.lives = 3;
    gGame.hints = 3;
    gGame.score = 0;
    gMinesPosition = [];
    initGame();
}

function hintClicked() {
    console.log('clicked');
    if (gGame.hints === 0 || gIsHintClick) return;
    let elMsgContainer = document.querySelector('.game-msg');
    if (gIsFirstClick === true) {
        elMsgContainer.querySelector('span').innerText = 'First turn,save your hint!!!';
        elMsgContainer.style.display = 'block';
        setTimeout(() => {
            elMsgContainer.style.display = 'none';
        }, 1500);
        return;
    }
    gIsHintClick = true;
    let elHints = document.querySelector(`.hint${gGame.hints}`);
    elHints.style.display = 'none';
    gGame.hints--;
    elMsgContainer.querySelector('span').innerText = 'Using Hint?!!!';
    elMsgContainer.style.display = 'block';
}

function checkHint(cell, iPos, jPos) {
    gIsProcessing = true;
    expandShown(gBoard, iPos, jPos);
    cell.isShown = false;
    let elMsgContainer = document.querySelector('.game-msg');
    elMsgContainer.style.display = 'none';
    gIsHintClick = false;
}



function handleFirstClick(cell) {
    cell.isShown = true;
    setMinesOnBoard(gBoard);
    setMinesNegsCount(gBoard);
    gIsFirstClick = false;
}


function userScore(num) {
    let elPlayerScore = document.querySelector('.current-score');
    gGame.score += num;
    elPlayerScore.innerText = gGame.score;
}

function startTimer(startTS) {
    gIsTimerRunning = true;
    let elStopWatch = document.querySelector('.game-timer');
    gTimerIntervalId = setInterval(() => {
        let currentTS = Date.now();
        let correctTime = ((currentTS - startTS) / 1000);
        elStopWatch.innerText = correctTime;
    }, 51);
}