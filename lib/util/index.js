
const fs = require('fs');
var path = require('path');
require('dotenv').config();
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
  apiVersion: '2006-03-01',
  signatureVersion: 'v4',
  ACL: 'public-read',
});
s3 = new AWS.S3();


const randomString = (length = 12, charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') => {
  let randomString = ''
  for (let i = 0; i < length; i++) {
    let randomPoz = Math.floor(Math.random() * charSet.length)
    randomString += charSet.substring(randomPoz, randomPoz + 1)
  }
  return randomString
}

const generateOtp = (length = 4, charSet = '1234567890') => {
  let randomString = ''
  for (let i = 0; i < length; i++) {
    let randomPoz = Math.floor(Math.random() * charSet.length)
    randomString += charSet.substring(randomPoz, randomPoz + 1)
  }
  //return randomString;
  if (process.env.NODE_ENV == 'development') {
    return randomString
  } else {
    return randomString
  }
}

const uploadImageAPI = (file, imgpath, callback) => {
  if (file.originalFilename == '') {
    callback(null, { nofile: true })
  } else {
    var filePath = file.path
    var params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Body: fs.createReadStream(filePath),
      Key: imgpath + '/' + Date.now() + '_' + path.basename(filePath),
      ContentType: file.headers['content-type'],
      ACL: 'public-read',
    }

    return new Promise((resolve, reject) => {
      s3.upload(params, function (err, data) {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
}

const utcDateTime = (date = new Date()) => {
  date = new Date(date);
  return new Date(
      Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          date.getUTCHours(),
          date.getUTCMinutes(),
          date.getUTCSeconds()
      )
  );
}

const showDate = (date, format = 'MM/DD/YYYY hh:mm A') =>
  utcDate(date).toString() !== 'Invalid Date'
    ? moment.utc(date).format(format)
    : 'N/A'

module.exports = {
  randomString,
  generateOtp,
  uploadImageAPI,
  showDate,
  utcDateTime
}
