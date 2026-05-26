LatexCmds.oint = bindVanillaSymbol('\\oint ', '&#8750;', 'o int');

LatexCmds['∳'] = LatexCmds.oint = () =>
  new SummationNotation('\\oint ', U_OINT, 'o int'); // TODO: design special class for \oint ...
