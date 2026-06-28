const CHARS = ['1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G'];
let solution = [];
let board = [];
let fixed = [];
let pencilMarks = [];
let selectedCell = null;

let isPencilMode = false;
let mistakes = 0;
let mistakeLimit = 3;
let hintsLeft = 5;

let timerInterval = null;
let secondsElapsed = 0;

// ==========================================
// GERAÇÃO DO SUDOKU
// ==========================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getBaseGrid() {
    let grid = [];
    for (let r = 0; r < 16; r++) {
        let row = [];
        for (let c = 0; c < 16; c++) {
            row.push((r * 4 + Math.floor(r / 4) + c) % 16 + 1);
        }
        grid.push(row);
    }
    return grid;
}

function shuffleRows(grid) {
    for (let band = 0; band < 4; band++) {
        for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
                if (Math.random() > 0.5) {
                    let temp = grid[band * 4 + i];
                    grid[band * 4 + i] = grid[band * 4 + j];
                    grid[band * 4 + j] = temp;
                }
            }
        }
    }
    return grid;
}

function shuffleCols(grid) {
    for (let stack = 0; stack < 4; stack++) {
        for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
                if (Math.random() > 0.5) {
                    for (let r = 0; r < 16; r++) {
                        let temp = grid[r][stack * 4 + i];
                        grid[r][stack * 4 + i] = grid[r][stack * 4 + j];
                        grid[r][stack * 4 + j] = temp;
                    }
                }
            }
        }
    }
    return grid;
}

function shuffleBands(grid) {
    let bands = [0, 1, 2, 3];
    shuffleArray(bands);
    let newGrid = [];
    for (let i = 0; i < 4; i++) {
        let oldBand = bands[i];
        for (let r = 0; r < 4; r++) {
            newGrid.push([...grid[oldBand * 4 + r]]);
        }
    }
    return newGrid;
}

function shuffleStacks(grid) {
    let stacks = [0, 1, 2, 3];
    shuffleArray(stacks);
    let newGrid = Array.from({length: 16}, () => Array(16).fill(0));
    for (let r = 0; r < 16; r++) {
        for (let i = 0; i < 4; i++) {
            let oldStack = stacks[i];
            for (let c = 0; c < 4; c++) {
                newGrid[r][i * 4 + c] = grid[r][oldStack * 4 + c];
            }
        }
    }
    return newGrid;
}

function shuffleDigits(grid) {
    let digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    shuffleArray(digits);
    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            grid[r][c] = digits[grid[r][c] - 1];
        }
    }
    return grid;
}

function transpose(grid) {
    if (Math.random() > 0.5) {
        let newGrid = Array.from({length: 16}, () => Array(16).fill(0));
        for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
                newGrid[c][r] = grid[r][c];
            }
        }
        return newGrid;
    }
    return grid;
}

function generateValidGrid() {
    let grid = getBaseGrid();
    grid = shuffleRows(grid);
    grid = shuffleCols(grid);
    grid = shuffleBands(grid);
    grid = shuffleStacks(grid);
    grid = shuffleDigits(grid);
    grid = transpose(grid);
    return grid;
}

function removePencilMarkFromRelated(row, col, number) {
    for (let c = 0; c < 16; c++) {
        if (c !== col && pencilMarks[row][c].has(number)) pencilMarks[row][c].delete(number);
    }
    for (let r = 0; r < 16; r++) {
        if (r !== row && pencilMarks[r][col].has(number)) pencilMarks[r][col].delete(number);
    }
    const blockRow = Math.floor(row / 4) * 4;
    const blockCol = Math.floor(col / 4) * 4;
    for (let r = blockRow; r < blockRow + 4; r++) {
        for (let c = blockCol; c < blockCol + 4; c++) {
            if ((r !== row || c !== col) && pencilMarks[r][c].has(number)) pencilMarks[r][c].delete(number);
        }
    }
}

// ==========================================
// CRONÔMETRO
// ==========================================
function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
        return `️ ${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `⏱️ ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const el = document.getElementById('timer-display');
    if (el) el.textContent = formatTime(secondsElapsed);
}

