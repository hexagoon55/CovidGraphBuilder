# CovidGraphBuilder
コロナ感染者数を取得しslackにポストするGASプログラムです。
以下の流れで処理を行います。

1. NHKのサイト( https://www3.nhk.or.jp/ )からコロナ感染者データを取得 <-2022/09/27でデータ更新停止
2. 取得したデータをもとにスプレッドシートでグラフを描画
3. グラフ画像をslackにポスト


なお、スクリプト実行にあたり以下の変数は main.gs の中でアンコメントして指定するか、あるいは別ファイルを作成してその中で定義してください。

- var ssid = 'COVIDデータを格納するスプレッドシートのID';
- var slackUrl   = 'https://slack.com/api/files.upload';
- var token      = 'slackAPIトークン';
- var channel    = 'チャネル名';
