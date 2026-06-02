const db = require('./db');
const rows = db.prepare("SELECT * FROM producers WHERE name LIKE '%ESPINOZA%' OR name LIKE '%FERREIRA%'").all();
console.log(JSON.stringify(rows, null, 2));
