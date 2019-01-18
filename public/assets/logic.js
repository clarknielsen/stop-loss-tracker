// pull values out of storage
var holdings = JSON.parse(localStorage.getItem("holdings")) || [];
var perc = parseInt(localStorage.getItem("perc") || 2);

$("#perc").val(perc);

for (let i = 0; i < holdings.length; i++) {
  // call api for each item in storage
  scrapeStock(holdings[i]);
}

function scrapeStock(holding) {
  $.get(`/scrape/${holding.ticker}?date=${holding.date}`).then((data) => {
    // make a new table row
    var row = $("<tr>");
    var td1 = $("<td class='ticker'>").text(holding.ticker);
    var td2 = $("<td class='date'>").text(holding.date);
    var td3 = $("<td class='current'>").text("$" + data.current.toFixed(2));
    var td4 = $(`<td class="high">`).text("$" + data.high.toFixed(2));

    // calculate stop price
    var stopPrice = data.high * ((100-perc)/100);
    var td5 = $("<td class='stop'>").text("$" + stopPrice.toFixed(2));

    // and highlight in red if we've gone below
    if (data.current <= stopPrice) {
      td5.addClass("warning");
    }

    var td6 = $("<td class='delete'>").html("<button class='btn btn-danger btn-sm'>x</button>");

    $("#holdings").show();
    $("#holdings tbody").append(row.append(td1, td2, td3, td4, td5, td6));
  })
  .fail(() => {
    removeTicker(holding.ticker);

    $("#modal .modal-header").html("Failed to get price history");
    $("#modal").modal("show");
  });
}

function removeTicker(ticker) {
  for (let i = 0; i < holdings.length; i++) {
    if (holdings[i].ticker === ticker) {
      holdings.splice(i, 1);
      localStorage.setItem("holdings", JSON.stringify(holdings));
      break;
    }
  }
}

$("#perc").on("blur", function() {
  var newVal = parseInt($(this).val());

  // update stop loss percentage
  if (perc !== newVal) {
    perc = newVal;
    localStorage.setItem("perc", perc);
    
    // cheating...
    location.reload();
  }
});

$("#add").on("click", function() {
  var ticker = $("#ticker").val().toLowerCase();
  var date = $("#date").val().split("-");
      date = `${date[1]}/${date[2]}/${date[0]}`;

  // validation
  if (ticker === "" || date.indexOf("undefined") !== -1) {
    $("#modal .modal-header").html("Please provide a symbol and buy date");
    $("#modal").modal("show");
    
    return;
  }
  else {
    // check for dupes
    for (let i = 0; i < holdings.length; i++) {
      if (holdings[i].ticker === ticker) {
        $("#modal .modal-header").html("Duplicate symbol");
        $("#modal").modal("show");

        return;
      }
    }
  }

  // add ticker to holdings
  holdings.push({ticker, date});
  localStorage.setItem("holdings", JSON.stringify(holdings));

  $("#ticker, #date").val("");

  scrapeStock({ticker, date});
});

$("#holdings").on("click", ".delete button", function() {
  var ticker = $(this).parent().parent().find("td").eq(0).text();
  
  // remove ticker from storage and dom
  removeTicker(ticker);
  $(this).parent().parent().remove();
});