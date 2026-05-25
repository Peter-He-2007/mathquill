// traversal.ts

function traverseForward(cursor: Cursor, e: KeyboardEvent | undefined): void {
  e?.preventDefault();

  var nextCmd: MQNode | 0 = cursor[R];
  while (nextCmd && !(nextCmd instanceof MathCommand)) {
    nextCmd = nextCmd[R];
  }

  var currentBlock = cursor.parent;
  var nextBlock: MQNode | 0 = currentBlock[R];
  while (nextBlock && !(nextBlock instanceof MathBlock)) {
    nextBlock = nextBlock[R];
  }

  if (!nextCmd && !nextBlock) {
    var parentCmd = currentBlock.parent;
    if (parentCmd) {
      cursor.insRightOf(parentCmd);
    }
  } else if (!nextCmd) {
    cursor.insAtLeftEnd(nextBlock as MathBlock);
  } else {
    var firstBlock = (nextCmd as MathCommand).getEnd(L);
    if (firstBlock) {
      cursor.insAtLeftEnd(firstBlock as MathBlock);
    } else {
      cursor.insRightOf(nextCmd as MQNode);
    }
  }
}

function traverseBackward(cursor: Cursor, e: KeyboardEvent | undefined): void {
  e?.preventDefault();

  var prevCmd: MQNode | 0 = cursor[L];
  while (prevCmd && !(prevCmd instanceof MathCommand)) {
    prevCmd = prevCmd[L];
  }

  var currentBlock = cursor.parent;
  var prevBlock: MQNode | 0 = currentBlock[L];
  while (prevBlock && !(prevBlock instanceof MathBlock)) {
    prevBlock = prevBlock[L];
  }

  if (!prevCmd && !prevBlock) {
    var parentCmd = currentBlock.parent;
    if (parentCmd) {
      cursor.insLeftOf(parentCmd);
    }
  } else if (!prevCmd) {
    cursor.insAtRightEnd(prevBlock as MathBlock);
  } else {
    var lastBlock = (prevCmd as MathCommand).getEnd(R);
    if (lastBlock) {
      cursor.insAtRightEnd(lastBlock as MathBlock);
    } else {
      cursor.insLeftOf(prevCmd as MQNode);
    }
  }
}

function handleEmptyBlockBackspace(
  cursor: Cursor,
  e: KeyboardEvent | undefined
): boolean {
  var currentBlock = cursor.parent;
  var prevBlock: MQNode | 0 = currentBlock[L];

  if (
    prevBlock instanceof MathBlock &&
    currentBlock.isEmpty() &&
    !(currentBlock.parent instanceof SupSub)
  ) {
    e?.preventDefault();
    cursor.insAtRightEnd(prevBlock as MathBlock);
    return true; // handled
  }
  return false; // not handled, fall through
}
