function preprocessLatex(latex: string): string {
  // match \begin{envname}...\end{envname}
  // handles bmatrix, pmatrix, vmatrix, matrix
  var matrixRegex =
    /\\begin\{(bmatrix|pmatrix|vmatrix|matrix)\}([\s\S]*?)\\end\{\1\}/g;

  return latex.replace(
    matrixRegex,
    function (_match: string, envType: string, content: string): string {
      // split into rows by \\
      var rows: string[][] = content
        .trim()
        .split(/\\\\/)
        .map(function (row: string): string[] {
          // split each row into cells by &
          return row
            .trim()
            .split('&')
            .map(function (cell: string): string {
              return cell.trim();
            });
        });

      // filter out empty rows (can happen with trailing \\)
      rows = rows.filter(function (row: string[]): boolean {
        return !(row.length === 1 && row[0] === '');
      });

      var rowCount: number = rows.length;
      var colCount: number = rows[0].length;

      // determine which command to use based on environment type
      var cmd: string = '\\' + envType;

      // build the cell blocks as {cell1}{cell2}...
      var cellsLatex: string = rows
        .map(function (row: string[]): string {
          return row
            .map(function (cell: string): string {
              return '{' + cell + '}';
            })
            .join('');
        })
        .join('');

      // output as \bmatrix{rowCount}{colCount}{cell1}{cell2}...
      return cmd + '{' + rowCount + '}{' + colCount + '}' + cellsLatex;
    }
  );
}
