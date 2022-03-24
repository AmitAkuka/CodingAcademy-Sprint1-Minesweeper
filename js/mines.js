const blowAudio = new Audio('sound/explosion.mp3');
const blockAudio = new Audio('sound/block.wav');
let gMinesPosition = [];

function setMinesOnBoard(board) {
    let freePositions = getNoMinePositions(board);
    let freePos = {};
    for (let i = 0; i < gLevel.MINE; i++) {
        let randomNum = getRandomNum(freePositions.length) //using floor so we can give full length.
        freePos = freePositions[randomNum];
        board[freePos.i][freePos.j].isMine = true;
        gMinesPosition.push(...freePositions.splice(randomNum, 1));
    }
}

function getNoMinePositions(board) {
    console.log(board);
    let freePositions = [];
    let freePos = null;
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            if (!board[i][j].isMine && !board[i][j].isShown) { //added isShown status to avoid first click on a mine.
                freePos = {
                    i: i,
                    j: j
                }
                freePositions.push(freePos);
            }
        }
    }
    return freePositions;
}

function setMinesNegsCount(board) {
    let pos = null;
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) { //loop through all cell in boards again
            pos = {
                i: i,
                j: j
            }
            board[i][j].minesAroundCount = findMinesAroundCell(board, pos);
        }
    }
}

function findMinesAroundCell(board, pos) {
    let minesAroundCellCount = 0;
    for (let i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i > board.length - 1) continue; //check if i outside range
        for (let j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue; //check if j outside range
            if (board[i][j].isMine) {
                minesAroundCellCount++;
            }
        }
    }
    return minesAroundCellCount;
}

function viewMinesOnBoard() {
    for (let i = 0; i < gMinesPosition.length; i++) {
        let iPos = gMinesPosition[i].i;
        let jPos = gMinesPosition[i].j;
        gBoard[iPos][jPos].isShown = true;
        let elCell = document.querySelector(`.cell-${iPos}-${jPos}`);
        if (elCell.innerHTML === PRESSED_MINE) continue;
        elCell.classList.remove('hidden');
        elCell.innerHTML = MINE;
    }
}