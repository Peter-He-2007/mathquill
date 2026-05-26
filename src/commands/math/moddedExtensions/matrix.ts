class Vector extends DelimsNode {
  ctrlSeq = '\\vect';
  ariaLabel = 'vector';
  textTemplate = ['[', ',', ']'];

  // ── tell MathQuill how many blocks we have ──────────────────────────────
  // instead of reading from DOMView, we read from our actual blocks array
  numBlocks() {
    return this.blocks ? this.blocks.length : 2;
  }

  // ── create the initial blocks manually ──────────────────────────────────
  // normally MathCommand.createBlocks() uses numBlocks() from DOMView
  // we override it to create 2 blocks to start
  createBlocks() {
    this.blocks = [];
    for (var i = 0; i < 2; i++) {
      var block = new MathBlock();
      block.adopt(this, this.getEnd(R), 0);
      this.blocks.push(block);
    }
  }

  // ── build the DOM from scratch ───────────────────────────────────────────
  // instead of DOMView's render function, we build the HTML directly
  // this gets called once when the node is first inserted
  html() {
    var leftSymbol = SVG_SYMBOLS['['];
    var rightSymbol = SVG_SYMBOLS[']'];

    // build a row span for each block
    var rows = this.blocks!.map((block) =>
      h.block('span', { class: 'mq-vector-row' }, block)
    );

    // build the full DOM structure
    var el = h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
      h(
        'span',
        {
          style: 'width:' + leftSymbol.width,
          class: 'mq-paren mq-bracket-l mq-scaled',
        },
        [leftSymbol.html()]
      ),

      h(
        'span',
        {
          style:
            'margin-left:' +
            leftSymbol.width +
            ';margin-right:' +
            rightSymbol.width,
          class: 'mq-non-leaf mq-bracket-middle',
        },
        [h('span', { class: 'mq-array mq-non-leaf' }, rows)]
      ),

      h(
        'span',
        {
          style: 'width:' + rightSymbol.width,
          class: 'mq-paren mq-bracket-r mq-scaled',
        },
        [rightSymbol.html()]
      ),
    ]);

    // link this DOM element back to this node so MathQuill can find it
    this.setDOM(el);
    NodeBase.linkElementByCmdNode(el, this);
    return el;
  }

  // ── add a new row ────────────────────────────────────────────────────────
  // called when user presses Tab on the last row
  addRow(cursor: Cursor, index: number) {
    var newBlock = new MathBlock();
    newBlock.adopt(this, this.blocks![index], this.blocks![index + 1] || 0);
    this.blocks!.splice(index + 1, 0, newBlock);

    // wire up keyboard BEFORE moving cursor into it
    this.wireBlock(newBlock);

    var newRow = h.block('span', { class: 'mq-vector-row' }, newBlock);
    var arrayEl = this.domFrag().oneElement().querySelector('.mq-array');
    var existingRows = arrayEl!.children;
    arrayEl!.insertBefore(newRow, existingRows[index + 1] || null);

    cursor.insAtRightEnd(newBlock);

    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }

  // ── remove a row ─────────────────────────────────────────────────────────
  // called when user presses Backspace on an empty row
  removeRow(block: MathBlock, cursor: Cursor) {
    // don't remove if it's the last row

    var index = this.blocks!.indexOf(block);
    this.blocks!.splice(index, 1);

    // move cursor to the row above, or below if it was the first row
    var targetBlock = this.blocks![Math.max(0, index - 1)];
    cursor.insAtRightEnd(targetBlock);

    // remove from DOM
    block.domFrag().oneElement().remove();

    block.disown();

    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }

  wireBlock(block: MathBlock) {
    var self = this;

    block.keystroke = function (
      key: string,
      e: KeyboardEvent,
      ctrlr: Controller
    ) {
      var cursor = ctrlr.cursor;

      if (key === 'Enter') {
        e.preventDefault();
        // always read index fresh from blocks array
        var currentIndex = self.blocks!.indexOf(block);
        self.addRow(cursor, currentIndex);
        return;
      }

      if (key === 'Backspace' && block.isEmpty()) {
        e.preventDefault();
        var currentIndex = self.blocks!.indexOf(block);
        if (self.blocks!.length <= 1) {
          cursor.insRightOf(self);
          cursor.controller.keystroke('Backspace', e);
        } else {
          self.removeRow(block, cursor);
        }
        return;
      }

      if (key === 'Up') {
        var currentIndex = self.blocks!.indexOf(block);
        if (currentIndex > 0) {
          cursor.insAtRightEnd(self.blocks![currentIndex - 1]);
          return;
        }
      }

      if (key === 'Down') {
        var currentIndex = self.blocks!.indexOf(block);
        if (currentIndex < self.blocks!.length - 1) {
          cursor.insAtRightEnd(self.blocks![currentIndex + 1]);
          return;
        }
      }

      return MathBlock.prototype.keystroke.call(this, key, e, ctrlr);
    };
  }

  latex() {
    var rows: string[] = [];

    for (var i = 0; i < this.blocks!.length; i++) {
      rows.push(this.blocks![i].latex());
    }

    return '\\begin{bmatrix} ' + rows.join(' \\\\ ') + ' \\end{bmatrix}';
  }

  // ── wire up keyboard navigation ──────────────────────────────────────────
  finalizeTree() {
    var self = this;
    this.blocks!.forEach(function (block) {
      self.wireBlock(block);
    });
  }
}

