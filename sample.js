'use strict';

// モジュールインポート
const { KintoneRestAPIClient } = require('@kintone/rest-api-client');
const axios = require('axios');
const formdata = require('form-data');
const path = require('path');
const fs = require('fs');

// 環境変数インポート
const DOMAIN = process.env.domain;
const USER = process.env.user;
const PASSWORD = process.env.password;
const APP = process.env.app;
const RECORD = process.env.record;
const FILE_CODE = process.env.fcode;

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
  console.log("kintone JavaScript Client file upload sample (for Node.js)");
  const res = await uploadFile("./sample.txt");
  const fileKey = res.data.fileKey;
  const params = {
    app: APP,
    records: [
      {
        id: RECORD, 
        record: {
          [FILE_CODE]: {
            value: [
              {
                fileKey: fileKey
              },
            ],
          },
        },
      },
    ],
  };
  const result = await client.record.updateAllRecords(params);
  console.log(result);
  console.log("done!");
}

if (require.main === module) {
  main();
}