// ==========================================
// PAINEL DE PREVIEW
// ==========================================
function updatePreview() {
    console.log('updatePreview chamado', selectedCell);
    
    const previewCell = document.getElementById('preview-cell');
    const infoPosition = document.getElementById('info-position');
    const infoBlock = document.getElementById('info-block');
    const infoStatus = document.getElementById('info-status');

    if (!previewCell) {
        console.error('preview-cell não encontrado!');
        return;
    }

    // Reset classes
    previewCell.className = 'preview-cell';
    previewCell.innerHTML = '';

    if (!selectedCell) {
        previewCell.innerHTML = '<div class="preview-empty">Clique em uma célula</div>';
        if (infoPosition) infoPosition.textContent = '-';
        if (infoBlock) infoBlock.textContent = '-';
        if (infoStatus) infoStatus.textContent = '-';
        return;
    }

    const {r, c} = selectedCell;
    const value = board[r][c];
    const isFixed = fixed[r][c];
    const isCorrect = value !== 0 && value === solution[r][c];
    const isError = value !== 0 && value !== solution[r][c] && !isFixed;
    const blockRow = Math.floor(r / 4) + 1;
    const blockCol = Math.floor(c / 4) + 1;

    // Atualiza informações
    if (infoPosition) infoPosition.textContent = `L${r + 1} / C${c + 1}`;
    if (infoBlock) infoBlock.textContent = `B${blockRow}-${blockCol}`;

    // Determina status
    let status = 'Vazia';
    if (isFixed) status = '🔒 Fixo';
    else if (isCorrect) status = '✅ Correto';
    else if (isError) status = '❌ Errado';
    else if (pencilMarks[r][c].size > 0) status = `✏️ ${pencilMarks[r][c].size} rascunho(s)`;
    if (infoStatus) infoStatus.textContent = status;

    // Renderiza conteúdo da célula
    if (value !== 0) {
        const valSpan = document.createElement('span');
        valSpan.className = 'preview-value';
        valSpan.textContent = CHARS[value - 1];
        
        if (isFixed) valSpan.classList.add('fixed-value');
        else if (isError) valSpan.classList.add('error-value');
        else valSpan.classList.add('user-value');
        
        previewCell.appendChild(valSpan);
        
        if (isFixed) previewCell.classList.add('fixed');
        if (isError) previewCell.classList.add('error');
    } else if (pencilMarks[r][c].size > 0) {
        const miniGrid = document.createElement('div');
        miniGrid.className = 'preview-pencil-grid';
        for (let i = 1; i <= 16; i++) {
            const mark = document.createElement('span');
            mark.className = 'preview-pencil-mark';
            if (pencilMarks[r][c].has(i)) {
                mark.textContent = CHARS[i - 1];
                mark.classList.add('active');
            }
            miniGrid.appendChild(mark);
        }
        previewCell.appendChild(miniGrid);
    } else {
        previewCell.innerHTML = '<div class="preview-empty">Célula vazia</div>';
    }

    previewCell.classList.add('selected-preview');
}

// ==========================================
// LÓGICA DO JOGO
// ==========================================
function updateDifficultySettings() {
    const diff = document.getElementById('difficulty').value;
    if (diff === '100') mistakeLimit = 2;
    else if (diff === '130') mistakeLimit = 3;
    else if (diff === '150') mistakeLimit = 5;
    updateMistakesUI();
}

function newGame() {
    const holes = parseInt(document.getElementById('difficulty').value);
    solution = generateValidGrid();
    
    board = solution.map(row => [...row]);
    fixed = Array.from({length: 16}, () => Array(16).fill(false));
    pencilMarks = Array.from({length: 16}, () => Array.from({length: 16}, () => new Set()));
    
    let cellsRemoved = 0;
    while (cellsRemoved < holes) {
        let r = Math.floor(Math.random() * 16);
        let c = Math.floor(Math.random() * 16);
        if (board[r][c] !== 0) {
            board[r][c] = 0;
            cellsRemoved++;
        }
    }

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            if (board[r][c] !== 0) fixed[r][c] = true;
        }
    }

    mistakes = 0;
    hintsLeft = 5;
    selectedCell = null;
    isPencilMode = false;
    secondsElapsed = 0;
    
    document.getElementById('message').textContent = '';
    document.getElementById('gameOverModal').classList.remove('show');
    document.getElementById('pencil-btn').textContent = '✏️ Rascunho: OFF';
    document.getElementById('pencil-btn').classList.remove('active-mode');
    
    updateDifficultySettings();
    updateHintsUI();
    updateTimerDisplay();
    updatePreview();
    renderGrid();
    updateCounts();
    startTimer();
}

