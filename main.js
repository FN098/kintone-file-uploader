/*
 * kintone JavaScript Client file uploader (for Node.js)
 * Copyright (c) 2022 Futoshi Nishino
 *
 * Licensed under the MIT License
 * https://opensource.org/licenses/mit-license.php
*/

'use strict';

console.log("kintone JavaScript Client file uploader (for Node.js)");

// モジュールインポート
const glob = require('glob');
const axios = require('axios');
const formdata = require('form-data');
const path = require('path');
const fs = require('fs');
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

// 環境変数インポート
const DOMAIN = process.env.KINTONE_DOMAIN;
const USERNAME = process.env.KINTONE_USERNAME;
const PASSWORD = process.env.KINTONE_PASSWORD;
const APP_ID = process.env.KINTONE_APP_ID;
const FILE_KEY_CODE = process.env.KINTONE_FILE_KEY_CODE;
const FILE_VALUE_CODE = process.env.KINTONE_FILE_VALUE_CODE;
const FILE_EXTENSION = process.env.KINTONE_FILE_EXTENSION;

if (!(DOMAIN && USERNAME && PASSWORD && APP_ID && FILE_KEY_CODE && FILE_VALUE_CODE && FILE_EXTENSION)) {
  throw Error("必須の環境変数が設定されていません。");
}

// クライアントの作成
const client = new KintoneRestAPIClient({
  baseUrl: `https://${DOMAIN}/`,
  auth: {
    username: USERNAME,
    password: PASSWORD,
  }
});

// ファイルアップロード
const uploadFile = async (filePath) => {
  const url = `https://${DOMAIN}/k/v1/file.json`;
  const form = new formdata();
  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  form.append('file', fs.readFileSync(filePath), path.basename(filePath));
  const config = {
      headers: {
          'X-Cybozu-Authorization': auth,
          'Content-Type': form.getHeaders()['content-type']
      }
  };
  const res = await axios.post(url, form, config);
  return res;
}

// ファイルアップロードテスト
async function uploadFileTest() {
  const res = await uploadFile("./test.txt");
  const params = {
    app: APP_ID,
    records: [
      {
        id: "13", 
        record: {
          FILE_KEY_CODE: {
            value: "TEST"
          },
          FILE_VALUE_CODE: {
            value: [
              {
                fileKey: res.data.fileKey
              },
            ],
          },
        },
      },
    ],
  };
  const result = await client.record.updateAllRecords(params);
  console.log(result);
}

// メイン関数
async function main() {
  try {
    // ファイル取得
    const files = await glob.sync(`**/*${FILE_EXTENSION}`);
    
    // 全レコード取得
    const records = await client.record.getAllRecords({ app: APP_ID });

    // ファイルアップロード
    for (let r of records) {
      // ファイル名にキーコードを含むファイルを抽出
      const filteredFiles = files.filter(f => {
        const fname = path.basename(f);
        return fname.indexOf(r[FILE_KEY_CODE].value) != -1;  
      });

      // ファイルをアップロードし、ファイルキーをレコードに関連付け
      for (let f of filteredFiles) {
        const res = await uploadFile(f);
        r[FILE_VALUE_CODE].value.push(res.data);
        console.log(`upload: "${f}"`);
      }
    }

    // 全レコード更新
    const params = {
      app: APP_ID,
      records: records.map(r => {
        return {
          id: r.$id.value, 
          record: {
            [FILE_VALUE_CODE]: {
              value: r[FILE_VALUE_CODE].value
            },
          },
        };
      })
    }
    await client.record.updateAllRecords(params)

    console.log("done!");
  }
  catch (e) {
    console.log(e);
  }
}

main();
