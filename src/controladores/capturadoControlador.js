const { Capturado, Pokemon } = require('../baseDatos');

const capturarPokemon = async (req, res) => {
  try {
    const { usuarioCedula, pokemonId } = req.body;

    const existe = await Capturado.findOne({
      where: { usuarioCedula, pokemonId }
    });

    if (existe) {
      return res.status(400).json({
        mensaje: "Este Pokémon ya fue capturado por este usuario"
      });
    }

    const capturado = await Capturado.create(req.body);

    res.status(201).json({
      mensaje: "Pokemon capturado",
      resultado: capturado
    });

  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

const listarPokemonesUsuario = async (req, res) => {
  try {
    const { usuarioCedula } = req.params;
    const pokemones = await Capturado.findAll({
      where: { usuarioCedula },
      include: [
      {
        model: Pokemon,
        attributes: ["nombre", "imagen"]
      }
    ]
  });
    res.status(200).json({ mensaje: "Lista de Pokémon capturados", resultado: pokemones });
  } catch (error) {
    res.status(400).json({ mensaje: error.message, resultado: null });
  }
};

const contarCapturas = async (req, res) => {
  try {
    const total = await Capturado.count();
    res.json({ total });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
    capturarPokemon,
    listarPokemonesUsuario,
    contarCapturas
};