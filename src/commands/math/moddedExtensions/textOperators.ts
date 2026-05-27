class TextOperator extends MathCommand {
  constructor(ch: string, symbol: string, ariaLabel?: string) {
    super();

    this.ariaLabel = ariaLabel || ch.replace(/^\\/, '');
    var domView = new DOMView(1, (blocks) =>
      h('span', { class: 'mq-lim-operator mq-non-leaf' }, [
        h('big', { class: 'mq-lim-symbol' }, [h.text(symbol)]),
        h('span', { class: 'mq-from' }, [h.block('span', {}, blocks[0])]),
      ])
    );

    MQSymbol.prototype.setCtrlSeqHtmlTextAndMathspeak.call(this, ch, domView);
  }

  createLeftOf(cursor: Cursor) {
    super.createLeftOf(cursor);
    if (cursor.options.sumStartsWithNEquals) {
      new Letter('n').createLeftOf(cursor);
      new Equality().createLeftOf(cursor);
    }
  }
  latex() {
    function simplify(latex: string) {
      return '{' + (latex || ' ') + '}';
    }
    return this.ctrlSeq + '_' + simplify(this.getEnd(L).latex());
  }

  parser() {
    var string = Parser.string;
    var optWhitespace = Parser.optWhitespace;
    var succeed = Parser.succeed;
    var block = latexMathParser.block;

    var self = this;
    // only ONE block — matching DOMView(1, ...)
    var blocks = (self.blocks = [new MathBlock()]);
    blocks[0].adopt(self, self.getEnd(R), 0);

    return optWhitespace
      .then(string('_')) // only parse _, not ^ since there's no upper bound
      .then(function (_) {
        var child = blocks[0];
        return block.then(function (block) {
          block.children().adopt(child, child.getEnd(R), 0);
          return succeed(self);
        });
      })
      .many()
      .result(self);
  }
  finalizeTree() {
    var endsL = this.getEnd(L);
    endsL.ariaLabel = 'lower bound';
    this.downInto = endsL;
    // no upInto since there's no upper bound block
  }
}

LatexCmds.lim = LatexCmds.limit = () =>
  new TextOperator('\\lim ', 'lim', 'limit');

LatexCmds.limsup = () =>
  new TextOperator('\\limsup ', 'limsup', 'limit superior');

LatexCmds.liminf = () =>
  new TextOperator('\\liminf ', 'liminf', 'limit inferior');

LatexCmds.max = () => new TextOperator('\\max ', 'max', 'maximum');

LatexCmds.min = () => new TextOperator('\\min ', 'min', 'minimum');

LatexCmds.sup = () => new TextOperator('\\sup ', 'sup', 'supremum');

LatexCmds.inf = () => new TextOperator('\\inf ', 'inf', 'infimum');

LatexCmds.Pr = () => new TextOperator('\\Pr ', 'Pr', 'probability');

LatexCmds.det = () => new TextOperator('\\det ', 'det', 'determinant');

class ArgNotation extends TextOperator {
  latex(): string {
    function simplify(latex: string) {
      return '{' + (latex || ' ') + '}';
    }
    return (
      '\\operatorname{' +
      this.ctrlSeq!.trim().replace(/^\\/, '') +
      '}' +
      '_' +
      simplify(this.getEnd(L).latex())
    );
  }
}

LatexCmds.argmax = () =>
  new ArgNotation('\\argmax ', 'argmax', 'argument maximum');
LatexCmds.argmin = () =>
  new ArgNotation('\\argmin ', 'argmin', 'argument minimum');
