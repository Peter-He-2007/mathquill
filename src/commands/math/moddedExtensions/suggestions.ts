var selectedSuggestionIndex: number = -1;

const HIDDEN_SUGGESTIONS: Set<string> = new Set([
  'left',
  'right',
  'f',
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
