const db = require('./db');

const data = [
  ["Estrada Facundo", "Dr Domingo Guemes 221", "38033012", "1994-01-22", "387683338", "facundoestrada22@gmail.com", "10267", "SALTA - CAPITAL"],
  ["dominguez cristian abel", "angel de rosas 451, autodromo", "34634340", "1991-05-14", "388589789", "cristian79dominguez@gmail.com", "10830", "salta"],
  ["Copa Gisella Elizabeth", "Ohighins 1903", "33233356", "1987-10-27", "387597568", "gisellacopa@hotmail.com", "91540", "Capital Salta"]
];

const insertOrUpdate = db.prepare(`
  INSERT INTO producers (name, address, dni, birthdate, phone, email, matricula, city)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(name) DO UPDATE SET
    address = excluded.address,
    dni = excluded.dni,
    birthdate = excluded.birthdate,
    phone = excluded.phone,
    email = excluded.email,
    matricula = excluded.matricula,
    city = excluded.city
`);

let imported = 0;
for (const row of data) {
  try {
    insertOrUpdate.run(
      row[0].trim(), // name
      row[1].trim(), // address
      row[2].trim(), // dni
      row[3],        // birthdate
      row[4].trim(), // phone
      row[5].trim(), // email
      row[6].trim(), // matricula
      row[7].trim()  // city
    );
    imported++;
  } catch (err) {
    console.error("Error importing", row[0], err.message);
  }
}

console.log(`Successfully imported/updated ${imported} producers.`);
