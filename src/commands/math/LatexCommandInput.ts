// ─── SUGGESTION DROPDOWN ─────────────────────────────────────────────────────
/*
var selectedSuggestionIndex: number = -1;

const HIDDEN_SUGGESTIONS: Set<string> = new Set([
  'left',
  'right',
  // add more here as needed
]);

const BLOCKED_COMMANDS: Set<string> = new Set(['left', 'right']);

function getSuggestions(partial: string): string[] {
  if (!partial) return [];
  var allCommands: string[] = Object.keys(LatexCmds);
  return allCommands
    .filter(function (cmd: string) {
      return cmd.indexOf(partial) === 0 && !HIDDEN_SUGGESTIONS.has(cmd);
    })
    .slice(0, 7);
}

function createDropdown(): HTMLElement {
  var el = document.createElement('div');
  el.id = 'mq-suggestions';
  el.style.cssText = [
    'position:absolute',
    'background:white',
    'border:1px solid #ccc',
    'border-radius:4px',
    'box-shadow:0 2px 8px rgba(0,0,0,0.15)',
    'z-index:9999',
    'max-height:200px',
    'overflow-y:auto',
    'font-family:monospace',
    'font-size:14px',
    'min-width:160px',
  ].join(';');
  document.body.appendChild(el);
  return el;
}

function getDropdown(): HTMLElement {
  return (
    (document.getElementById('mq-suggestions') as HTMLElement) ||
    createDropdown()
  );
}

function hideSuggestions(): void {
  var el = document.getElementById('mq-suggestions');
  if (el) el.remove();
  selectedSuggestionIndex = -1;
}

function updateSuggestionHighlight(): void {
  var dropdown = document.getElementById('mq-suggestions');
  if (!dropdown) return;
  var items = dropdown.children;
  for (var i = 0; i < items.length; i++) {
    (items[i] as HTMLElement).style.background =
      i === selectedSuggestionIndex ? '#e8f0fe' : 'white';
  }
}

function moveSuggestionDown(): void {
  var dropdown = document.getElementById('mq-suggestions');
  if (!dropdown) return;
  var count = dropdown.children.length;
  selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, count - 1);
  updateSuggestionHighlight();
}

function moveSuggestionUp(): void {
  var dropdown = document.getElementById('mq-suggestions');
  if (!dropdown) return;
  selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
  updateSuggestionHighlight();
}

function getSelectedSuggestion(): string | null {
  var dropdown = document.getElementById('mq-suggestions');
  if (!dropdown || selectedSuggestionIndex < 0) return null;
  var item = dropdown.children[selectedSuggestionIndex] as HTMLElement;
  return item ? item.getAttribute('data-cmd') : null;
}

function showSuggestions(
  partial: string,
  cursor: Cursor,
  onSelect: (cmd: string) => void
): void {
  var suggestions = getSuggestions(partial);
  selectedSuggestionIndex = -1;

  if (suggestions.length === 0) {
    hideSuggestions();
    return;
  }

  var cursorEl = cursor.domFrag().oneElement();
  var rect = cursorEl.getBoundingClientRect();

  var dropdown = getDropdown();
  dropdown.innerHTML = '';

  suggestions.forEach(function (cmd: string, i: number) {
    var item = document.createElement('div');
    item.setAttribute('data-cmd', cmd);
    item.style.cssText = [
      'padding:6px 12px',
      'cursor:pointer',
      'color:#333',
      'border-bottom:1px solid #f0f0f0',
      'display:flex',
      'gap:8px',
      'align-items:center',
    ].join(';');

    // number badge
    var badge = document.createElement('span');
    badge.textContent = String(i + 1);
    badge.style.cssText = [
      'color:#999',
      'font-size:11px',
      'min-width:12px',
    ].join(';');

    var label = document.createElement('span');
    label.textContent = '\\' + cmd;

    item.appendChild(badge);
    item.appendChild(label);

    item.addEventListener('mouseover', function (): void {
      selectedSuggestionIndex = i;
      updateSuggestionHighlight();
    });

    item.addEventListener('mousedown', function (e: MouseEvent): void {
      e.preventDefault();
      onSelect(cmd);
    });

    dropdown.appendChild(item);
  });

  dropdown.style.left = rect.left + window.scrollX + 'px';
  dropdown.style.top = rect.bottom + window.scrollY + 4 + 'px';
}
//*/
// ─── LATEX COMMAND INPUT ─────────────────────────────────────────────────────

