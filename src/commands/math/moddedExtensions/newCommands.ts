LatexCmds.lfloor = () =>
  new Bracket(L, '&lfloor;', '&rfloor;', '\\lfloor ', '\\rfloor ');
LatexCmds.rfloor = () =>
  new Bracket(R, '&lfloor;', '&rfloor;', '\\lfloor ', '\\rfloor ');
LatexCmds.lceil = () =>
  new Bracket(L, '&lceil', '&rceil', '\\lceil ', '\\rceil ');
LatexCmds.rceil = () =>
  new Bracket(R, '&lceil', '&rceil', '\\lceil ', '\\rceil ');

LatexCmds.lvert = () => new Bracket(L, '|', '|', '\\lvert ', '\\rvert ');
LatexCmds.rvert = () => new Bracket(R, '|', '|', '\\lvert ', '\\rvert ');

function bindCharWithSpace(ch: string, latexCmd: string, display: string) {
  return class extends MQSymbol {
    constructor() {
      super(ch, h('span', {}, [h.text(display)]), display);
    }

    createLeftOf(cursor: Cursor) {
      super.createLeftOf(cursor);
      new VanillaSymbol(
        '\\ ',
        h('span', {}, [h.text('\u00A0')]),
        ' '
      ).createLeftOf(cursor);
    }

    latex(): string {
      return latexCmd;
    }
  };
}

CharCmds[','] = bindCharWithSpace(',', ',', ',');
CharCmds[':'] = bindCharWithSpace(':', ':', ':');
CharCmds[';'] = bindCharWithSpace(';', ';', ';');
CharCmds['.'] = bindCharWithSpace('.', '.', '.');
