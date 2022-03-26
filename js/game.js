'use strict';

const MINE = `<img src="img/ball.png">`;
const PRESSED_MINE = `<img src="img/blowed-ball.png">`;
const NOMRAL_BUU = 'img/normalBuu.png';
const WIN_BUU = 'img/winningBuu.png';
const ANGRY_BUU = 'img/angryBuu.png';
const MARK = '🚩';
const undoAudio = new Audio('sound/gokuTeleport.mp3');

let gIsFirstClick = true;
let gIsHintClick = false;
let gIsTimerRunning = false;
let gIsProcessing = false; //avoid user clicking too fast
let gIsManualMode = false;
let gGameSteps = [];
let gUserMinesPositions = [];
let gBestScore = 0;
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
    score: 0,
    safeClick: 3,
    manuallyPlacedMines: 0
}

function initGame() {
    gBoard = buildBoard();
    renderBoard(gBoard, '.game-table');
    document.querySelector('.game-timer').innerText = '00:00';
    getBestScore();
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
                isMarked: false,
                isCalculated: false
            }
            board[i][j] = cell;
        }
    }
    return board;
}

function handleClick(event, elCell, i, j) {
    gGame.isOn = true;
    let cell = gBoard[i][j];
    if (!gGame.isOn || cell.isShown) return;
    let startTS = Date.now();
    if (!gIsTimerRunning && !gIsManualMode) startTimer(startTS); //if timer is running or user in manual mode dont run
    if (event.button === 0) cellClicked(cell, elCell, i, j); //left click
    else if (event.button === 2) cellMark(cell, elCell); //right click
}

function cellClicked(cell, elCell, i, j) {
    if (gIsManualMode && gGame.manuallyPlacedMines !== gLevel.MINE) {
        setMinesManually(i, j);
        return;
    } else if (gIsFirstClick) {
        handleFirstClick(cell, i, j);
        return;
    } else if (cell.isMarked || gIsProcessing) return;
    else if (gIsHintClick) {
        checkHint(cell, i, j);
        return;
    }
    cell.isShown = true;
    elCell.classList.remove('hidden');
    if (cell.isMine) {
        gGameSteps.push([{ i: i, j: j }]);
        elCell.innerHTML = PRESSED_MINE;
        userScore(-5, cell); //mine is -150 points.
        checkUserLives();
    } else {
        renderCell({ i: i, j: j }, cell.minesAroundCount);
        userScore(cell.minesAroundCount, cell);
        gGame.shownCount++;
        //only if we clicked on cell with no neighboors call expand shown.
        if (cell.minesAroundCount === 0) expandShown(gBoard, i, j);
        if ((gLevel.SIZE ** 2 - gLevel.MINE) === gGame.shownCount) checkGameOver(elCell);
    }
}

function handleFirstClick(cell, i, j) {
    cell.isShown = true;
    gGame.shownCount++;
    if (gIsManualMode) {
        //set mines that user chose
        for (let i = 0; i < gMinesPosition.length; i++) {
            let iPos = gMinesPosition[i].i;
            let jPos = gMinesPosition[i].j;
            gBoard[iPos][jPos].isMine = true;
        }
    } else setMinesOnBoard(gBoard);
    setMinesNegsCount(gBoard);
    renderCell({ i: i, j: j }, cell.minesAroundCount);
    userScore(cell.minesAroundCount, cell); //update first clicked cell
    if (cell.minesAroundCount === 0) expandShown(gBoard, i, j); //check neighboors after first click.
    gIsFirstClick = false;
}

function expandShown(board, iPos, jPos) {
    for (var i = iPos - 1; i <= iPos + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = jPos - 1; j <= jPos + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue;
            let cell = board[i][j];
            //check if its an hint click
            if (gIsHintClick) {
                //we skip shown and marked cells.
                //we dont want here to skip our clicked cell.
                if (cell.isShown || cell.isMarked) continue;
                let elCell = document.querySelector(`.cell-${i}-${j}`);
                showHint(elCell, i, j)
            } else {
                //skip our cell which is already updated.
                if (i === iPos && j === jPos) continue;
                //if cell is not a mine/marked/shown
                if (cell.isMine || cell.isMarked || cell.isShown) continue;
                cell.isShown = true;
                gGame.shownCount++;
                userScore(cell.minesAroundCount, cell);
                //if its 0 (no mines close to him - call func again with his position).
                if (cell.minesAroundCount === 0) {
                    expandShown(board, i, j);
                    renderCell({ i: i, j: j }, 0);
                } else {
                    renderCell({ i: i, j: j }, cell.minesAroundCount);
                }
            }
        }
    }
}