LatexCmds.vect = LatexCmds.vector = Vector;

class Matrix extends Vector {
  ctrlSeq = '\\matrix';
  ariaLabel = 'matrix';
  textTemplate = ['[', ',', ']'];

  cols: number = 2;
  rows: number = 2;

  // ROW-MAJOR: matrixBlocks[row][col]
  matrixBlocks: Array<Array<MathBlock>> = [];

  // ── helpers to get row/col from flat index ──────────────────────────────
  getRowIndex(flatIndex: number): number {
    return Math.floor(flatIndex / this.cols);
  }
  getColIndex(flatIndex: number): number {
    return flatIndex % this.cols;
  }

  syncBlocks(): void {
    var flat: MathBlock[] = [];
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        flat.push(this.matrixBlocks[row][col]);
      }
    }
    this.blocks = flat;
  }

  readoptAll(): void {
    // disown all
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        var b = this.matrixBlocks[row][col];
        if (b.parent === this) b.disown();
      }
    }
    // re-adopt in row-major order
    var prev: MathBlock | 0 = 0;
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        var b = this.matrixBlocks[row][col];
        b.adopt(this, prev, 0);
        prev = b;
      }
    }
  }

  getGridEl(): HTMLElement {
    return this.domFrag()
      .oneElement()
      .querySelector('.mq-matrix-grid') as HTMLElement;
  }

  updateGridColumns(): void {
    this.getGridEl().style.gridTemplateColumns =
      'repeat(' + this.cols + ', auto)';
  }

  // ── createBlocks ─────────────────────────────────────────────────────────
  createBlocks(): void {
    this.matrixBlocks = [];
    this.blocks = [];
    this.cols = 2;
    this.rows = 2;

    for (var row = 0; row < 2; row++) {
      var rowArr: MathBlock[] = [];
      for (var col = 0; col < 2; col++) {
        rowArr.push(new MathBlock());
      }
      this.matrixBlocks.push(rowArr);
    }

    // adopt in row-major order
    var prev: MathBlock | 0 = 0;
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        var b = this.matrixBlocks[row][col];
        b.adopt(this, prev, 0);
        prev = b;
      }
    }

    this.syncBlocks();

    for (var row = 0; row < this.matrixBlocks.length; row++) {
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        this.wireBlock(this.matrixBlocks[row][col]);
      }
    }
  }

  // ── html ──────────────────────────────────────────────────────────────────
  html() {
    var leftSymbol = SVG_SYMBOLS['['];
    var rightSymbol = SVG_SYMBOLS[']'];
    var self = this;

    // build cells in row-major order — matches CSS Grid layout
    var cells: Element[] = [];
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        cells.push(
          h.block(
            'span',
            { class: 'mq-matrix-cell' },
            self.matrixBlocks[row][col]
          )
        );
      }
    }

    var el = h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
      h(
        'span',
        {
          style: 'width:' + leftSymbol.width,
          class: 'mq-paren mq-bracket-l mq-scaled',
        },
        [leftSymbol.html()]
      ),

      h(
        'span',
        {
          style:
            'margin-left:' +
            leftSymbol.width +
            ';margin-right:' +
            rightSymbol.width,
          class: 'mq-non-leaf mq-bracket-middle',
        },
        [
          h(
            'span',
            {
              class: 'mq-matrix-grid',
              style: 'grid-template-columns:repeat(' + this.cols + ',auto)',
            },
            cells
          ),
        ]
      ),

      h(
        'span',
        {
          style: 'width:' + rightSymbol.width,
          class: 'mq-paren mq-bracket-r mq-scaled',
        },
        [rightSymbol.html()]
      ),
    ]);

    this.setDOM(el);
    NodeBase.linkElementByCmdNode(el, this);
    return el;
  }

  // ── wireBlock ─────────────────────────────────────────────────────────────
  wireBlock(block: MathBlock): void {
    var self = this;
    var vectorKeystroke = block.keystroke.bind(block);

    block.keystroke = function (
      key: string,
      e: KeyboardEvent,
      ctrlr: Controller
    ) {
      var cursor = ctrlr.cursor;
      var flatIndex = self.blocks!.indexOf(block);
      var rowIndex = self.getRowIndex(flatIndex);
      var colIndex = self.getColIndex(flatIndex);

      if (key === 'Shift-Enter') {
        e.preventDefault();
        self.addColumn(cursor, colIndex);
        return;
      }
      if (key === 'Shift-Backspace') {
        e.preventDefault();
        self.removeColumn(cursor, colIndex);
        return;
      }
      if (key === 'Ctrl-Enter') {
        e.preventDefault();
        self.addMatrixRow(cursor, rowIndex);
        return;
      }
      if (key === 'Ctrl-Backspace') {
        e.preventDefault();
        self.removeMatrixRow(cursor, rowIndex);
        return;
      }
      if (key === 'Right' && colIndex < self.cols - 1) {
        e.preventDefault();
        cursor.insAtRightEnd(self.matrixBlocks[rowIndex][colIndex + 1]);
        return;
      }
      if (key === 'Left' && colIndex > 0) {
        e.preventDefault();
        cursor.insAtRightEnd(self.matrixBlocks[rowIndex][colIndex - 1]);
        return;
      }
      if (key === 'Down' && rowIndex < self.rows - 1) {
        e.preventDefault();
        cursor.insAtRightEnd(self.matrixBlocks[rowIndex + 1][colIndex]);
        return;
      }
      if (key === 'Up' && rowIndex > 0) {
        e.preventDefault();
        cursor.insAtRightEnd(self.matrixBlocks[rowIndex - 1][colIndex]);
        return;
      }

      return vectorKeystroke(key, e, ctrlr);
    };
  }

  // ── addColumn ─────────────────────────────────────────────────────────────
  addColumn(cursor: Cursor, colIndex: number): void {
    // Step 1 — create new blocks
    var newCol: MathBlock[] = [];
    for (var row = 0; row < this.rows; row++) {
      var b = new MathBlock();
      this.wireBlock(b);
      newCol.push(b);
    }

    // Step 2 — insert into matrixBlocks
    for (var row = 0; row < this.rows; row++) {
      this.matrixBlocks[row].splice(colIndex + 1, 0, newCol[row]);
    }
    this.cols += 1;

    // Step 3 — readopt and sync
    this.readoptAll();
    this.syncBlocks();
    this.updateGridColumns();

    // Step 4 — insert cells into DOM in row-major order (reverse to preserve indices)
    var gridEl = this.getGridEl();
    for (var row = 0; row < this.rows; row++) {
      var insertPos = row * this.cols + (colIndex + 1);
      var newCell = h.block('span', { class: 'mq-matrix-cell' }, newCol[row]);
      gridEl.insertBefore(newCell, gridEl.children[insertPos] || null);
    }

    // Step 5 — move cursor into first cell of new column
    for (var i = newCol.length - 1; i >= 0; i--) {
      cursor.insAtRightEnd(newCol[i]);
    }

    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }

  // ── removeColumn ──────────────────────────────────────────────────────────
  removeColumn(cursor: Cursor, colIndex: number): void {
    if (this.cols <= 1) return;

    // Step 1 — disown blocks in this column
    for (var row = 0; row < this.rows; row++) {
      this.matrixBlocks[row][colIndex].disown();
    }

    // Step 2 — remove cells from DOM in reverse row order (preserve indices)
    var gridEl = this.getGridEl();
    for (var row = this.rows - 1; row >= 0; row--) {
      var removePos = row * this.cols + colIndex;
      gridEl.removeChild(gridEl.children[removePos]);
    }

    // Step 3 — update matrixBlocks
    for (var row = 0; row < this.rows; row++) {
      this.matrixBlocks[row].splice(colIndex, 1);
    }
    this.cols -= 1;

    // Step 4 — sync and update grid
    this.syncBlocks();
    this.updateGridColumns();

    // Step 5 — move cursor
    var targetCol = Math.max(0, colIndex - 1);
    cursor.insAtRightEnd(this.matrixBlocks[0][targetCol]);

    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }

  // ── addMatrixRow ──────────────────────────────────────────────────────────
  addMatrixRow(cursor: Cursor, rowIndex: number): void {
    // Step 1 — create new blocks
    var newRow: MathBlock[] = [];
    for (var col = 0; col < this.cols; col++) {
      var b = new MathBlock();
      this.wireBlock(b);
      newRow.push(b);
    }

    // Step 2 — insert into matrixBlocks
    this.matrixBlocks.splice(rowIndex + 1, 0, newRow);
    this.rows += 1;

    // Step 3 — readopt and sync
    this.readoptAll();
    this.syncBlocks();

    // Step 4 — insert cells into DOM
    var gridEl = this.getGridEl();
    var insertStartPos = (rowIndex + 1) * this.cols;
    for (var col = 0; col < this.cols; col++) {
      var newCell = h.block('span', { class: 'mq-matrix-cell' }, newRow[col]);
      gridEl.insertBefore(
        newCell,
        gridEl.children[insertStartPos + col] || null
      );
    }

    // Step 5 — move cursor into first cell of new row
    for (var i = newRow.length - 1; i >= 0; i--) {
      cursor.insAtRightEnd(newRow[i]);
    }

    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }

  // ── removeMatrixRow ───────────────────────────────────────────────────────
  removeMatrixRow(cursor: Cursor, rowIndex: number): void {
    if (this.rows <= 1) return;

    // Step 1 — disown blocks in this row
    for (var col = 0; col < this.cols; col++) {
      this.matrixBlocks[rowIndex][col].disown();
    }

    // Step 2 — remove cells from DOM
    var gridEl = this.getGridEl();
    var removeStartPos = rowIndex * this.cols;
    for (var col = this.cols - 1; col >= 0; col--) {
      gridEl.removeChild(gridEl.children[removeStartPos + col]);
    }

    // Step 3 — update matrixBlocks
    this.matrixBlocks.splice(rowIndex, 1);
    this.rows -= 1;

    // Step 4 — sync
    this.syncBlocks();

    // Step 5 — move cursor
    var targetRow = Math.max(0, rowIndex - 1);
    cursor.insAtRightEnd(this.matrixBlocks[targetRow][0]);

    this.bubble(function (node) {
      node.reflow();
      return undefined;
    });
  }

  // ── latex ─────────────────────────────────────────────────────────────────
  latex(): string {
    var rows: string[] = [];
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      var cols: string[] = [];
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        cols.push(this.matrixBlocks[row][col].latex());
      }
      rows.push(cols.join(' & '));
    }
    return '\\begin{bmatrix} ' + rows.join(' \\\\ ') + ' \\end{bmatrix}';
  }
}