CharCmds['\\'] = class LatexCommandInput extends MathCommand {
  ctrlSeq = '\\';
  _replacedFragment?: Fragment;

  replaces(replacedFragment: Fragment): void {
    this._replacedFragment = replacedFragment.disown();
    this.isEmpty = function (): boolean {
      return false;
    };
  }

  domView = new DOMView(1, (blocks: MathBlock[]) =>
    h('span', { class: 'mq-latex-command-input-wrapper mq-non-leaf' }, [
      h('span', { class: 'mq-latex-command-input mq-non-leaf' }, [
        h.text('\\'),
        h.block('span', {}, blocks[0]),
      ]),
    ])
  );

  textTemplate = ['\\'];

  createBlocks(): void {
    super.createBlocks();
    const endsL = this.getEnd(L);

    endsL.focus = function () {
      this.parent.domFrag().addClass('mq-hasCursor');
      if (this.isEmpty()) this.parent.domFrag().removeClass('mq-empty');
      return this;
    };

    endsL.blur = function () {
      this.parent.domFrag().removeClass('mq-hasCursor');
      if (this.isEmpty()) this.parent.domFrag().addClass('mq-empty');
      hideSuggestions();
      return this;
    };

    endsL.write = function (cursor: Cursor, ch: string): void {
      cursor.show().deleteSelection();

      if (ch.match(/[a-z]/i)) {
        new VanillaSymbol(ch).createLeftOf(cursor);
        cursor.controller.aria.alert(ch);

        var typed: string = (this.parent as LatexCommandInput)
          .getEnd(L)
          .latex();
        var self = this;
        showSuggestions(typed, cursor, function (cmd: string): void {
          (self.parent as LatexCommandInput).renderCommand(cursor, cmd);
        });
      } else {
        hideSuggestions();
        var cmd = (this.parent as LatexCommandInput).renderCommand(cursor);
        cursor.controller.aria.queue(cmd.mathspeak({ createdLeftOf: cursor }));
        if (ch !== '\\' || !this.isEmpty()) {
          cursor.parent.write(cursor, ch);
        } else {
          cursor.controller.aria.alert();
        }
      }
    };

    var originalKeystroke = endsL.keystroke;
    endsL.keystroke = function (
      key: string,
      e: KeyboardEvent | undefined,
      ctrlr: Controller
    ): void {
      var latexCommandInput = this.parent as LatexCommandInput;

      if (key === 'Down' || key === 'Tab') {
        if (handleSuggestionDown(e)) return;
      }

      if (key === 'Up' || key === 'Shift-Tab') {
        if (handleSuggestionUp(e)) return;
      }

      if (key === 'Escape') {
        handleSuggestionEscape();
        return;
      }

      if (key === 'Backspace') {
        handleSuggestionBackspace(latexCommandInput, ctrlr);
        // fall through to default backspace handling
      }

      if (key === 'Enter' || key === 'Spacebar') {
        if (handleSuggestionConfirm(latexCommandInput, ctrlr, e)) return;
      }

      if (handleSuggestionNumberKey(key, latexCommandInput, ctrlr, e)) return;

      return originalKeystroke.call(this, key, e, ctrlr);
    };
  }

  createLeftOf(cursor: Cursor): void {
    super.createLeftOf(cursor);

    if (this._replacedFragment) {
      const frag = this.domFrag();
      const el = frag.oneElement();
      this._replacedFragment.domFrag().addClass('mq-blur');

      const rewriteMousedownEventTarget = (e: MouseEvent): false => {
        (e as any).target = el;
        el.dispatchEvent(e);
        return false;
      };

      el.addEventListener('mousedown', rewriteMousedownEventTarget);
      el.addEventListener('mouseup', rewriteMousedownEventTarget);

      this._replacedFragment.domFrag().insertBefore(frag.children().first());
    }
  }

  latex(): string {
    return '\\' + this.getEnd(L).latex() + ' ';
  }

  renderCommand(cursor: Cursor, selectedCmd?: string): MQNode {
    this.setDOM(this.domFrag().children().lastElement());
    this.remove();

    if (this[R]) {
      cursor.insLeftOf(this[R] as MQNode);
    } else {
      cursor.insAtRightEnd(this.parent);
    }

    var latex: string = selectedCmd || this.getEnd(L).latex();
    if (!latex) latex = ' ';
    var cmd = LatexCmds[latex];

    // MOD START !!!
    if (BLOCKED_COMMANDS.has(latex)) {
      const node = new TextBlock();
      node.replaces(latex);
      node.createLeftOf(cursor);
      cursor.insRightOf(node);
      if (this._replacedFragment) {
        this._replacedFragment.remove();
      }
      return node;
    }
    // MOD END !!!

    if (cmd) {
      var node: MQNode;
      if (isMQNodeClass(cmd)) {
        node = new (cmd as typeof TempSingleCharNode)(latex);
      } else {
        node = cmd(latex);
      }
      if (this._replacedFragment) {
        (node as MathCommand).replaces(this._replacedFragment);
      }
      node.createLeftOf(cursor);
      return node;
    } else {
      const node = new TextBlock();
      node.replaces(latex);
      node.createLeftOf(cursor);
      cursor.insRightOf(node);
      if (this._replacedFragment) {
        this._replacedFragment.remove();
      }
      return node;
    }
  }
  // MODDED START !!!
  remove() {
    hideSuggestions();
    return super.remove();
  }
  // MODDED END !!!
};
