/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

const AWS = require("aws-sdk");
var s3 = new AWS.S3();
var awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
var bodyParser = require("body-parser");
var express = require("express");

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "dynamofiles";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + "-" + process.env.ENV;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "room";
const partitionKeyType = "S";
const sortKeyName = "";
const sortKeyType = "";
const hasSortKey = sortKeyName !== "";
const path = "/items";
const pathSend = "/send";
const UNAUTH = "UNAUTH";
const hashKeyPath = "/:" + partitionKeyName;
const sortKeyPath = hasSortKey ? "/:" + sortKeyName : "";
// declare a new express app
var app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch (type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
};

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

app.get(pathSend + hashKeyPath + sortKeyPath, async function (req, res) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);

  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] =
      req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
    try {
      params[partitionKeyName] = convertUrlType(
        req.params[partitionKeyName],
        partitionKeyType
      );
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: "Wrong column type " + err });
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(
        req.params[sortKeyName],
        sortKeyType
      );
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: "Wrong column type " + err });
    }
  }

  let getItemParams = {
    TableName: tableName,
    Key: params,
  };

  dynamodb.get(getItemParams, async function (err, data) {
    if (err) {
      res.statusCode = 500;
      res.json({ error: "Could not load items: " + err.message });
    } else {
      let password = false;

      if (data.Item) {
        console.log(data.Item);
        console.log(req.query.password);
        if (!data.Item.password || req.query.password === data.Item.password) {
          password = true;
        } else {
          password = false;
        }
      } else {
        password = true;
      }

      console.log("req" + req);
      console.log(req.params);


      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      if (password) {
        //whatsapp, gmail,sms
        if (req.query.type === "whatsapp") {
          client.messages
        .create({
          from: "whatsapp:+14155238886",
          body: "Someone sent you some files. Go to "+req.query.link.slice(8)+" to download them.",
          to: "whatsapp:+"+req.query.to,
        })
        .then((message) => {
          console.log(message.sid);
          res.json({ password: true });
        });
        }
        if (req.query.type === "email") {
          let html="<p>Someone sent you some files. Go to "+req.query.link+" to download them. Alternatively, download these attachments:</p><br/>";
          console.log(req.query.files);
          let arr=req.query.files.split(",");
          for(let i=0;i<arr.length;i++){
            let file=arr[i];
            data = await getSignedUrl(file);
            html+=`<a href='${data}'>${file}</a><br/>`;
          }
          const msg = {
            to: req.query.to, // Change to your recipient
            from: "pothamprojects@gmail.com", // Change to your verified sender
            subject: "Someone sent you some files...",
            html: html,
          };
    
          sgMail
            .send(msg)
            .then(() => {
              console.log("Email sent");
              res.json({ password: true });
            })
            .catch((error) => {
              console.error(error);
              res.json({ password: true });
            });
    
        }
        if (req.query.type === "sms") {
          client.messages
            .create({
              from: "+13139227899",
              to: "+"+req.query.to,
              body:"Someone sent you some files. Go to "+req.query.link.slice(8)+" to download them."
            })
            .then((message) => {
              console.log(message.sid);
              res.json({ password: true });
            });
        }
      } else {
        res.json({ password: false });
      }
    }
  });
});

app.get(path + "/object" + hashKeyPath + sortKeyPath, function (req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] =
      req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
    try {
      params[partitionKeyName] = convertUrlType(
        req.params[partitionKeyName],
        partitionKeyType
      );
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: "Wrong column type " + err });
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(
        req.params[sortKeyName],
        sortKeyType
      );
    } catch (err) {
      res.statusCode = 500;
      res.json({ error: "Wrong column type " + err });
    }
  }

  let getItemParams = {
    TableName: tableName,
    Key: params,
  };

  dynamodb.get(getItemParams, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.json({ error: "Could not load items: " + err.message });
    } else {
      let password = false;

      if (data.Item) {
        console.log(data.Item);
        console.log(req.query.password);
        if (!data.Item.password || req.query.password === data.Item.password) {
          password = true;
        } else {
          password = false;
        }
      } else {
        password = true;
      }

      let room = req.params[partitionKeyName];

      if (password) {
        console.log(req.query);
        var params;
        if (req.query.type === "list") {
          params = {
            Bucket: "transfil-storage",
            Prefix: room,
          };
          console.log(params);
          s3.listObjectsV2(params, function (err, data) {
            if (err) res.json(err);
            else res.json(data);
          });
        } else if (req.query.type === "delete") {
          params = {
            Bucket: "transfil-storage",
            Key: room + "/" + req.query.item,
          };
          console.log(params);
          s3.deleteObject(params, function (err, data) {
            if (err) {
              console.log(err);
              res.json(err);
            } else {
              res.json(data);
              console.log(data);
            }
          });
        } else {
          params = {
            Bucket: "transfil-storage",
            Key: room + "/" + req.query.item,
            ContentType: req.query.content,
          };
          console.log(params);
          s3.getSignedUrl(req.query.type, params, function (err, data) {
            if (err) {
              res.json(err);
              console.log(err);
            } else {
              res.json(data);
              console.log(data);
            }
          });
        }
      } else {
        res.json({ password: false });
      }
    }
  });
});

app.post(path, function (req, res) {
  if (userIdPresent) {
    req.body["userId"] =
      req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  let putItemParams = {
    TableName: tableName,
    Item: req.body,
  };
  dynamodb.put(putItemParams, (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.json({ error: err, url: req.url, body: req.body });
    } else {
      res.json({ success: "post call succeed!", url: req.url, data: data });
    }
  });
});

async function getSignedUrl(key){
  return new Promise((resolve,reject) => {
    let params = { Bucket: "transfil-storage", Key: key };
    s3.getSignedUrl('getObject', params, (err, url) => {
      if (err) reject(err);
      resolve(url);
    });
});
}

app.listen(3000, function () {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