function restartGame() {
    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            if (!fixed[r][c]) {
                board[r][c] = 0;
                pencilMarks[r][c].clear();
            }
        }
    }
    mistakes = 0;
    hintsLeft = 5;
    selectedCell = null;
    secondsElapsed = 0;
    
    document.getElementById('message').textContent = '';
    document.getElementById('gameOverModal').classList.remove('show');
    
    updateHintsUI();
    updateTimerDisplay();
    updatePreview();
    renderGrid();
    updateCounts();
    startTimer();
}

function renderGrid() {
    const gridEl = document.getElementById('grid');
    gridEl.innerHTML = '';

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            if ((c + 1) % 4 === 0 && c !== 15) cell.classList.add('border-right');
            if ((r + 1) % 4 === 0 && r !== 15) cell.classList.add('border-bottom');
            if (fixed[r][c]) cell.classList.add('fixed');
            
            if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
                cell.classList.add('selected');
            } else if (selectedCell) {
                const sameBox = Math.floor(r / 4) === Math.floor(selectedCell.r / 4) && 
                              Math.floor(c / 4) === Math.floor(selectedCell.c / 4);
                if (r === selectedCell.r || c === selectedCell.c || sameBox) {
                    cell.classList.add('highlight');
                }
                const selectedVal = board[selectedCell.r][selectedCell.c];
                if (selectedVal !== 0 && board[r][c] === selectedVal) {
                    cell.classList.add('same-number');
                }
            }

            if (board[r][c] !== 0) {
                cell.textContent = CHARS[board[r][c] - 1];
                if (!fixed[r][c] && board[r][c] !== solution[r][c]) {
                    cell.classList.add('error');
                }
            } else if (pencilMarks[r][c].size > 0) {
                const miniGrid = document.createElement('div');
                miniGrid.className = 'pencil-grid';
                for (let i = 1; i <= 16; i++) {
                    const mark = document.createElement('span');
                    mark.className = 'pencil-mark';
                    if (pencilMarks[r][c].has(i)) {
                        mark.textContent = CHARS[i - 1];
                    }
                    miniGrid.appendChild(mark);
                }
                cell.appendChild(miniGrid);
            }

            cell.addEventListener('click', () => {
                selectedCell = {r, c};
                renderGrid();
                updatePreview();
            });

            gridEl.appendChild(cell);
        }
    }
}

function handleInput(val) {
    if (!selectedCell) return;
    const {r, c} = selectedCell;
    if (fixed[r][c]) return;

    if (isPencilMode && val !== 0) {
        if (pencilMarks[r][c].has(val)) {
            pencilMarks[r][c].delete(val);
        } else {
            pencilMarks[r][c].add(val);
        }
        renderGrid();
        updatePreview();
        return;
    }

    if (val === 0) {
        board[r][c] = 0;
        pencilMarks[r][c].clear();
    } else {
        if (val === solution[r][c]) {
            board[r][c] = val;
            pencilMarks[r][c].clear();
            removePencilMarkFromRelated(r, c, val);
            if (typeof triggerEffectsAfterMove === 'function') {
                triggerEffectsAfterMove(r, c);
            }
        } else {
            mistakes++;
            updateMistakesUI();
            
            const cells = document.querySelectorAll('.cell');
            const index = r * 16 + c;
            if (cells[index]) {
                cells[index].classList.add('error');
                setTimeout(() => {
                    if (board[r][c] === 0) cells[index].classList.remove('error');
                }, 500);
            }

            if (mistakes >= mistakeLimit) {
                triggerGameOver();
                return;
            }
        }
    }

    renderGrid();
    updatePreview();
    updateCounts();
    checkWin();
}

function togglePencilMode() {
    isPencilMode = !isPencilMode;
    const btn = document.getElementById('pencil-btn');
    if (isPencilMode) {
        btn.textContent = '✏️ Rascunho: ON';
        btn.classList.add('active-mode');
    } else {
        btn.textContent = '✏️ Rascunho: OFF';
        btn.classList.remove('active-mode');
    }
}

