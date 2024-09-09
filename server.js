const express = require("express");
const axios = require("axios");
const path = require("path");

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
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${req.params.symbol}?period1=${oneYearAgo}&period2=${today}&interval=1d&events=history&includeAdjustedClose=true`;

  // download csv
  axios.get(url).then((results) => {
    var history = results.data.chart.result[0];
    var timestamps = history.timestamp;
    var prices = history.indicators.quote[0].close;

    var start = new Date(req.query.date).getTime() / 1000 | 0; // round down
    var current = parseFloat(prices[prices.length-1]);
    var high = 0;

    for (let i = 0; i < timestamps.length; i++) {
      // only compare within range specified by user
      if (timestamps[i] >= start) {
        var price = parseFloat(prices[i]);

        if (price > high) {
          high = price;
        }
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