const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/", express.static("public/assets"));

app.get("/", (req, res) => {
  // homepage
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/scrape/:symbol", (req, res) => {
  axios.get(`https://finance.yahoo.com/quote/${req.params.symbol}/history?p=${req.params.symbol}`).then((data) => {
    // parse out array of price history
    var history = JSON.parse(data.data.match(/(?<="prices":)\[\{[^\]]*\}\]/)[0]);

    var start = new Date(req.query.date).getTime();
    var current = parseFloat(history[0].close);
    var high = 0;

    for (let i = 0; i < history.length; i++) {
      // only compare within range specified by user
      if (history[i].date*1000 >= start) {
        var price = parseFloat(history[i].close);

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