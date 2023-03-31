import express from "express";
import bodyParser from 'body-parser';
import captureConsumos from "./app.js";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.sendFile('C:/Users/monterrey1/Documents/Projects/consumos-app/src/index.html');
});


app.post('/', (req, res) => {
  captureConsumos(req.body)
    .then((data) => res.redirect('http://172.16.0.117/Inventarios/ConsumoReacLabMasivo.aspx'));
});


app.listen(3000, () => console.log('Conectado al servidor.'));