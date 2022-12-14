/*
 * kintone JavaScript Client File Uploader (for Node.js)
 * Copyright (c) 2022 Futoshi Nishino
 *
 * Licensed under the MIT License
 * https://opensource.org/licenses/mit-license.php
*/

'use strict';

console.log("kintone JavaScript Client File Uploader (for Node.js)");

// モジュールインポート
const glob = require('glob');
const axios = require('axios');
const formdata = require('form-data');
const path = require('path');
const fs = require('fs');
const parse = require('csv-parse/sync');
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');

// 環境変数インポート
const DOMAIN = process.env.domain;
const USER = process.env.user;
const PASSWORD = process.env.password;
const APP = process.env.app;
const FILE_NAME = process.env.fname;
const FILE_CODE = process.env.fcode;
if (!(DOMAIN && USER && PASSWORD && APP && FILE_NAME && FILE_CODE)) {
  throw Error("必須の環境変数が設定されていません。");
}

// クライアントの作成
const client = new KintoneRestAPIClient({
  baseUrl: `https://${DOMAIN}/`,
  auth: {
    username: USER,
    password: PASSWORD,
  }
});

// ファイルアップロード
const uploadFile = async (filePath) => {
  const url = `https://${DOMAIN}/k/v1/file.json`;
  const form = new formdata();
  const auth = Buffer.from(`${USER}:${PASSWORD}`).toString('base64');
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

// (kintoneからインポートした)CSV読み込み
const getAllRecordsFromCsv = (filePath) => {
  const data = fs.readFileSync(filePath);
  const rawRecords = parse.parse(data, {
    columns: true
  });
  const records = rawRecords.map(r => {
    return {
      $id: {
        value: r.レコード番号,
      },
      [FILE_NAME]: {
        value: r[FILE_NAME]
      },
      [FILE_CODE]: {
        value: []
      },
    }
  });
  return records;
}

// メイン関数
async function main() {
  try {
    // ファイル取得
    const allFiles = glob.sync(`assets/upload/**/*`).filter(f => f.match('.+\.(pdf)$'))
    
    // kintone APIで全レコード取得（遅い）
    // const allRecords = await client.record.getAllRecords({ app: APP });

    // CSVファイルから全レコード取得（速い）
    const allRecords = getAllRecordsFromCsv('assets/data.csv');

    // レコードの（ファイル名を表す）名前に一致するファイルをマッピング
    const recordsToUpdate = [];
    const filesToUpload = [];
    for (let r of allRecords) {
      const files = allFiles.filter(f => {
        const fname = path.basename(f);
        return fname.indexOf(r[FILE_NAME].value) != -1;
      })
      if (files.length > 0) {
        recordsToUpdate.push(r);
        filesToUpload.push(files);
      }
    }

    // マッピングしたファイルをアップロード
    for (let i = 0; i < recordsToUpdate.length; i++) {
      // 進捗率を表示
      const current = i + 1;
      const total = recordsToUpdate.length;
      const progress = Math.round(current / total * 100);
      console.log(`${progress}% (${current} of ${total} records)\r`);

      // アップロードファイル
      const files = filesToUpload[i];

      // 更新レコード
      const record = recordsToUpdate[i];

      // 既存のファイルを削除
      record[FILE_CODE].value = [];

      // ファイルをアップロードし、ファイルキーをレコードに関連付け
      for (let file of files) {
        const resp = await uploadFile(file);
        const fileKey = resp.data;
        record[FILE_CODE].value.push(fileKey);
        console.log(`upload: "${file}"\r`);
      }
    }

    // 全レコード更新
    const params = {
      app: APP,
      records: recordsToUpdate.map(r => {
        return {
          id: r.$id.value, 
          record: {
            [FILE_CODE]: {
              value: r[FILE_CODE].value
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

if (require.main === module) {
  main();
}