class Pmatrix extends Matrix {
  html() {
    var leftSymbol = SVG_SYMBOLS['('];
    var rightSymbol = SVG_SYMBOLS[')'];
    var self = this;

    // build cells in row-major order — matches CSS Grid layout
    var cells: Element[] = [];
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        cells.push(
          h.block(
            'span',
            { class: 'mq-matrix-cell' },
            self.matrixBlocks[row][col]
          )
        );
      }
    }

    var el = h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
      h(
        'span',
        {
          style: 'width:' + leftSymbol.width,
          class: 'mq-paren mq-bracket-l mq-scaled',
        },
        [leftSymbol.html()]
      ),

      h(
        'span',
        {
          style:
            'margin-left:' +
            leftSymbol.width +
            ';margin-right:' +
            rightSymbol.width,
          class: 'mq-non-leaf mq-bracket-middle',
        },
        [
          h(
            'span',
            {
              class: 'mq-matrix-grid',
              style: 'grid-template-columns:repeat(' + this.cols + ',auto)',
            },
            cells
          ),
        ]
      ),

      h(
        'span',
        {
          style: 'width:' + rightSymbol.width,
          class: 'mq-paren mq-bracket-r mq-scaled',
        },
        [rightSymbol.html()]
      ),
    ]);

    this.setDOM(el);
    NodeBase.linkElementByCmdNode(el, this);
    return el;
  }

  latex(): string {
    var rows: string[] = [];
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      var cols: string[] = [];
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        cols.push(this.matrixBlocks[row][col].latex());
      }
      rows.push(cols.join(' & '));
    }
    return '\\begin{pmatrix} ' + rows.join(' \\\\ ') + ' \\end{pmatrix}';
  }
}

