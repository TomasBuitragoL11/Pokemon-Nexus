const express = require('express');
const enrutador = express.Router();
const pokemonCapturado = require('../controladores/capturadoControlador');

enrutador.post('/capturar', pokemonCapturado.capturarPokemon);
enrutador.get('/listar/:usuarioCedula', pokemonCapturado.listarPokemonesUsuario);
enrutador.get('/total', pokemonCapturado.contarCapturas);

module.exports = enrutador;