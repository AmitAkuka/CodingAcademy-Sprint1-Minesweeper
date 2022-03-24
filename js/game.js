'use strict';

const MINE = `<img src="img/ball.png">`;
const PRESSED_MINE = `<img src="img/blowed-ball.png">`;
const MARK = '🚩';

let gIsFirstClick = true;
let gIsHintClick = false;
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
    hints: 3
}

function initGame() {
    gBoard = buildBoard();
    renderBoard(gBoard, ".game-table");
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
    let cell = gBoard[i][j];
    if (event.button === 0) cellClicked(cell, elCell, i, j); //left click
    else if (event.button === 2) cellMark(cell, elCell); //right click
}

function cellClicked(cell, elCell, i, j) {
    if (cell.isShown || cell.isMarked) return;
    //Update Model
    cell.isShown = true;
    //set isShown to true before checking first click.
    if (gIsFirstClick) handleFirstClick();
    if (gIsHintClick) {
        checkHint(cell, i, j);
        return;
    }
    //Update DOM
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
    if (gGame.lives === 0) checkGameOver();
    else blockAudio.play();
}


function expandShown(board, iPos, jPos) {
    for (let i = iPos - 1; i <= iPos + 1; i++) {
        if (i < 0 || i > board.length - 1) continue; //check if i outside range
        for (let j = jPos - 1; j <= jPos + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue; //check if j outside range
            if (gIsHintClick) {
                let elCell = document.querySelector(`.cell-${i}-${j}`);
                if (!board[i][j].isShown && !board[i][j].isMarked || (iPos === i && jPos === j)) { //if not shown or its our pos (our pos is shown by earlier func);
                    elCell.classList.remove('hidden');
                    if (gBoard[i][j].isMine) elCell.innerHTML = MINE;
                    else elCell.innerText = gBoard[i][j].minesAroundCount;
                    setTimeout(() => {
                        elCell.classList.add('hidden');
                        elCell.innerText = '';
                    }, 1000);
                }
            } else if (!board[i][j].isMine && !board[i][j].isMarked) {
                if (!board[i][j].isShown) gGame.shownCount++;
                let elCell = document.querySelector(`.cell-${i}-${j}`);
                //MODEL
                gBoard[i][j].isShown = true;
                //DOM
                elCell.classList.remove('hidden');
                elCell.innerText = gBoard[i][j].minesAroundCount;
            }
        }
    }
}


function cellMark(cell, elCell) {
    if (cell.isShown) return;
    //Update Model
    cell.isMarked = (cell.isMarked) ? false : true;
    gGame.markedCount += (cell.isMarked) ? 1 : -1;
    //Update DOM
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
    if (gGame.lives === 0) {
        blowAudio.play();
        gGame.isOn = false;
        elMsgContainer.querySelector('span').innerText = 'YOU LOST!';
        elMsgContainer.style.display = 'block';
        elRestartContainer.src = 'img/angryBuu.png';
        viewMinesOnBoard();
    } else if (gLevel.MINE === gGame.markedCount && (gLevel.SIZE ** 2 - gLevel.MINE) === gGame.shownCount) {
        gGame.isOn = false;
        elMsgContainer.querySelector('span').innerText = 'YOU WON!';
        elMsgContainer.style.display = 'block';
        elRestartContainer.src = 'img/winningBuu.png';
    }
}

function restartGame() {
    gIsFirstClick = true;
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
    gMinesPosition = [];
    initGame();
}

function hintClicked() {
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
    expandShown(gBoard, iPos, jPos);
    cell.isShown = false;
    let elMsgContainer = document.querySelector('.game-msg');
    elMsgContainer.style.display = 'none';
    gIsHintClick = false;
}



function handleFirstClick() {
    setMinesOnBoard(gBoard);
    setMinesNegsCount(gBoard);
    gIsFirstClick = false;
}

//hide context menu.
const noContext = document.querySelector(".game-table");

noContext.addEventListener('contextmenu', e => {
    e.preventDefault();
});