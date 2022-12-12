# kintoneファイル一括アップロード

## 使い方

1. パッケージインストール

    ```sh
    npm install
    ```

1. launch.json

    ```json
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Program",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "env": {
                "KINTONE_DOMAIN": "example.cybozu.com",
                "KINTONE_USERNAME": "username",
                "KINTONE_PASSWORD": "password",
                "KINTONE_APP_ID": "123",
                "KINTONE_FILE_NAME_CODE": "sample",
                "KINTONE_FILE_FIELD_CODE": "file",
                "KINTONE_FILE_EXTENSION": ".pdf",
            },
            "program": "${workspaceFolder}\\main.js"
        }
    ]
    ```

1. プログラム実行 (F5)

## 参考

[kintone JavaScript Client](https://developer.cybozu.io/hc/ja/articles/900000767263-kintone-JavaScript-Client-kintone-rest-api-client-)

[ファイルアップロード](https://developer.cybozu.io/hc/ja/articles/201941824-%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%82%A2%E3%83%83%E3%83%97%E3%83%AD%E3%83%BC%E3%83%89)

[ファイルアップロードで必須となる3つの手順](https://developer.cybozu.io/hc/ja/articles/200724665)

[Node.jsでkintoneにファイルアップロードする](https://qiita.com/YoshihikoTakeuchi/items/45a710340810cb5ec4fe)

[kintone REST APIの共通仕様](https://developer.cybozu.io/hc/ja/articles/201941754-kintone-REST-API%E3%81%AE%E5%85%B1%E9%80%9A%E4%BB%95%E6%A7%98)

[Node.jsでのBase64の変換方法](https://kamoqq.info/post/how-to-convert-base64-in-nodejs/)
