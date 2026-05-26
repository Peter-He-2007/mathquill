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
    () => new LargeMQSymbol('\\oint ', U_OINT);
