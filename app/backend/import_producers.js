const db = require('./db');

const data = [
  ["Drusian, Ignacio", "Av Sarmiento 794", "34244346", "1989-10-07", "3874464222", "Ignacio.productorasesor@gmail.com", "85381"],
  ["Juárez, Hugo", "Parque gral Belgrano MZ 11 casa 40 etapa 6", "34184504", "1989-09-05", "3874571763", "Hjseguros@hotmail.com", "77823"],
  ["Lopéz, Braulio Fabián", "Salta 855 (Braulio Fabián López)", "29546475", "1982-09-21", "3885173332", "delmilagro314@gmail.com", "75997"],
  ["Ballesteros Barros Luis Ignacio", "B° Santa Rita II manzana 7 Lote 2", "35478127", "1991-02-22", "3874643013", "nacho_9122@hotmail.com", "79441"],
  ["Nallim Ricardo Antonio", "Tucuman 1216", "22685105", "1972-08-06", "3874827477", "ricardonallimpas@gmail.com", "106085"],
  ["Chuchuy Marcelo Gerardo", "Avda. Bicentenario de la Batalla de Salta 349", "20125117", "1978-01-21", "3875701645", "mgchseguros@gmail.com", "102155"],
  ["Ferreira Jorge Antonio", "Avda 9 de Julio 881", "21323189", "1970-04-02", "3888402443", "ferreirapas@hotmail.com", "70690"],
  ["Barrionuevo Cynthia", "San Rafael 345 el carril", "34066317", "1989-07-21", "3876100849", "alessandrabarrionuevo@gmail.com", "88234"],
  ["CASANOVA, CARLOS MOISES", "LUIS BURELLA 8 - EL CARRIL, SALTA", "30638042", "1984-06-26", "3874020718", "casanovaseguros.productor@gmail.com", "104956"],
  ["ENRIQUE EZEQUIEL CLEMENTE", "B SAN PABLO SUR- MZA 400A CASA 4", "27455446", "1979-07-29", "3875184917", "ezequiel.clemente@hotmail.com", "79470"],
  ["Zalazar Alejandro Daniel", "Mar jonico 1371", "21633533", "1970-10-26", "3876853203", "alezala1371@gmail.com", "64404"],
  ["ALARCON RENE JAVIER", "AVENIDA URUGUAY 105. SAN PEDRO DE JUJUY. 4500", "22874118", "1972-07-09", "3888661622", "alarconseguros105@gmail.com", "92023"],
  ["AGUERO , JORGE GUSTAVO", "Av. Bolivia 19", "12718729", "1958-11-03", "3884715346", "Jorgegustavoaguero5@gmail.com", "47979"],
  ["BOVETTI LUIS", "LAS LAJITAS", "16056494", "1962-05-06", "3877478360", "luisbovetti@hotmail.com", "86848"],
  ["TEJERINA ROBERTO ANIBAL", "HIPOLITO IRIGOYEN 1226", "25613486", "1977-01-01", "3884085289", "robertoantejerina@gmail.com", "91972"],
  ["CECILIA SERRANO", "SCALABRINI ORTIZ", "31193038", "1984-08-22", "3874838270", "ceciserrano22@gmail.com", "87371"],
  ["Pablo Alfredo Arroyo", "Pje Cachi 854", "27016221", "1978-11-07", "3875526221", "pabloarroyopas@gmail.com", "78451"],
  ["Clemente Moya Jorge Eduardo", "Barrio San Pablo Sur Mza 400 A casa 4", "24875221", "1975-09-14", "3875837740", "jc.prodasesorseguros@gmail.com", "67274"],
  ["Vilte Orquera Raquel Vanesa", "Avda. Gdor Tello n°62", "33617327", "1987-12-21", "3885010006", "vanesavilte21@gmail.com", "67806"],
  ["BISCEGLIA, MARCOS SEBASTI", "O´HIGGINS 1903", "31193615", "1984-10-17", "3874883925", "msbisceglia@hotmail.com", "81704"],
  ["LOPEZ DIEZ EZEQUIEL", "Juramento 469", "23093320", "1973-04-05", "3875833373", "administracion@lopezdiezjuramento.com", "66586"],
  ["DIAZ EDUARDO FRANCISCO", "Leandro Alem 338", "20982522", "1969-10-20", "3874675816", "edu_1069@hotmail.com", "51280"],
  ["Gramaglio maria florencia", "Los mistoles 864. B° 17 de agosto", "33041244", "1987-04-10", "3878644445", "flopigram87@gmail.com", "107826"]
];

const insertOrUpdate = db.prepare(`
  INSERT INTO producers (name, address, dni, birthdate, phone, email, matricula)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(name) DO UPDATE SET
    address = excluded.address,
    dni = excluded.dni,
    birthdate = excluded.birthdate,
    phone = excluded.phone,
    email = excluded.email,
    matricula = excluded.matricula
`);

let imported = 0;
for (const row of data) {
  try {
    // Email has a dot at the end for LOPEZ DIEZ EZEQUIEL -> fix it
    let email = row[5].trim();
    if (email.endsWith('.')) email = email.slice(0, -1);
    
    insertOrUpdate.run(
      row[0].trim(), // name
      row[1].trim(), // address
      row[2].trim(), // dni
      row[3],        // birthdate
      row[4].trim(), // phone
      email,         // email
      row[6].trim()  // matricula
    );
    imported++;
  } catch (err) {
    console.error("Error importing", row[0], err.message);
  }
}

console.log(`Successfully imported/updated ${imported} producers.`);
