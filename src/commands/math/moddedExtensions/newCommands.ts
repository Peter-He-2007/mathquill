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
