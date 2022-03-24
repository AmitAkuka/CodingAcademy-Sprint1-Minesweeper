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

// location such as: {i: 2, j: 7}
function renderCell(location, value) {
    // Select the elCell and set the value
    let elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
    elCell.innerHTML = value;
}

function getRandomNum(num) {
    return Math.floor(Math.random() * num);
}