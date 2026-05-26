class LimitNotation extends MathCommand {
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
  /*
  mathspeak() {
    return (
      'Start ' +
      this.ariaLabel +
      ' from ' +
      this.getEnd(L).mathspeak() +
      ' to ' +
      this.getEnd(R).mathspeak() +
      ', end ' +
      this.ariaLabel +
      ', '
    );
  }
  */
  parser() {
    var string = Parser.string;
    var optWhitespace = Parser.optWhitespace;
    var succeed = Parser.succeed;
    var block = latexMathParser.block;

    var self = this;
    var blocks = (self.blocks = [new MathBlock(), new MathBlock()]);
    for (var i = 0; i < blocks.length; i += 1) {
      blocks[i].adopt(self, self.getEnd(R), 0);
    }

    return optWhitespace
      .then(string('_').or(string('^')))
      .then(function (supOrSub) {
        var child = blocks[supOrSub === '_' ? 0 : 1];
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
    var endsR = this.getEnd(R);

    endsL.ariaLabel = 'lower bound';
    endsR.ariaLabel = 'upper bound';
    this.downInto = endsL;
    this.upInto = endsR;
    endsL.upOutOf = endsR;
    endsR.downOutOf = endsL;
  }
}

LatexCmds.lim = LatexCmds.limit = () =>
  new LimitNotation('\\lim ', 'lim', 'limit');

LatexCmds.limsup = () =>
  new LimitNotation('\\limsup ', 'limsup', 'limit superior');

LatexCmds.liminf = () =>
  new LimitNotation('\\liminf ', 'liminf', 'limit inferior');

LatexCmds.max = () => new LimitNotation('\\max ', 'max', 'maximum');

LatexCmds.min = () => new LimitNotation('\\min ', 'min', 'minimum');

LatexCmds.sup = () => new LimitNotation('\\sup ', 'sup', 'supremum');

LatexCmds.inf = () => new LimitNotation('\\inf ', 'inf', 'infimum');

LatexCmds.Pr = () => new LimitNotation('\\Pr ', 'Pr', 'probability');

LatexCmds.det = () => new LimitNotation('\\det ', 'det', 'determinant');

class ArgNotation extends LimitNotation {
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
