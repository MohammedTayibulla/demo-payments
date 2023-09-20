// routes/payment.js
const express = require("express");
const router = express.Router();
const request = require("request-promise");
const crypto = require("crypto");

const fs = require("fs");

// Read the contents of the "payment_form.html" file
const paymentFormFile = fs.readFileSync("views/payment_form.html", "utf8");

const successFile = fs.readFileSync("views/success.html", "utf8");

router.get("/", function (req, res, next) {
  
  res.send(paymentFormFile);
});

router.post("/initiate_payment", async (req, res) => {
  try {
    const amount = parseInt(req.body.amount) * 100;

    payloadData = {
      merchantId: "PGTESTPAYUAT101",
      merchantTransactionId: "MT78505900681881041",
      merchantUserId: "MUI123",
      amount: amount,
      redirectUrl: "https://www.google.com/",
      redirectMode: "POST",
      callbackUrl: "https://in.yahoo.com",
      mobileNumber: "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    const encodedPayload = Buffer.from(JSON.stringify(payloadData)).toString(
      "base64"
    );
    const saltKey = "4c1eba6b-c8a8-44d3-9f8b-fe6402f037f3";
    const saltIndex = 1;
    const string = `${encodedPayload}/pg/v1/pay${saltKey}`;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const finalXHeader = `${sha256}###${saltIndex}`;

    const headers = {
      "Content-Type": "application/json",
      "X-VERIFY": finalXHeader,
    };

    const phonePayUrl =
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
    const response = await request.post({
      uri: phonePayUrl,
      body: JSON.stringify({ request: encodedPayload }),
      headers: headers,
    });
    console.log("response=>", response);
    const responseData = JSON.parse(response);
    console.log("responseData=>", responseData);
    if (responseData.success === true) {
      const url = responseData.data.instrumentResponse.redirectInfo.url;
      console.log("redirect_url=>", url);
      // res.sendFile("success.html", { root: "views" });
      try {
        // Redirect to the external URL
        res.redirect(url);
      } catch (error) {
        console.error("Error while redirecting:", error);
        // Handle the error and provide a fallback action (e.g., show an error page)
        res.status(500).send("Internal Server Error");
      }
    } else {
      // Payment initiation failed, redirect to failed.html with a query parameter
      return res.redirect("/payment/failed?status=failed");
    }
  } catch (error) {
    const error_message = `An error occurred: ${error.message}`;
    return res.status(500).send(error_message);
  }
});

// Handle payment success
router.get("/success", function (req, res) {
  res.sendFile("success.html", { root: "views" });
});

// Handle payment failure
router.get("/failed", function (req, res) {
  const status = req.query.status;
  if (status === "failed") {
    // You can customize the message or content for failed payments
    res.sendFile("failed.html", { root: "views" });
  } else {
    res.status(404).send("Page not found");
  }
});

module.exports = router;