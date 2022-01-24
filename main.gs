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
//
//NHK新型コロナウィルス関連データ利用規約
//https://www3.nhk.or.jp/news/special/coronavirus/data/rules.html
//

//対象都道府県（◯◯県のように指定。''の場合は全国が対象。）
const targetPref = '東京都';

//データ取得開始日 (mm/dd/yyyy)
const startDate = '10/01/2021';

//COVID-19データ取得先
var url = '';
if (targetPref == '') {
  url = 'https://www3.nhk.or.jp/n-data/opendata/coronavirus/nhk_news_covid19_domestic_daily_data.csv';  //全国
} else { 
  url = 'https://www3.nhk.or.jp/n-data/opendata/coronavirus/nhk_news_covid19_prefectures_daily_data.csv'; //都道府県別
}


//以下は別ファイルで定義
//var ssid = 'COVIDデータを格納するスプレッドシートのID';
//var slackUrl   = 'https://slack.com/api/files.upload';
//var token      = 'slackAPIトークン';
//var channel    = 'チャネル名';


function main() {
  var spreadsheet = SpreadsheetApp.openById(ssid);
  var sheet = spreadsheet.getSheets()[0];
  var chart = sheet.newChart();

  //CSVデータ取得
  objs = urlfetch(url);

  //スプレッドシートに保存
  objsToSheet(objs, sheet);

  //グラフ描画の準備
  if(sheet.getFilter() != null) {
    sheet.getFilter().remove();
  }
  var charts = sheet.getCharts();
  for (var i in charts) {
    sheet.removeChart(charts[i]);
  }

  //グラフ描画
  if (targetPref == '') {
    chart = buildChartZenkoku(sheet, chart);
  } else {
    chart = buildChartPref(sheet, chart);
  }
  sheet.insertChart(chart);
  
  //転送メッセージの準備
  var chartImage = chart.getBlob().getAs('image/png').setName("graph.png");
  var text = '';
  if (targetPref == '') {
    var lastRow = sheet.getLastRow();
    var lastVal = sheet.getRange(lastRow,1,1,2).getValues(); //最終行の日付,陽性者数
    text = Utilities.formatDate(lastVal[0][0], 'JST', 'yyyy-MM-dd')+'の陽性者数: '+lastVal[0][1];
  } else {
    var lastRow = sheet.getLastRow();
    var lastVal = sheet.getRange(lastRow,1,1,1).getValues(); //最終行の日付
    text = Utilities.formatDate(lastVal[0][0], 'JST', 'yyyy-MM-dd ')+targetPref+'の陽性者数';
  }

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

function buildChartZenkoku(sheet, chart) {
  var rule = SpreadsheetApp.newFilterCriteria().whenDateAfter(new Date(startDate)).build();
  var range = sheet.getDataRange().createFilter().setColumnFilterCriteria(1, rule); 
  var range1 = sheet.getRange('A1:B'); //先頭2列（日付,国内の感染者数_1日ごとの発表数）のみを取得

  return chart.addRange(range1).setPosition(1, 3, 0, 0).setChartType(Charts.ChartType.LINE).build();
}

function buildChartPref(sheet, chart){
  //C列の都道府県名で絞り込み
  var rule1 = SpreadsheetApp.newFilterCriteria().whenDateAfter(new Date(startDate)).build();
  var rule2 = SpreadsheetApp.newFilterCriteria().whenTextContains(targetPref).build();
  //複数都道府県のデータを表示したい場合は whenFormulaSatisfied を利用
  //var rule2 = SpreadsheetApp.newFilterCriteria().whenFormulaSatisfied('=OR(C2:C="東京都",C2:C="沖縄県")').build();
  var range = sheet.getDataRange().createFilter().setColumnFilterCriteria(1, rule1).setColumnFilterCriteria(3, rule2);
  var range1 = sheet.getRange('A1:A');  //日付
  var range2 = sheet.getRange('D1:D');  //各地の感染者数

  return chart.addRange(range1).addRange(range2).setPosition(1, 3, 0, 0).setChartType(Charts.ChartType.LINE).build();
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
  
  return UrlFetchApp.fetch(slackUrl, params);
}


