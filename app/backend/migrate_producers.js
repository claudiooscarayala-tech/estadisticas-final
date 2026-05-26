const db = require("./db");

function migrate() {
  console.log("Iniciando migración de la tabla producers...");

  try {
    // Check existing columns to avoid errors if run multiple times
    const tableInfo = db.pragma("table_info(producers)");
    const existingColumns = tableInfo.map(col => col.name);

    if (!existingColumns.includes("phone")) {
      db.exec("ALTER TABLE producers ADD COLUMN phone TEXT;");
      console.log("Columna 'phone' agregada.");
    }
    if (!existingColumns.includes("matricula")) {
      db.exec("ALTER TABLE producers ADD COLUMN matricula TEXT;");
      console.log("Columna 'matricula' agregada.");
    }
    if (!existingColumns.includes("address")) {
      db.exec("ALTER TABLE producers ADD COLUMN address TEXT;");
      console.log("Columna 'address' agregada.");
    }
    if (!existingColumns.includes("city")) {
      db.exec("ALTER TABLE producers ADD COLUMN city TEXT;");
      console.log("Columna 'city' agregada.");
    }
    if (!existingColumns.includes("province")) {
      db.exec("ALTER TABLE producers ADD COLUMN province TEXT;");
      console.log("Columna 'province' agregada.");
    }
    if (!existingColumns.includes("birthdate")) {
      db.exec("ALTER TABLE producers ADD COLUMN birthdate TEXT;");
      console.log("Columna 'birthdate' agregada.");
    }

    console.log("Migración de productores completada exitosamente.");
  } catch (error) {
    console.error("Error durante la migración:", error);
  }
}

migrate();
