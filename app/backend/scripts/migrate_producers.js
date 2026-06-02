const db = require("../db");

const data = [
  { name: "ADRIANA BOTTO", address: "CALLE 12 MED 307 SANTA LUCIA", dni: "24237855", birthdate: "19-11-1974", phone: "3876854829", email: "adrianabotto@gmail.com", matricula: "77563", province: "SALTA", city: "" },
  { name: "AGUERO , JORGE GUSTAVO", address: "Av. Bolivia 19", dni: "12718729", birthdate: "03/11/58", phone: "3884715346", email: "jorgegustavoaguero5@gmail.com", matricula: "47979", province: "San Salvador de jujuy", city: "" },
  { name: "ALARCON RENE JAVIER", address: "AVENIDA URUGUAY 105. SAN PEDRO DE JUJUY. 4500", dni: "22874118", birthdate: "09/07/1972", phone: "3888661622", email: "alarconseguros105@gmail.com", matricula: "92023", province: "SAN PEDRO DE JUJUY. JUJUY", city: "" },
  { name: "Assef Torres Gisella Paola", address: "Barrio Los gremios mza i casa 2", dni: "33668158", birthdate: "27/02/1988", phone: "3874442040", email: "certuseguro@gmail.com", matricula: "106054", province: "Salta, Salta", city: "" },
  { name: "Ballesteros Barros Luis Ignacio", address: "B° Santa Rita II manzana 7 Lote 2", dni: "35478127", birthdate: "22/02/1991", phone: "3874643013", email: "nacho_9122@hotmail.com", matricula: "79441", province: "Salta, Salta", city: "" },
  { name: "Barrionuevo Cynthia", address: "San Rafael 345 el carril", dni: "34066317", birthdate: "21/07/1989", phone: "3876100849", email: "alessandrabarrionuevo@gmail.com", matricula: "88234", province: "Salta", city: "" },
  { name: "BISCEGLIA, MARCOS SEBASTIAN", address: "O'HIGGINS 1903", dni: "31193615", birthdate: "17/10/1984", phone: "3874883925", email: "msbisceglia@hotmail.com", matricula: "81704", province: "SALTA CAPITAL", city: "" },
  { name: "BOVETTI LUIS", address: "LAS LAJITAS", dni: "16056494", birthdate: "06/05/1962", phone: "3877478360", email: "luisbovetti@hotmail.com", matricula: "86848", province: "SALTA", city: "" },
  { name: "Caro Eustolia Angela", address: "Las chascas 1641", dni: "11081275", birthdate: "18/12/53", phone: "3875010456", email: "productor-2011@hotmail.com", matricula: "71719", province: "Salta capital", city: "" },
  { name: "CASANOVA, CARLOS MOISES", address: "LUIS BURELLA 8 - EL CARRIL, SALTA", dni: "30638042", birthdate: "26/06/1984", phone: "3874020718", email: "casanovaseguros.productor@gmail.com", matricula: "104956", province: "EL CARRIL, SALTA", city: "" },
  { name: "CECILIA SERRANO", address: "SCALABRINI ORTIZ", dni: "31193038", birthdate: "22/08/1984", phone: "3874838270", email: "ceciserrano22@gmail.com", matricula: "87371", province: "salta", city: "" },
  { name: "Chuchuy Marcelo Gerardo", address: "Avda. Bicentenario de la Batalla de Salta 349", dni: "20125117", birthdate: "21/01/78", phone: "3875701645", email: "mgchseguros@gmail.com", matricula: "102155", province: "Salta", city: "" },
  { name: "Clemente Moya Jorge Eduardo", address: "Barrio San Pablo Sur Mza 400 A casa 4", dni: "24875221", birthdate: "14/09/1975", phone: "3875837740", email: "jc.prodasesorseguros@gmail.com", matricula: "67274", province: "Salta", city: "" },
  { name: "Copa Gisella Elizabeth", address: "Ohighins 1903", dni: "33233356", birthdate: "27/10/87", phone: "3875975683", email: "gisellacopa@hotmail.com", matricula: "91540", province: "Capital Salta", city: "" },
  { name: "DIAZ EDUARDO FRANCISCO", address: "Leandro Alem 338", dni: "20982522", birthdate: "20/10/1969", phone: "3874675816", email: "edu_1069@hotmail.com", matricula: "51280", province: "General Güemes, Salta", city: "" },
  { name: "dominguez cristian abel", address: "angel de rosas 451, autodromo", dni: "34634340", birthdate: "14-05-1991", phone: "3885897899", email: "cristian79dominguez@gmail.com", matricula: "108302", province: "salta", city: "" },
  { name: "Drusian, Ignacio", address: "Av Sarmiento 794", dni: "34244346", birthdate: "07/10/1989", phone: "3874464222", email: "ignacio.productorasesor@gmail.com", matricula: "85381", province: "Salta", city: "" },
  { name: "ENRIQUE EZEQUIEL CLEMENTE MOYA", address: "B SAN PABLO SUR- MZA 400A CASA 4", dni: "27455446", birthdate: "29/07/1979", phone: "3875184917", email: "ezequiel.clemente@hotmail.com", matricula: "79470", province: "salta", city: "" },
  { name: "Espinoza carolina", address: "Barrio san rafael manzana D 1 casa 03", dni: "25571709", birthdate: "05/10/1976", phone: "3876137053", email: "espinozacarolina09@gmail.com", matricula: "90327", province: "Salta", city: "" },
  { name: "Estrada Facundo", address: "Dr Domingo Guemes 221", dni: "38033012", birthdate: "22/01/1994", phone: "3876833387", email: "facundoestrada22@gmail.com", matricula: "102671", province: "SALTA - CAPITAL", city: "" },
  { name: "FARFAN FLORES CRISTIAN EMMANUEL", address: "CAMILO SESTO MZA 398 LOTE 30  B 2 DE AGOSTO - PERICO", dni: "33250048", birthdate: "05/01/2026", phone: "3885881908", email: "ramonfarfan_seguros@hotmail.com", matricula: "70181", province: "PERICO - JUJUY", city: "" },
  { name: "Ferreira Jorge Antonio", address: "Avda 9 de Julio 881", dni: "21323189", birthdate: "02/04/1970", phone: "3888402443", email: "ferreirapas@hotmail.com", matricula: "70690", province: "San Pedro de Jujuy", city: "" },
  { name: "Gramaglio maria florencia", address: "Los mistoles 864. B° 17 de agosto", dni: "33041244", birthdate: "10/04/1987", phone: "3878644445", email: "flopigram87@gmail.com", matricula: "107826", province: "San ramon de la nueva oran, salta", city: "" },
  { name: "Juárez, Hugo", address: "Parque gral Belgrano MZ 11 casa 40 etapa 6", dni: "34184504", birthdate: "05/09/1989", phone: "3874571763", email: "Hjseguros@hotmail.com", matricula: "77823", province: "Salta", city: "" },
  { name: "LOPEZ DIEZ EZEQUIEL", address: "Juramento 469", dni: "23093320", birthdate: "05/04/1973", phone: "3875833373", email: "administracion@lopezdiezjuramento.com.ar", matricula: "66586", province: "SALTA", city: "" },
  { name: "López, Braulio Fabián", address: "Salta 855 (Braulio Fabián López)", dni: "20546475", birthdate: "21/09/1982", phone: "3885173332", email: "delmilagro314@gmail.com", matricula: "75997", province: "San Salvador de Jujuy - Jujuy", city: "" },
  { name: "Nallim Ricardo Antonio", address: "Tucuman 1216", dni: "22685105", birthdate: "06/08/1972", phone: "3874827477", email: "ricardonallimpas@gmail.com", matricula: "106085", province: "Salta", city: "" },
  { name: "Pablo Alfredo Arroyo", address: "Pje Cachi 854", dni: "27016221", birthdate: "7/11/1978", phone: "3875526221", email: "pabloarroyopas@gmail.com", matricula: "78451", province: "Salta", city: "" },
  { name: "Rueda Susana Elena", address: "Barrio santa rosa M 160 L 09", dni: "24258369", birthdate: "10/02/75", phone: "3886416048", email: "suelen231@hotmail.com", matricula: "61762", province: "Libertador gral san martin , Jujuy", city: "" },
  { name: "TEJERINA ROBERTO ANIBAL", address: "HIPOLITO IRIGOYEN 1226", dni: "25613486", birthdate: "01/01/1977", phone: "3884085289", email: "robertoantejerina@gmail.com", matricula: "91972", province: "SAN SALVADOR DE JUJUY - JUJUY", city: "" },
  { name: "Vilte Orquera Raquel Vanesa", address: "Avda. Gdor Tello n°62", dni: "33617327", birthdate: "21/12/1987", phone: "3885010006", email: "vanesavilte21@gmail.com", matricula: "67806", province: "Jujuy", city: "" },
  { name: "Yarad María Gabriela", address: "Av Savio 1141", dni: "23584602", birthdate: "17/11/1973", phone: "3876832955", email: "macaria73@hotmail.com", matricula: "79923", province: "Salta", city: "" },
  { name: "Zalazar Alejandro Daniel", address: "Mar jonico 1371", dni: "21633533", birthdate: "26/10/1970", phone: "3876853203", email: "alezala1371@gmail.com", matricula: "64404", province: "Salta capital", city: "" },
  { name: "FARFAN MARTA EMILIA", address: "PTE PERON 289", dni: "34198002", birthdate: "29/09/1988", phone: "3885739411", email: "mcseguroselcarmen@hotmail.com", matricula: "75380", province: "el carmen jujuy", city: "" },
  { name: "Argañaraz, Argentina Elizabeth", address: "Tucumán 275", dni: "17355116", birthdate: "20/06/1965", phone: "3875005121", email: "argentinaarganaraz@yahoo.com.ar", matricula: "58887", province: "Salta.", city: "" },
  { name: "Agüero Gustavo Rubén", address: "Av. Belgrano N° 2115", dni: "26031260", birthdate: "04/01/1978", phone: "3874852479", email: "pasgraguero@gmail.com", matricula: "84071", province: "Salta Capital", city: "" },
  { name: "Julia del valle armella", address: "Manzana H duplex 36 barrio Panque general belgrano", dni: "17441374", birthdate: "22/02/1865", phone: "3876562200", email: "armellaparque@gmail.com", matricula: "83153", province: "Salta", city: "" },
  { name: "Pérez Sokolich Pablo Armando", address: "Independencia 1356", dni: "33046090", birthdate: "02/12/1987", phone: "3875635622", email: "psproductordeseguros@gmail.com", matricula: "99367", province: "Salta", city: "" },
  { name: "Cejas Sandra Viviana", address: "BLOCK 24 piso 2 dpto 6 AMPLIACION intersindical", dni: "21633386", birthdate: "10/10/1970", phone: "3874586673", email: "vivi_cejas_08@hotmail.com", matricula: "73876", province: "Salta", city: "" },
  { name: "Ayala Natalia Verónica", address: "Tucumán 969", dni: "30636458", birthdate: "18/02/1984", phone: "3875217626", email: "nvero_18@hotmail.com", matricula: "68361", province: "Salta, Salta", city: "" }
];

