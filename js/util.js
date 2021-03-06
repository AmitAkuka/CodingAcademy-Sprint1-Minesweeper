function renderBoard(board, selector) {
    let strHTML = '<tbody>';
    for (let i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (let j = 0; j < board[0].length; j++) {
            let className = `cell cell-${i}-${j} hidden`;
            strHTML += `<td class="${className}" onmousedown="handleClick(event,this, ${i},${j})"> </td>`;
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody>';
    let elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}

//hide context menu.
const noContext = document.querySelector('.game-table');

noContext.addEventListener('contextmenu', e => {
    e.preventDefault();
});

//
function renderCell(pos, value) {
    gGameSteps.push([{ i: pos.i, j: pos.j }]);
    let elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`);
    elCell.classList.remove('hidden');
    elCell.innerText = value;
}

function reverseRenderCell(pos) {
    let elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`);
    gBoard[pos.i][pos.j].isShown = false;
    gGame.shownCount--;
    elCell.classList.add('hidden');
    elCell.innerText = '';
}

function getRandomNum(num) {
    return Math.floor(Math.random() * num);
}