function cellMark(cell, elCell) {
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

function checkUserLives() {
    let elLive = document.querySelector(`.live${gGame.lives}`);
    gGame.markedCount++; //count mines as marked
    gGame.lives--;
    elLive.style.display = 'none';
    if (gGame.lives !== 0) blockAudio.play();
    checkGameOver();
}

function checkGameOver() {
    let elMsgContainer = document.querySelector('.game-msg');
    let elRestartContainer = document.querySelector('.restart-game');
    if (gLevel.MINE === gGame.markedCount && (gLevel.SIZE ** 2 - gLevel.MINE) === gGame.shownCount) {
        gGame.isOn = false;
        checkUserScore();
        elMsgContainer.querySelector('span').innerText = 'YOU WON!';
        elMsgContainer.style.display = 'block';
        elRestartContainer.src = WIN_BUU;
        clearInterval(gTimerIntervalId);
    } else if (gGame.lives === 0) {
        blowAudio.play();
        gGame.isOn = false;
        elMsgContainer.querySelector('span').innerText = 'YOU LOST!';
        elMsgContainer.style.display = 'block';
        elRestartContainer.src = ANGRY_BUU;
        clearInterval(gTimerIntervalId);
        viewMinesOnBoard();
    }
}

function restartGame() {
    clearInterval(gTimerIntervalId);
    gIsFirstClick = true;
    gIsTimerRunning = false;
    gIsManualMode = false;
    let elMsgContainer = document.querySelector('.game-msg');
    elMsgContainer.style.display = 'none';
    let elRestartContainer = document.querySelector('.restart-game');
    elRestartContainer.src = NOMRAL_BUU;
    //reset hints and lives
    let elLivesAndHints = document.querySelectorAll('.lives,.hints');
    for (let i = 0; i < elLivesAndHints.length; i++) {
        elLivesAndHints[i].style.display = 'inline-block';
    }
    let elPlayerScore = document.querySelector('.current-score span');
    elPlayerScore.innerText = 0;
    let elSetMinesBtn = document.querySelector('.setmines-click');
    elSetMinesBtn.classList.remove('active-mode');
    elSetMinesBtn.innerText = 'Set mines manually OFF';
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gGame.lives = 3;
    gGame.hints = 3;
    gGame.safeClick = 3;
    gGame.score = 0;
    gGame.manuallyPlacedMines = 0;
    document.querySelector('.safe-click span').innerText = gGame.safeClick;
    gGameSteps = [];
    gMinesPosition = [];
    gUserMinesPositions = [];
    initGame();
}

function safeClick() {
    if (!gGame.isOn || gIsFirstClick || gGame.safeClick === 0 ||
        (gLevel.SIZE ** 2 - gLevel.MINE) === gGame.shownCount) return; //all free of mines cells are shown already.
    gGame.safeClick--;
    let elMsgContainer = document.querySelector('.game-msg');
    elMsgContainer.querySelector('span').innerText = `Need help goku? 😂`;
    elMsgContainer.style.display = 'block';
    setTimeout(() => { elMsgContainer.style.display = 'none'; }, 2000);
    let elSafeBtn = document.querySelector('.safe-click span');
    elSafeBtn.innerText = gGame.safeClick;
    let freePositions = getNoMinePositions(gBoard);
    let randomNum = getRandomNum(freePositions.length);
    let freePos = freePositions[randomNum];
    let elCell = document.querySelector(`.cell-${freePos.i}-${freePos.j}`);
    elCell.classList.add('cellHighlight');
    setTimeout(() => {
        elCell.classList.remove('cellHighlight');
    }, 3000);
}

function gameUndo() {
    if (!gGame.isOn || gIsFirstClick || gGameSteps.length === 0) return;
    let lastGameStep = gGameSteps.pop();
    reverseRenderCell(...lastGameStep);
    undoAudio.play();
}

function checkUserScore() {
    if (gGame.score > gBestScore || !gBestScore) {
        localStorage.setItem(`BestScore${gLevel.SIZE}`, gGame.score);
        getBestScore();
    }
}

function userScore(num, cell) {
    if (cell.isCalculated) return; //incase of undo - dont count this cell!
    cell.isCalculated = true;
    let scoreNum = 100 + num * 50;
    gGame.score += scoreNum;
    let elPlayerScore = document.querySelector('.current-score span');
    elPlayerScore.innerText = gGame.score;
}

function getBestScore() {
    let elBestScore = document.querySelector('.best-score span');
    let currentScore = localStorage.getItem(`BestScore${gLevel.SIZE}`);
    if (!currentScore) {
        gBestScore = 0;
        elBestScore.innerText = 'No record';
    } else {
        gBestScore = localStorage.getItem(`BestScore${gLevel.SIZE}`);
        elBestScore.innerText = gBestScore;
    }
}

function setMinesMode(elSetMinesBtn) {
    //if user placed 1 mine the game isOn state is true, user cannot turn off manually mode!
    if (gGame.isOn || gGame.manuallyPlacedMines === gLevel.MINE) return;
    let elMsgContainer = document.querySelector('.game-msg');
    elSetMinesBtn.classList.toggle('active-mode');
    if (!gIsManualMode) {
        gIsManualMode = true;
        elSetMinesBtn.innerText = 'Set mines manually ON';
        elMsgContainer.querySelector('span').innerText = `PLACE ${gLevel.MINE} MINES!`;
        elMsgContainer.style.display = 'block';
    } else {
        gIsManualMode = false;
        gUserMinesPositions = [];
        gMinesPosition = [];
        gGame.manuallyPlacedMines = 0;
        elSetMinesBtn.innerText = 'Set mines manually OFF';
        elMsgContainer.style.display = 'none';
    }
}

function setMinesManually(i, j) {
    let elMsgContainer = document.querySelector('.game-msg');
    if (gUserMinesPositions.includes(`${i}${j}`)) return;
    gUserMinesPositions.push(`${i}${j}`);
    gGame.manuallyPlacedMines++;
    gMinesPosition.push({ i: i, j: j });
    elMsgContainer.querySelector('span').innerText = `PLACE ${gLevel.MINE-gMinesPosition.length} MINES!`;
    if (gMinesPosition.length === gLevel.MINE) {
        elMsgContainer.querySelector('span').innerText = `Time to play!`;
        setTimeout(() => { elMsgContainer.style.display = 'none'; }, 1500);
    }
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