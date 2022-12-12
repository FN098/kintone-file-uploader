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
const DOMAIN = process.env.domain;
const USER = process.env.user;
const PASSWORD = process.env.password;
const APP = process.env.app;
const FILE_NAME = process.env.fname;
const FILE_CODE = process.env.fcode;
const FILE_EXT = process.env.fext;

if (!(DOMAIN && USER && PASSWORD && APP && FILE_NAME && FILE_CODE && FILE_EXT)) {
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

// メイン関数
async function main() {
  try {
    // ファイル取得
    const files = await glob.sync(`**/*${FILE_EXT}`);
    
    // 全レコード取得
    const records = await client.record.getAllRecords({ app: APP });

    // ファイルアップロード
    for (let r of records) {
      // ファイル名にキーコードを含むファイルを抽出
      const filteredFiles = files.filter(f => {
        const fname = path.basename(f);
        return fname.indexOf(r[FILE_NAME].value) != -1;  
      });

      // 既存のファイルを削除する場合
      // r[FILE_CODE].value = [];

      // ファイルをアップロードし、ファイルキーをレコードに関連付け
      for (let f of filteredFiles) {
        const res = await uploadFile(f);
        r[FILE_CODE].value.push(res.data);
        console.log(`upload: "${f}"`);
      }
    }

    // 全レコード更新
    const params = {
      app: APP,
      records: records.map(r => {
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

main();
