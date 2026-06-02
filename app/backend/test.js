const db = require('better-sqlite3')('database.sqlite');
try {
  console.log('Testing birthdays:');
  const bdays = db.prepare("SELECT * FROM producers WHERE strftime('%d-%m', substr(birthdate, 1, 10)) = strftime('%d-%m', 'now')").all();
  console.log(bdays);
} catch(e) { console.error('BDAYS ERROR', e); }

try {
  console.log('Testing reports:');
  const reports = db.prepare("SELECT c.name as company_name, sum(col.amount) as total FROM collections col JOIN companies c ON col.company_id = c.id GROUP BY c.id").all();
  console.log(reports);
} catch(e) { console.error('REPORTS ERROR', e); }
