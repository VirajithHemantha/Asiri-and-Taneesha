const SPREADSHEET_ID = '18jXSMaRp2u2fWImHvis6Ja2DcF410GxXjvTHrA_WYeE';

const SHEETS = {
  RSVP: {
    name: 'RSVP',
    headers: ['Timestamp', 'Full Name', 'Number of Guests', 'Dietary Notes'],
    widths: [170, 240, 150, 360],
  },
  WISH: {
    name: 'Wishes',
    headers: ['Timestamp', 'Name', 'Message'],
    widths: [170, 220, 520],
  },
};

const MAX_WISHES_RETURNED = 100;

/**
 * Run this once from the Apps Script editor (Run > setup).
 * It grants permissions and creates both sheets with their headers.
 */
function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateSheet_(ss, SHEETS.RSVP);
  getOrCreateSheet_(ss, SHEETS.WISH);
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    const payload = parsePayload_(e);
    const config = SHEETS[String(payload.sheet || '').toUpperCase()];

    if (!config) {
      return jsonResponse_({ ok: false, error: 'Invalid sheet. Use RSVP or WISH.' });
    }

    lock.waitLock(20000);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet_(ss, config);

    if (config === SHEETS.RSVP) {
      const fullName = clean_(payload.fullName || payload.name);
      if (!fullName) {
        return jsonResponse_({ ok: false, error: 'Full name is required.' });
      }

      sheet.appendRow([
        new Date(),
        fullName,
        clean_(payload.guests),
        clean_(payload.dietaryNotes),
      ]);
    } else {
      const name = clean_(payload.name);
      const message = clean_(payload.message);
      if (!name || !message) {
        return jsonResponse_({ ok: false, error: 'Name and message are required.' });
      }

      sheet.appendRow([new Date(), name, message]);
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_error) {
      // Lock was never acquired.
    }
  }
}

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();

    if (action === 'wishes') {
      return jsonResponse_({ ok: true, wishes: readWishes_() });
    }

    return jsonResponse_({
      ok: true,
      message: 'Wedding form endpoint is running.',
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}

function readWishes_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet_(ss, SHEETS.WISH);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const count = Math.min(lastRow - 1, MAX_WISHES_RETURNED);
  const rows = sheet.getRange(lastRow - count + 1, 1, count, 3).getValues();
  const wishes = [];

  // Newest first.
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const name = unquote_(row[1]);
    const message = unquote_(row[2]);
    if (!name && !message) continue;

    wishes.push({
      id: String(lastRow - count + 1 + i),
      name: name,
      message: message,
      createdAt: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
    });
  }

  return wishes;
}

function parsePayload_(e) {
  const contents = e && e.postData && e.postData.contents ? e.postData.contents : '';

  if (contents && contents.charAt(0) === '{') {
    try {
      return JSON.parse(contents);
    } catch (_error) {
      return {};
    }
  }

  return e && e.parameter ? e.parameter : {};
}

function getOrCreateSheet_(ss, config) {
  let sheet = ss.getSheetByName(config.name);
  if (!sheet) {
    sheet = ss.insertSheet(config.name);
  }

  if (sheet.getLastRow() === 0) {
    const headerRange = sheet.getRange(1, 1, 1, config.headers.length);
    headerRange
      .setValues([config.headers])
      .setFontWeight('bold')
      .setFontColor('#ffffff')
      .setBackground('#5c4a3d')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 34);
    sheet.getRange(1, 1, sheet.getMaxRows(), 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, config.headers.length).setWrap(true).setVerticalAlignment('top');

    for (let i = 0; i < config.widths.length; i++) {
      sheet.setColumnWidth(i + 1, config.widths[i]);
    }
  }

  return sheet;
}

// Trims the value and stops guest text from being run as a spreadsheet formula.
function clean_(value) {
  const text = String(value === undefined || value === null ? '' : value).trim().slice(0, 2000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function unquote_(value) {
  return String(value === undefined || value === null ? '' : value).replace(/^'/, '');
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
