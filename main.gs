//参考URL
//データ取得
//https://qiita.com/uu4k/items/e20837cacc4fa19efe32
//
//スプレッドシートへのグラフ転送
//https://www.pnkts.net/2020/03/29/spreadsheet-graph-slack-bot
//
//slack APIについて
//https://tec.tecotec.co.jp/entry/2020/12/25/000000
//
//slack file upload APIの仕様
//https://api.slack.com/methods/files.upload

//COVID-19データ取得設定
const url = 'https://www.mhlw.go.jp/content/pcr_positive_daily.csv';

//以下は別ファイルで定義
//var ssid = 'COVIDデータを格納するスプレッドシートのID';
//var slackurl   = 'https://slack.com/api/files.upload';
//var token      = 'slackAPIトークン';
//var channel    = 'チャネル名';


function main() {
  var spreadsheet = SpreadsheetApp.openById(ssid);
  var sheet = spreadsheet.getSheets()[0];

  //CSVデータ取得
  objs = urlfetch(url);

  //スプレッドシートに保存
  objsToSheet(objs, sheet);

  //グラフ描画の準備
  var range = sheet.getDataRange();
  var chart = sheet.newChart().addRange(range).setPosition(1, 3, 0, 0).setChartType(Charts.ChartType.LINE).build();
  var charts = sheet.getCharts();
  for (var i in charts) {
    sheet.removeChart(charts[i]);
  }
  //グラフ描画
  sheet.insertChart(chart);
  
  //転送メッセージの準備
  var chartImage = chart.getBlob().getAs('image/png').setName("graph.png");
  var lastRow = sheet.getLastRow();
  var lastVal = sheet.getRange(lastRow,1,1,2).getValues(); //最終行の日付,陽性者数
  var text = Utilities.formatDate(lastVal[0][0], 'JST', 'yyyy-MM-dd')+'の陽性者数: '+lastVal[0][1];

  //Slackにメッセージ転送
  pushImageToSlack(chartImage, text);

}

function urlfetch(url) {
  
  var response = UrlFetchApp.fetch(url).getContentText();
  var objs = Utilities.parseCsv(response);

  return objs;
}

function objsToSheet(objs, sheet) {
  var obj = objs[0];
  var keys = Object.keys(obj);
  var arrays = [];
  for(var i = 0; i < objs.length; i++) {
    var obj = objs[i];
    var values = [];
    for(var j = 0; j < keys.length; j++) {
      var value = obj[keys[j]];
      values.push(value);
    }
    arrays.push(values);
  }
  setDataToSheet(sheet, arrays)
}

function setDataToSheet(sheet, arrays){
  sheet.clear();
  //var last_row = sheet.getLastRow();
  //var start_row = last_row + 1;
  var start_row = 1;
  var start_col = 1;
  var num_rows = arrays.length;
  var num_cols = arrays[0].length;
  var range = sheet.getRange(start_row, start_col, num_rows, num_cols);
  range.setValues(arrays); 
}

function pushImageToSlack(chart, text) {

  var payload = {
        'token'      : token,
        'channels'   : channel,
        'initial_comment': text,
        'file'        : chart,
        'filename'    : text
    };
 
    var params = {
        'method' : 'post',
        'payload' : payload
    };
  
  return UrlFetchApp.fetch(slackurl, params);
}

