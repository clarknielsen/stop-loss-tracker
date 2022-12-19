const express = require("express");
const axios = require("axios");
const path = require("path");
const Papa = require("papaparse");

const app = express();
const PORT = process.env.PORT !== undefined ? process.env.PORT : 3000;

app.use("/", express.static("public/assets"));

app.get("/", (req, res) => {
  // homepage
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/scrape/:symbol", (req, res) => {
  const today = Math.round(new Date().getTime() / 1000);
  const oneYearAgo = today - (60*60*24*365);
  const url = `https://query1.finance.yahoo.com/v7/finance/download/${req.params.symbol}?period1=${oneYearAgo}&period2=${today}&interval=1d&events=history&includeAdjustedClose=true`;

  // download csv
  axios.get(url).then((results) => {
    // convert to json
    var csvData = Papa.parse(results.data, { header: true });
    var history = csvData.data.reverse();

    var start = new Date(req.query.date).getTime();
    var current = parseFloat(history[0].Close);
    var high = 0;

    for (let i = 0; i < history.length; i++) {
      // only compare within range specified by user
      if (new Date(history[i].Date).getTime() >= start) {
        var price = parseFloat(history[i].Close);

        if (price > high) {
          high = price;
        }
      }
      else {
        break;
      }
    }

    res.json({current, high});
    
  }).catch((err) => {
    // something went wrong...
    console.log(err);
    res.status(500).end();
  });
});

app.listen(PORT, () => {
  console.log(`app started on port ${PORT}`);
});