function useHint() {
    if (!selectedCell || hintsLeft <= 0) return;
    const {r, c} = selectedCell;
    if (fixed[r][c]) return;

    board[r][c] = solution[r][c];
    fixed[r][c] = true;
    pencilMarks[r][c].clear();
    
    hintsLeft--;
    updateHintsUI();
    renderGrid();
    updatePreview();
    updateCounts();
    checkWin();
}

function updateHintsUI() {
    const btn = document.getElementById('hint-btn');
    const countSpan = document.getElementById('hints-count');
    countSpan.textContent = hintsLeft;
    
    if (hintsLeft <= 0) {
        btn.style.display = 'none';
    } else {
        btn.style.display = 'block';
    }
}

function updateMistakesUI() {
    document.getElementById('mistakes-display').textContent = `Erros: ${mistakes} / ${mistakeLimit}`;
}

function triggerGameOver() {
    stopTimer();
    if (typeof triggerDefeatEffects === 'function') {
        triggerDefeatEffects();
    }
    setTimeout(() => {
        document.getElementById('gameOverModal').classList.add('show');
    }, 1200);
}

function updateCounts() {
    for (let i = 1; i <= 16; i++) {
        let correctCount = 0;
        for (let r = 0; r < 16; r++) {
            for (let c = 0; c < 16; c++) {
                if (board[r][c] === i && board[r][c] === solution[r][c]) {
                    correctCount++;
                }
            }
        }
        
        let missing = 16 - correctCount;
        const btn = document.getElementById(`btn-${i}`);
        const countEl = document.getElementById(`count-${i}`);
        
        if (countEl) countEl.textContent = `(${missing})`;

        if (btn) {
            if (missing === 0) {
                if (!btn.classList.contains('completed')) {
                    btn.classList.add('completed');
                    btn.disabled = true;
                    if (typeof playNumberCompleteSound === 'function') {
                        playNumberCompleteSound();
                    }
                }
            } else {
                if (btn.classList.contains('completed')) {
                    btn.classList.remove('completed');
                    btn.disabled = false;
                }
            }
        }
    }
}

function checkWin() {
    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            if (board[r][c] !== solution[r][c]) return;
        }
    }
    stopTimer();
    if (typeof triggerVictoryEffects === 'function') {
        triggerVictoryEffects();
    }
    document.getElementById('message').textContent = '🎉 Parabéns! Você completou o Sudoku!';
}

function initNumpad() {
    const numpad = document.getElementById('numpad');
    numpad.innerHTML = '';
    
    CHARS.forEach((char, index) => {
        const btn = document.createElement('button');
        btn.className = 'num-btn';
        btn.id = `btn-${index + 1}`;
        btn.innerHTML = `<span class="char">${char}</span><span class="count" id="count-${index + 1}">(16)</span>`;
        btn.addEventListener('click', () => handleInput(index + 1));
        numpad.appendChild(btn);
    });
}

document.addEventListener('keydown', (e) => {
    if (!selectedCell) return;
    
    const key = e.key;
    
    if (key === 'ArrowUp') { e.preventDefault(); selectedCell.r = Math.max(0, selectedCell.r - 1); renderGrid(); updatePreview(); return; }
    if (key === 'ArrowDown') { e.preventDefault(); selectedCell.r = Math.min(15, selectedCell.r + 1); renderGrid(); updatePreview(); return; }
    if (key === 'ArrowLeft') { e.preventDefault(); selectedCell.c = Math.max(0, selectedCell.c - 1); renderGrid(); updatePreview(); return; }
    if (key === 'ArrowRight') { e.preventDefault(); selectedCell.c = Math.min(15, selectedCell.c + 1); renderGrid(); updatePreview(); return; }
    
    if (key === 'Backspace' || key === 'Delete') { e.preventDefault(); handleInput(0); return; }
    if (key === '0') { e.preventDefault(); handleInput(0); return; }
    
    if (key >= '1' && key <= '9') { e.preventDefault(); handleInput(parseInt(key)); return; }
    if (key >= 'a' && key <= 'g') { e.preventDefault(); handleInput(key.charCodeAt(0) - 97 + 10); return; }
    if (key >= 'A' && key <= 'G') { e.preventDefault(); handleInput(key.charCodeAt(0) - 65 + 10); return; }
});

// Inicialização
console.log('Inicializando jogo...');
initNumpad();
updateDifficultySettings();
newGame();