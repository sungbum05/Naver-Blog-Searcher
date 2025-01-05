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
        // 네이버 광고 API 정보
        const BASE_URL = "https://api.naver.com";
        const API_KEY = "01000000006ca386a83e9d78486a21b99ee87d2b57d4609fa9f85cbc8dc9a589d5e601e947"; // 네이버 광고 API 엑세스 키
        const SECRET_KEY = "AQAAAAD74Ks1eDf56l4c8lsqI6sywkBK3BbEAgyZ/URGM9qKAA=="; // 네이버 광고 API 비밀 키
        const CUSTOMER_ID = "3363318"; // 네이버 광고 API 고객 ID

        // API 요청 설정
        const uri = "/keywordstool";
        const method = "GET";
        const timestamp = Date.now().toString();
        const signature = crypto
            .createHmac("sha256", SECRET_KEY)
            .update(`${timestamp}.${method}.${uri}`)
            .digest("base64");

        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
            "X-Timestamp": timestamp,
            "X-API-KEY": API_KEY,
            "X-Customer": CUSTOMER_ID,
            "X-Signature": signature,
        };

        const params = {
            hintKeywords: keyword,
            showDetail: 1,
        };

        // 네이버 광고 API 호출
        const response = await axios.get(BASE_URL + uri, { headers, params });

        // 응답 데이터 반환
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // CORS 해결
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            },
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);

        return {
            statusCode: error.response?.status || 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: error.response?.data || error.message || "Internal Server Error",
            }),
        };
    }
};
