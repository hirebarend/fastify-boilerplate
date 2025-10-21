export function fromCsvBuffer(buffer: Buffer): Array<Array<string>> {
  const content = buffer.toString();

  const rows: Array<Array<string>> = [];

  let row: Array<string> = [];

  let field = '';

  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];

    const next = content[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\r' && next === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (c === '\n' || c === '\r') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function toCsvBuffer(
  header: Array<any>,
  rows: Array<Array<any>>,
): Buffer {
  const q = '"';
  const qq = q + q;

  const needsQuote = (s: string) =>
    s.includes(',') || s.includes(q) || s.includes('\n') || s.includes('\r');

  const toStringCell = (v: unknown): string => {
    if (v === null || v === undefined) {
      return '';
    }

    if (v instanceof Date) {
      return v.toISOString();
    }

    return String(v);
  };

  const escapeCell = (v: unknown): string => {
    const s = toStringCell(v);

    return needsQuote(s) ? q + s.replaceAll(q, qq) + q : s;
  };

  const lines: Array<string> = [];

  if (header && header.length) {
    lines.push(header.map(escapeCell).join(','));
  }

  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }

  return Buffer.from(lines.join('\r\n'), 'utf-8');
}
