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

LatexCmds['∳'] =
  LatexCmds.oint =
  LatexCmds.contourintegral =
    () => new IntegralNotation('\\oint ', U_OINT, 'contour integral');

LatexCmds['∬'] = LatexCmds.iint = () =>
  new IntegralNotation('\\iint ', U_IINT, 'double integral');

LatexCmds['∭'] = LatexCmds.iiint = () =>
  new IntegralNotation('\\iiint ', U_IIINT, 'triple integral');
