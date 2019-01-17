const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/", express.static("public/assets"));

app.get("/", (req, res) => {
  // homepage
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/scrape/:symbol", (req, res) => {
  // post request to nasdaq.com allows us to specify range (18 months)
  axios.post(`https://www.nasdaq.com/symbol/${req.params.symbol}/historical`, `18m|false|${req.params.symbol}`, {
    headers:{
      'Referer': `https://www.nasdaq.com/symbol/${req.params.symbol}/historical`,
      'dnt': 1,
      'Content-Type': 'application/json'
    }
  }).then((data) => {
    var $ = cheerio.load(data.data);

    var start = new Date(req.query.date).getTime();
    var high = 0;

    // get latest price from first tr tag
    var current = parseFloat($("tbody tr:first-child").find("td").eq(4).text().trim());

    // skip first tr tag to get price history
    $("tbody tr:not(:first-child)").each((i, element) => {
      var tds = $(element).find("td");

      var date = new Date(tds.eq(0).text().trim()).getTime();

      // only compare within range specified by user
      if (date >= start) {
        var price = parseFloat(tds.eq(2).text().trim());

        if (price > high) {
          high = price;
        }
      }
    });

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