class Dmatrix extends Matrix {
  html() {
    var leftSymbol = SVG_SYMBOLS['|'];
    var rightSymbol = SVG_SYMBOLS['|'];
    var self = this;

    // build cells in row-major order — matches CSS Grid layout
    var cells: Element[] = [];
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        cells.push(
          h.block(
            'span',
            { class: 'mq-matrix-cell' },
            self.matrixBlocks[row][col]
          )
        );
      }
    }

    var el = h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
      h(
        'span',
        {
          style: 'width:' + leftSymbol.width,
          class: 'mq-paren mq-bracket-l mq-scaled',
        },
        [leftSymbol.html()]
      ),

      h(
        'span',
        {
          style:
            'margin-left:' +
            leftSymbol.width +
            ';margin-right:' +
            rightSymbol.width,
          class: 'mq-non-leaf mq-bracket-middle',
        },
        [
          h(
            'span',
            {
              class: 'mq-matrix-grid',
              style: 'grid-template-columns:repeat(' + this.cols + ',auto)',
            },
            cells
          ),
        ]
      ),

      h(
        'span',
        {
          style: 'width:' + rightSymbol.width,
          class: 'mq-paren mq-bracket-r mq-scaled',
        },
        [rightSymbol.html()]
      ),
    ]);

    this.setDOM(el);
    NodeBase.linkElementByCmdNode(el, this);
    return el;
  }

  latex(): string {
    var rows: string[] = [];
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      var cols: string[] = [];
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        cols.push(this.matrixBlocks[row][col].latex());
      }
      rows.push(cols.join(' & '));
    }
    return '\\begin{dmatrix} ' + rows.join(' \\\\ ') + ' \\end{dmatrix}';
  }
}

