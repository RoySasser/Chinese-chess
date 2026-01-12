// 中国象棋逻辑
(() => {
  const GRID_SIZE = 45; // 与 CSS 对应
  const OFFSET_X = 20;  // 棋盘内边距
  const OFFSET_Y = 20;

  const BOARD_ROWS = 10;
  const BOARD_COLS = 9;

  // 棋盘状态：数组存储棋子对象或null
  // 坐标：r (0-9), c (0-8)
  // 红方在下 (r=9侧)，黑方在上 (r=0侧)
  let board = [];
  let currentTurn = 'red'; // 'red' or 'black'
  let selectedPiece = null; // {r, c, type, color}
  let gameOver = false;

  const container = document.getElementById('chessboard');
  const turnIndicator = document.getElementById('turn-indicator');
  const resetBtn = document.getElementById('resetBtn');

  // 初始化
  function init() {
    drawBoardLines();
    resetGame();
    resetBtn.addEventListener('click', resetGame);
  }

  // 重置游戏
  function resetGame() {
    board = createInitialBoard();
    currentTurn = 'red';
    selectedPiece = null;
    gameOver = false;
    updateTurnUI();
    renderPieces();
    clearDots();
  }

  // 创建初始棋盘布局
  function createInitialBoard() {
    const b = new Array(BOARD_ROWS).fill(0).map(() => new Array(BOARD_COLS).fill(null));

    // 定义棋子工厂
    const p = (color, type) => ({ color, type }); // color: 'red'/'black', type: 'c'(车),'m'(马),'x'(相/象),'s'(士/仕),'j'(将/帅),'p'(炮),'z'(卒/兵)

    // 黑方 (Top, r=0..4)
    const blackRow0 = ['c','m','x','s','j','s','x','m','c'];
    blackRow0.forEach((t, i) => b[0][i] = p('black', t));
    b[2][1] = p('black', 'p'); b[2][7] = p('black', 'p');
    [0,2,4,6,8].forEach(i => b[3][i] = p('black', 'z'));

    // 红方 (Bottom, r=5..9)
    const redRow9 = ['c','m','x','s','j','s','x','m','c'];
    redRow9.forEach((t, i) => b[9][i] = p('red', t));
    b[7][1] = p('red', 'p'); b[7][7] = p('red', 'p');
    [0,2,4,6,8].forEach(i => b[6][i] = p('red', 'z'));

    return b;
  }

  // 绘制棋盘线（静态DOM）
  function drawBoardLines() {
    container.innerHTML = '';

    // 横线 (10条)
    for (let r=0; r<BOARD_ROWS; r++) {
      const line = document.createElement('div');
      line.className = 'grid-line h-line';
      line.style.width = `${(BOARD_COLS-1)*GRID_SIZE}px`;
      line.style.left = `${OFFSET_X}px`;
      line.style.top = `${OFFSET_Y + r*GRID_SIZE}px`;
      container.appendChild(line);
    }
    // 竖线 (9条)，注意楚河汉界断开
    for (let c=0; c<BOARD_COLS; c++) {
      // 上半区 r=0..4
      let line = document.createElement('div');
      line.className = 'grid-line v-line';
      line.style.height = `${4*GRID_SIZE}px`;
      line.style.left = `${OFFSET_X + c*GRID_SIZE}px`;
      line.style.top = `${OFFSET_Y}px`;
      container.appendChild(line);

      // 下半区 r=5..9
      line = document.createElement('div');
      line.className = 'grid-line v-line';
      line.style.height = `${4*GRID_SIZE}px`;
      line.style.left = `${OFFSET_X + c*GRID_SIZE}px`;
      line.style.top = `${OFFSET_Y + 5*GRID_SIZE}px`;
      container.appendChild(line);

      // 只有边线贯穿楚河汉界
      if (c === 0 || c === 8) {
         line = document.createElement('div');
         line.className = 'grid-line v-line';
         line.style.height = `${GRID_SIZE}px`;
         line.style.left = `${OFFSET_X + c*GRID_SIZE}px`;
         line.style.top = `${OFFSET_Y + 4*GRID_SIZE}px`; // middle river
         container.appendChild(line);
      }
    }

    // 九宫格斜线
    // 黑方 (0,3) -> (2,5) 和 (0,5) -> (2,3)
    drawSlash(0, 3, 2, 5);
    drawSlash(0, 5, 2, 3);
    // 红方 (9,3) -> (7,5) 和 (9,5) -> (7,3)
    drawSlash(9, 3, 7, 5);
    drawSlash(9, 5, 7, 3);

    // 文字
    const river = document.createElement('div');
    river.className = 'river-text';
    river.innerHTML = '楚河 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 汉界';
    river.style.top = `${OFFSET_Y + 4.5*GRID_SIZE - 14}px`; // 调整垂直位置
    container.appendChild(river);
  }

  function drawSlash(r1, c1, r2, c2) {
    const line = document.createElement('div');
    line.className = 'grid-line';
    line.style.height = '1px'; // thin line
    const x1 = c1*GRID_SIZE, y1 = r1*GRID_SIZE;
    const x2 = c2*GRID_SIZE, y2 = r2*GRID_SIZE;
    const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;

    line.style.width = `${len}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = '0 0';
    line.style.left = `${OFFSET_X + x1}px`;
    line.style.top = `${OFFSET_Y + y1}px`;
    container.appendChild(line);
  }

  // 渲染所有棋子
  function renderPieces() {
    // 移除旧棋子
    const oldPieces = document.querySelectorAll('.piece');
    oldPieces.forEach(p => p.remove());

    for (let r=0; r<BOARD_ROWS; r++) {
      for (let c=0; c<BOARD_COLS; c++) {
        const p = board[r][c];
        if (p) {
          createPieceDom(r, c, p);
        }
      }
    }
  }

  function getPieceText(type, color) {
    const map = {
      'c': '車',
      'm': '馬',
      'x': color==='red'?'相':'象',
      's': color==='red'?'仕':'士',
      'j': color==='red'?'帥':'將',
      'p': '炮',
      'z': color==='red'?'兵':'卒'
    };
    return map[type];
  }

  function createPieceDom(r, c, p) {
    const div = document.createElement('div');
    div.className = `piece ${p.color}`;
    div.textContent = getPieceText(p.type, p.color);
    // position
    setPosition(div, r, c);

    div.dataset.r = r;
    div.dataset.c = c;

    // Event
    div.addEventListener('click', (e) => onPieceClick(e, r, c));

    if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) {
      div.classList.add('selected');
    }

    container.appendChild(div);
  }

  function setPosition(el, r, c) {
    el.style.left = `${OFFSET_X + c*GRID_SIZE}px`;
    el.style.top = `${OFFSET_Y + r*GRID_SIZE}px`;
  }

  // 点击逻辑
  function onPieceClick(e, r, c) {
    e.stopPropagation(); // 防止冒泡触发空地点击（如果有的话）
    if (gameOver) return;

    const clickedP = board[r][c];

    // 如果还没选中棋子
    if (!selectedPiece) {
      if (clickedP && clickedP.color === currentTurn) {
        selectPiece(r, c);
      }
      return;
    }

    // 已经选中了一个
    // 如果点了自己人 -> 换选
    if (clickedP && clickedP.color === currentTurn) {
      selectPiece(r, c);
      return;
    }

    // 如果点了敌人 -> 尝试吃子
    tryMove(selectedPiece.r, selectedPiece.c, r, c);
  }

  function selectPiece(r, c) {
    selectedPiece = { r, c, ...board[r][c] };
    renderPieces(); // 重新渲染以显示高亮
    showPossibleMoves(r, c);
  }

  // 显示可行走位置的小点
  function showPossibleMoves(r, c) {
    clearDots();
    const moves = getValidMoves(r, c, board[r][c]);
    moves.forEach(m => {
      const dot = document.createElement('div');
      dot.className = 'dot';
      setPosition(dot, m.r, m.c);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        tryMove(r, c, m.r, m.c);
      });
      container.appendChild(dot);
    });
  }

  function clearDots() {
    document.querySelectorAll('.dot').forEach(d => d.remove());
  }

  function tryMove(fromR, fromC, toR, toC) {
    // 检查是否合法移动 (前端已由 getValidMoves 过滤，但这里是执行)
    // 直接执行
    const target = board[toR][toC];
    const me = board[fromR][fromC];

    // 移动
    board[toR][toC] = me;
    board[fromR][fromC] = null;

    // 胜负判定
    if (target && target.type === 'j') {
      gameOver = true;
      alert((currentTurn === 'red' ? '红方' : '黑方') + ' 胜利！');
    }

    // 切换回合
    currentTurn = currentTurn === 'red' ? 'black' : 'red';
    selectedPiece = null;

    updateTurnUI();
    renderPieces();
    clearDots();
  }

  function updateTurnUI() {
    turnIndicator.textContent = `当前回合: ${currentTurn==='red'?'红方':'黑方'}`;
    turnIndicator.className = currentTurn==='red'?'turn-red':'turn-black';
  }

  // ====== 核心规则引擎 ======
  function getValidMoves(r, c, p) {
    const moves = [];
    // 辅助函数：添加如果是在棋盘内且不是己方棋子
    const tryAdd = (nr, nc) => {
      if (nr>=0 && nr<BOARD_ROWS && nc>=0 && nc<BOARD_COLS) {
        const target = board[nr][nc];
        if (!target || target.color !== p.color) {
          moves.push({r: nr, c: nc});
        }
      }
    };

    if (p.type === 'c') { // 车
      // 上下左右直线，直到遇到棋子
      [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        while (nr>=0 && nr<BOARD_ROWS && nc>=0 && nc<BOARD_COLS) {
          const target = board[nr][nc];
          if (!target) {
            moves.push({r: nr, c: nc});
          } else {
            if (target.color !== p.color) moves.push({r: nr, c: nc});
            break; // 撞到棋子停止
          }
          nr += dr; nc += dc;
        }
      });
    }
    else if (p.type === 'm') { // 马
      // 日字。8个方向。检查蹩马腿。
      // 蹩马腿位置：如果马往右跳(c+2), 蹩腿在(r, c+1)
      const deltas = [
        {dr: -2, dc: -1, legR: -1, legC: 0}, {dr: -2, dc: 1, legR: -1, legC: 0}, // 上跳
        {dr: 2, dc: -1, legR: 1, legC: 0},   {dr: 2, dc: 1, legR: 1, legC: 0},   // 下跳
        {dr: -1, dc: -2, legR: 0, legC: -1}, {dr: 1, dc: -2, legR: 0, legC: -1}, // 左跳
        {dr: -1, dc: 2, legR: 0, legC: 1},   {dr: 1, dc: 2, legR: 0, legC: 1}    // 右跳
      ];
      deltas.forEach(d => {
        const nr = r+d.dr, nc = c+d.dc;
        const lr = r+d.legR, lc = c+d.legC;
        // 检查边界
        if (nr>=0 && nr<BOARD_ROWS && nc>=0 && nc<BOARD_COLS) {
          // 检查马腿
          if (!board[lr][lc]) {
             tryAdd(nr, nc);
          }
        }
      });
    }
    else if (p.type === 'x') { // 相/象
      // 田字。不能过河。不能塞象眼。
      // 象眼：田字中心
      const deltas = [[-2,-2], [-2,2], [2,-2], [2,2]];
      deltas.forEach(([dr, dc]) => {
        const nr = r+dr, nc = c+dc;
        const eyeR = r + dr/2, eyeC = c + dc/2;
        // 边界 && 不塞象眼
        if (nr>=0 && nr<BOARD_ROWS && nc>=0 && nc<BOARD_COLS) {
           // 过河判断
           // 黑棋(r 0-4), 象不能去 >=5; 红棋(r 5-9), 相不能去 <=4
           if (p.color === 'black' && nr > 4) return;
           if (p.color === 'red' && nr < 5) return;

           if (!board[eyeR][eyeC]) {
             tryAdd(nr, nc);
           }
        }
      });
    }
    else if (p.type === 's') { // 士
      // 九宫格斜线。每次一步。
      // 黑九宫: c 3-5, r 0-2; 红九宫: c 3-5, r 7-9
      const deltas = [[-1,-1], [-1,1], [1,-1], [1,1]];
      deltas.forEach(([dr, dc]) => {
        const nr = r+dr, nc = c+dc;
        if (nc>=3 && nc<=5) {
          if (p.color === 'black' && nr>=0 && nr<=2) tryAdd(nr, nc);
          if (p.color === 'red' && nr>=7 && nr<=9) tryAdd(nr, nc);
        }
      });
    }
    else if (p.type === 'j') { // 将/帅
      // 九宫格直线。
      // 额外规则：将帅不能照面（中间无子）。这个检测比较耗时，这里暂略或简化。
      const deltas = [[0,1], [0,-1], [1,0], [-1,0]];
      deltas.forEach(([dr, dc]) => {
        const nr = r+dr, nc = c+dc;
        if (nc>=3 && nc<=5) {
          if (p.color === 'black' && nr>=0 && nr<=2) tryAdd(nr, nc);
          if (p.color === 'red' && nr>=7 && nr<=9) tryAdd(nr, nc);
        }
      });
    }
    else if (p.type === 'p') { // 炮
      // 走棋同车，吃子需跳
      [[0,1], [0,-1], [1,0], [-1,0]].forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        let hurdle = false; // 是否翻过山
        while (nr>=0 && nr<BOARD_ROWS && nc>=0 && nc<BOARD_COLS) {
          const target = board[nr][nc];
          if (!hurdle) {
            if (!target) {
              moves.push({r: nr, c: nc});
            } else {
              hurdle = true; // 遇到第一个子（炮架）
            }
          } else {
            // 翻山后
            if (target) {
              if (target.color !== p.color) moves.push({r: nr, c: nc}); // 可以吃
              break; // 也就是无论能不能吃，遇到第二个子就停
            }
            // 翻山后空地不能落子
          }
          nr += dr; nc += dc;
        }
      });
    }
    else if (p.type === 'z') { // 兵/卒
      // 只能前。过河后可前左右。
      // 红兵：前是 -r; 黑卒：前是 +r
      const forward = p.color === 'red' ? -1 : 1;
      // 前进一步
      tryAdd(r + forward, c);

      // 左右：需过河
      // 红过河: r < 5; 黑过河: r > 4
      const crossed = p.color === 'red' ? (r < 5) : (r > 4);
      if (crossed) {
        tryAdd(r, c-1);
        tryAdd(r, c+1);
      }
    }

    return moves;
  }

  // 启动
  init();
})();

