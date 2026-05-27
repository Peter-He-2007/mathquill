class LargeMQSymbol extends MQSymbol {
  constructor(ch: string, symbol: string) {
    super(
      ch,
      h('span', { class: 'mq-int mq-non-leaf' }, [
        h('big', {}, [h.text(symbol)]),
      ]),
      'integral'
    );
  }
}

// Integrals:

LatexCmds['∳'] =
  LatexCmds.oint =
  LatexCmds.contourintegral =
    () => new IntegralNotation('\\oint ', U_OINT, 'contour integral');

LatexCmds['∬'] = LatexCmds.iint = () =>
  new IntegralNotation('\\iint ', U_IINT, 'double integral');

LatexCmds['∭'] = LatexCmds.iiint = () =>
  new IntegralNotation('\\iiint ', U_IIINT, 'triple integral');

// New Big Operators:

LatexCmds.bigcap = () =>
  new SummationNotation('\\bigcap ', '\u22C2', 'big intersection');

LatexCmds.bigcup = () =>
  new SummationNotation('\\bigcup ', '\u22C3', 'big union');

LatexCmds.bigsqcup = () =>
  new SummationNotation('\\bigsqcup ', '\u2A06', 'big square union');

LatexCmds.bigvee = () =>
  new SummationNotation('\\bigvee ', '\u22C1', 'big disjunction');

LatexCmds.bigwedge = () =>
  new SummationNotation('\\bigwedge ', '\u22C0', 'big conjunction');

LatexCmds.bigodot = () =>
  new SummationNotation('\\bigodot ', '\u2A00', 'big circle dot');

LatexCmds.bigotimes = () =>
  new SummationNotation('\\bigotimes ', '\u2A02', 'big circle times');

LatexCmds.bigoplus = () =>
  new SummationNotation('\\bigoplus ', '\u2A01', 'big circle plus');

LatexCmds.biguplus = () =>
  new SummationNotation('\\biguplus ', '\u2A04', 'big union plus');

// Seperate Big Operators with special latex

class BigOperatorNotation extends SummationNotation {
  operatorName: string;

  constructor(
    ctrlSeq: string,
    symbol: string,
    operatorName: string,
    ariaLabel: string
  ) {
    super(ctrlSeq, symbol, ariaLabel);
    this.operatorName = operatorName;
  }

  latex(): string {
    function simplify(latex: string) {
      return '{' + (latex || ' ') + '}';
    }
    return (
      '\\operatorname{' +
      this.operatorName +
      '}' +
      '_' +
      simplify(this.getEnd(L).latex()) +
      '^' +
      simplify(this.getEnd(R).latex())
    );
  }
}

LatexCmds.bigsqcap = () =>
  new BigOperatorNotation(
    '\\bigsqcap ',
    '\u2A05',
    'bigsqcap',
    'big square intersection'
  );

LatexCmds.bigcupdot = () =>
  new BigOperatorNotation(
    '\\bigcupdot ',
    '\u2A03',
    'bigcupdot',
    'big union dot'
  );

LatexCmds.bigtimes = () =>
  new BigOperatorNotation('\\bigtimes ', '\u2A09', 'bigtimes', 'big times');

LatexCmds.biginterleave = () =>
  new BigOperatorNotation(
    '\\biginterleave ',
    '\u2AFC',
    'biginterleave',
    'big interleave'
  );