async function updateProducers() {
  console.log("Starting producers update (MATCH BY MATRICULA ONLY)...");
  let updatedCount = 0;
  
  for (const row of data) {
    if (!row.matricula) continue;
    const matricula = String(row.matricula).trim();
    
    // Solo comparar por matrícula
    const producer = db.prepare("SELECT * FROM producers WHERE matricula = ?").get(matricula);
    
    if (producer) {
      let rawProvince = (row.province || "").toLowerCase();
      let finalProvince = rawProvince.includes("jujuy") ? "Jujuy" : "Salta";
      
      let rawCity = row.province ? row.province.split(",")[0].trim() : "";
      let finalCity = "Salta";
      
      if (rawProvince.includes("capital") || rawCity.toLowerCase().includes("capital") || rawCity.toLowerCase() === "salta") {
        finalCity = "Salta";
      } else if (rawCity) {
        finalCity = rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase();
      }
      if (finalCity.toLowerCase() === "san salvador de jujuy" || rawProvince.includes("san salvador de jujuy")) {
        finalCity = "San Salvador de Jujuy";
      }
      
      let finalBirthdate = row.birthdate || producer.birthdate;
      if (row.birthdate) {
        if (row.birthdate.includes("-")) {
           const parts = row.birthdate.split("-");
           if (parts[2] && parts[2].length === 4) finalBirthdate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (row.birthdate.includes("/")) {
           const parts = row.birthdate.split("/");
           if (parts[2]) {
             const year = parts[2].length === 2 ? (parseInt(parts[2]) > 30 ? `19${parts[2]}` : `20${parts[2]}`) : parts[2];
             finalBirthdate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
           }
        }
      }

      // UPDATE - No tocar nombre ni email
      db.prepare(`
        UPDATE producers 
        SET phone = ?, address = ?, city = ?, province = ?, birthdate = ?, dni = ?
        WHERE id = ?
      `).run(
        row.phone || producer.phone,
        row.address || producer.address,
        finalCity || producer.city,
        finalProvince || producer.province,
        finalBirthdate || producer.birthdate,
        row.dni || producer.dni,
        producer.id
      );
      
      updatedCount++;
    }
  }
  
  console.log(`Successfully updated ${updatedCount} producers strictly by matricula.`);
}

module.exports = updateProducers;
