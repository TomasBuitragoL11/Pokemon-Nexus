require("dotenv").config();
const axios = require("axios");

const db = require("./src/baseDatos");
const { sequelize, Pokemon } = db;

async function cargarPokemon() {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la BD");

    for (let i = 1; i <= 457; i++) {
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const data = res.data;

      const nombre = data.name;
      const tipo = data.types[0].type.name;
      const poder = String(
        data.stats.find(s => s.stat.name === "attack").base_stat
      );
      const imagen = data.sprites.front_default;

      // 🔥 EVITAR DUPLICADOS
      const existe = await Pokemon.findOne({ where: { nombre } });

      if (existe) {
        console.log(`⏭ ${nombre} ya existe`);
        continue;
      }

      await Pokemon.create({
        nombre,
        tipo,
        poder,
        imagen
      });

      console.log(`✔ ${nombre} guardado`);

      // ⏳ pequeño delay para no saturar la API
      await new Promise(res => setTimeout(res, 100));
    }

    console.log("🔥 Todos los Pokémon cargados correctamente");
    process.exit();

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

cargarPokemon();