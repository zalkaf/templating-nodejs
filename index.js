const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

var fs = require("fs");
var https = require('https');
var os = require('os');
var httpSignature = require('http-signature');
var jsSHA = require("jssha");


var ocid_file = fs.readFileSync("ocid.js");
var ocid_json = JSON.parse(ocid_file);

var final_data_orasesaudi = "";
var final_data_stcscloud123 = "";
var final_data_mobily = "";
var final_data_tawuniah = "";
var final_data_moj = "";
var final_data_qucloud = "";
var final_data_moh = "";
var final_data_nhcs = "";



const viewsDirPath = path.join(__dirname, "templates", "views");
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", viewsDirPath);
app.use(express.static(path.join(__dirname, "public")));


//console.log("hi")

var tenancyId = "";
var authUserId = "";
var identityDomain = "";
var coreServicesDomain = "";
var keyFingerprint = "";

var i = 0;
var privateKeyPath = "private.pem";

if(privateKeyPath.indexOf("~/") === 0) {
    privateKeyPath = privateKeyPath.replace("~", os.homedir())
}
var privateKey = fs.readFileSync(privateKeyPath, 'ascii');



function run(){ 

  console.log("=====================================")
  console.log(ocid_json.accounts[i].name)

  tenancyId = ocid_json.accounts[i].details.tenancyId;
  authUserId = ocid_json.accounts[i].details.authUserId;
  identityDomain = ocid_json.accounts[i].details.identityDomain;
  coreServicesDomain = ocid_json.accounts[i].details.coreServicesDomain;
  keyFingerprint = ocid_json.accounts[i].details.keyFingerprint;

  function sign(request, options) {
        var apiKeyId = options.tenancyId + "/" + options.userId + "/" + options.keyFingerprint;
        console.log(apiKeyId)
        var headersToSign = [
            "host",
            "date",
            "(request-target)"
        ];
        var methodsThatRequireExtraHeaders = ["POST", "PUT"];

        if(methodsThatRequireExtraHeaders.indexOf(request.method.toUpperCase()) !== -1) {
            options.body = options.body || "";

            var shaObj = new jsSHA("SHA-256", "TEXT");
            shaObj.update(options.body);

            request.setHeader("Content-Length", options.body.length);
            request.setHeader("x-content-sha256", shaObj.getHash('B64'));

            headersToSign = headersToSign.concat([
                "content-type",
                "content-length",
                "x-content-sha256"
            ]);
        }

        httpSignature.sign(request, {
            key: options.privateKey,
            keyId: apiKeyId,
            headers: headersToSign
        });

        var newAuthHeaderValue = request.getHeader("Authorization").replace("Signature ", "Signature version=\"1\",");
        request.setHeader("Authorization", newAuthHeaderValue);

    }

    // generates a function to handle the https.request response object
    function handleRequest(callback) {

        return function(response) {
            var responseBody = "";
            response.on('data', function(chunk) {
            responseBody += chunk;
        });
            response.on('end', function() {
                callback(JSON.parse(responseBody));
            });
        }
    }
    // gets the user with the specified id
    function getUser(userId, callback) {

        var options = {
            host: identityDomain,
            path: "/20160918/users/" + encodeURIComponent(userId),
        };

        var request = https.request(options, handleRequest(callback));

        sign(request, {
            privateKey: privateKey,
            keyFingerprint: keyFingerprint,
            tenancyId: tenancyId,
            userId: authUserId
        });

        request.end();
    }

    // creates a Oracle Cloud Budget in the specified compartment
    function ListBudget(tenantId, callback) {
        
        console.log(tenantId)
        var body = JSON.stringify({
            tenantId: tenancyId,
            timeUsageEnded: "2020-11-30T00:00:00Z",
            timeUsageStarted: "2020-11-01T00:00:00Z",
            granularity: "DAILY",
            //targetType: targetType
        });
    //interns  ocid1.compartment.oc1..aaaaaaaawkau4mp6ft3klgrtvztakeegeri4cntzagrvwiagn6zqudzngpyq
        var options = {
            host: coreServicesDomain,
            path:  '/20200107/usage',
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                //"tenantId" : "ocid1.tenancy.oc1..aaaaaaaauelhqyefacga2w3qsmn3xuhv3iyennmalehr4rtivtmhwrynn7mq"
                //"targetType" : "ALL"    
            }
        };

        var request = https.request(options, handleRequest(callback));

        sign(request, {
            body: body,
            privateKey: privateKey,
            keyFingerprint: keyFingerprint,
            tenancyId: tenancyId,
            userId: authUserId
        });

        request.end(body);
    }

    

      getUser(authUserId, function(data) {
        console.log("GET USER:");    
        console.log(data);

        console.log("\nGetting daily consumption for :" + tenancyId);

        ListBudget(tenancyId, function(data) {

            //console.log(data);
            if (data.items.length == 0){
              console.log("no consumption")
              temp = '{\"groupBy\": \"null\",\"items\": [{\"computedAmount\": 0,\"currency\": \"null\"}]}';
              if(ocid_json.accounts[i].name == "orasesaudi"){
                console.log("getting orasesaudi: zero consumption")
                final_data_orasesaudi = JSON.parse(temp);
              } else if (ocid_json.accounts[i].name == "stcscloud123"){
                console.log("getting stcscloud123: zero consumption")
                final_data_stcscloud123 = JSON.parse(temp);
                console.log(final_data_stcscloud123)
              } else if (ocid_json.accounts[i].name == "mobily"){
                console.log("getting mobily: zero consumption")
                final_data_mobily = JSON.parse(temp);
                console.log(final_data_mobily)
              } else if (ocid_json.accounts[i].name == "tawuniah2019"){
                console.log("getting tawuniah zero consumption")
                final_data_tawuniah = JSON.parse(temp);
                console.log(final_data_tawuniah)
              } else if (ocid_json.accounts[i].name == "mojchatbot"){
                console.log("getting moj zero consumption")
                final_data_moj = JSON.parse(temp);;
                console.log(final_data_moj)
              } else if (ocid_json.accounts[i].name == "qucloud"){
                console.log("getting moj zero consumption")
                final_data_qucloud = JSON.parse(temp);
                console.log(final_data_qucloud)
              } else if (ocid_json.accounts[i].name == "mohalamalhopital"){
                console.log("getting moh zero consumption")
                final_data_moh = JSON.parse(temp);
                console.log(final_data_moh)
              } else if (ocid_json.accounts[i].name == "nhcsa"){
                console.log("getting nhc zero consumption")
                final_data_nhc = JSON.parse(temp);
                console.log(final_data_nhc)
              }

            } else {
              console.log(data);
              if(ocid_json.accounts[i].name == "orasesaudi"){
                console.log("getting orasesaudi daily consumption")
                final_data_orasesaudi = data;
              } else if (ocid_json.accounts[i].name == "stcscloud123"){
                console.log("getting stcscloud123 daily consumption")
                final_data_stcscloud123 = data;
                console.log(final_data_stcscloud123)
              } else if (ocid_json.accounts[i].name == "mobily"){
                console.log("getting mobily daily consumption")
                final_data_mobily = data;
                console.log(final_data_mobily)
              } else if (ocid_json.accounts[i].name == "tawuniah2019"){
                console.log("getting tawuniah daily consumption")
                final_data_tawuniah = data;
                console.log(final_data_tawuniah)
              } else if (ocid_json.accounts[i].name == "mojchatbot"){
                console.log("getting moj daily consumption")
                final_data_moj = data;
                console.log(final_data_moj)
              }  else if (ocid_json.accounts[i].name == "qucloud"){
                console.log("getting qu daily consumption")
                final_data_qucloud = data;
                console.log(final_data_qucloud)
              } else if (ocid_json.accounts[i].name == "mohalamalhopital"){
                console.log("getting moh daily consumption")
                final_data_moh = data;
                console.log(final_data_moh)
              } else if (ocid_json.accounts[i].name == "nhcsa"){
                console.log("getting nhc daily consumption")
                final_data_nhc = data;
                console.log(final_data_nhc)
              }
              //console.log(final_data);
              
            }
            if(i < ocid_json.accounts.length -1 ){
                //console.log(ocid_json.accounts.length);
                //console.log("***i***: " + i);
                i++;    
                run();
            }
            

            
        });
    });

} 

run();
 // end of for loop






app.get("/", (req, res) => {
  res.render("index");
});

app.post("/login", (req, res) => {
  const { name, password } = req.body;

  if (name === "admin" && password === "admin") {
    res.render("success", {
      username: name, ocid_json, final_data_orasesaudi, final_data_stcscloud123, final_data_mobily, final_data_tawuniah, final_data_moj, final_data_qucloud, final_data_moh
    });
  } else {
    res.render("failure");
  }
});

app.get("/repos", async (req, res) => {
  const username = req.query.username || "myogeshchavan97";
  try {
    const result = await axios.get(
      `https://api.github.com/users/${username}/repos`
    );
    const repos = result.data.map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
    }));
    res.render("repos", {
      repos,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send("Error while getting list of repositories");
  }
});

app.listen(3000, () => {
  console.log("server started on port 3000");
});
