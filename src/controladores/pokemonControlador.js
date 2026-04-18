const { Pokemon } = require('../baseDatos');

const registrarPokemon = async (req, res) => {
  try {
    const { nombre, tipo, poder } = req.body;
    
    const pokemonExistente = await Pokemon.findOne({
        where: {
            nombre: nombre
        }
    });

    if (pokemonExistente) {
      return res.status(400).json({ mensaje: "El pokemon ya existe", resultado: null });
    }

    const nuevoPokemon = await Pokemon.create({ nombre, tipo, poder });
    res.status(201).json({ mensaje: "Pokemon creado", resultado: nuevoPokemon });
  } catch (error) {
    res.status(400).json({ mensaje: error.message, resultado: null });
  }
};

const { Op, fn, col, where: sequelizeWhere } = require('sequelize');

const listarPokemones = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", tipo = "" } = req.query;

    const offset = (page - 1) * limit;

    const condiciones = [];

    // 🔍 filtro por nombre (case insensitive)
    if (search) {
      condiciones.push(
        sequelizeWhere(
          fn('LOWER', col('nombre')),
          {
            [Op.like]: `%${search.toLowerCase()}%`
          }
        )
      );
    }

    // 🔥 filtro por tipo
    if (tipo) {
      condiciones.push({
        tipo: tipo.toLowerCase()
      });
    }

    const { count, rows } = await Pokemon.findAndCountAll({
      where: condiciones.length ? { [Op.and]: condiciones } : {},
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      mensaje: "Lista de Pokémon",
      resultado: rows,
      total: count,
      totalPaginas: Math.ceil(count / limit),
      paginaActual: parseInt(page)
    });

  } catch (error) {
    res.status(400).json({ mensaje: error.message, resultado: null });
  }
};

module.exports = {
    registrarPokemon,
    listarPokemones
};