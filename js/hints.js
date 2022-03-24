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

function showHint(elCell, i, j) {
    elCell.classList.remove('hidden');
    if (gBoard[i][j].isMine) elCell.innerHTML = MINE;
    else elCell.innerText = gBoard[i][j].minesAroundCount;
    setTimeout(() => {
        elCell.classList.add('hidden');
        elCell.innerText = '';
        gIsProcessing = false;
    }, 1000);
}

function checkHint(cell, iPos, jPos) {
    gIsProcessing = true;
    expandShown(gBoard, iPos, jPos);
    cell.isShown = false;
    let elMsgContainer = document.querySelector('.game-msg');
    elMsgContainer.style.display = 'none';
    gIsHintClick = false;
}