class PlainMatrix extends Matrix {
  html() {
    var leftSymbol = SVG_SYMBOLS[' '];
    var rightSymbol = SVG_SYMBOLS[' '];
    var self = this;

    // build cells in row-major order — matches CSS Grid layout
    var cells: Element[] = [];
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        cells.push(
          h.block(
            'span',
            { class: 'mq-matrix-cell' },
            self.matrixBlocks[row][col]
          )
        );
      }
    }

    var el = h('span', { class: 'mq-non-leaf mq-bracket-container' }, [
      h(
        'span',
        {
          style: 'width:' + leftSymbol.width,
          class: 'mq-paren mq-bracket-l mq-scaled',
        },
        [leftSymbol.html()]
      ),

      h(
        'span',
        {
          style:
            'margin-left:' +
            leftSymbol.width +
            ';margin-right:' +
            rightSymbol.width,
          class: 'mq-non-leaf mq-bracket-middle',
        },
        [
          h(
            'span',
            {
              class: 'mq-matrix-grid',
              style: 'grid-template-columns:repeat(' + this.cols + ',auto)',
            },
            cells
          ),
        ]
      ),

      h(
        'span',
        {
          style: 'width:' + rightSymbol.width,
          class: 'mq-paren mq-bracket-r mq-scaled',
        },
        [rightSymbol.html()]
      ),
    ]);

    this.setDOM(el);
    NodeBase.linkElementByCmdNode(el, this);
    return el;
  }

  latex(): string {
    var rows: string[] = [];
    for (var row = 0; row < this.matrixBlocks.length; row++) {
      var cols: string[] = [];
      for (var col = 0; col < this.matrixBlocks[row].length; col++) {
        cols.push(this.matrixBlocks[row][col].latex());
      }
      rows.push(cols.join(' & '));
    }
    return '\\begin{dmatrix} ' + rows.join(' \\\\ ') + ' \\end{dmatrix}';
  }
}

LatexCmds.matrix = LatexCmds.mat = Matrix;
LatexCmds.bmatrix = LatexCmds.bmat = Matrix;
LatexCmds.pmatrix = LatexCmds.pmat = Pmatrix;
LatexCmds.matrixplain = PlainMatrix;
LatexCmds.dmatrix =
  LatexCmds.dmat =
  LatexCmds.determinatematrix =
  LatexCmds.vmat =
  LatexCmds.vmatrix =
    Dmatrix;
