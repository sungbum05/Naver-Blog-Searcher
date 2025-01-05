const axios = require("axios");
const crypto = require("crypto");

exports.handler = async function (event) {
    const keyword = event.queryStringParameters.keyword;

    if (!keyword) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameter: keyword" }),
        };
    }

    try {
        const API_KEY = "0100000000d39787e7a99b1ea7aedd90a41e5a137c2f299c3f0c3c3b9edc72532b5f729a5d";
        const SECRET_KEY = "AQAAAADTl4fnqZsep67dkKQeWhN8+IbWG5dNUnuKq4oK61RJVQ==";
        const CUSTOMER_ID = "3363318";

        const API_URL = "https://api.naver.com/ncc/keywords";
        const timestamp = Date.now().toString();
        const signature = crypto
            .createHmac("sha256", SECRET_KEY)
            .update(`${timestamp}.${API_KEY}`)
            .digest("base64");

        const response = await axios.get(API_URL, {
            headers: {
                "X-Timestamp": timestamp,
                "X-API-KEY": API_KEY,
                "X-Customer": CUSTOMER_ID,
                "X-Signature": signature,
            },
            params: { keyword },
        });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            },
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message || "Internal Server Error";

        console.error(`Error: ${statusCode} - ${errorMessage}`);

        // 403 에러 처리
        if (statusCode === 403) {
            return {
                statusCode: 403,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({
                    error: "Forbidden: Access to the Naver Ads API is denied. Please check your API credentials or permissions.",
                }),
            };
        }

        return {
            statusCode,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: errorMessage }),
        };
    }
};
