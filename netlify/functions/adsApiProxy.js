const axios = require("axios");
const crypto = require("crypto");

exports.handler = async function (event) {
    const keyword = event.queryStringParameters.keyword;
    const targetAdvertiser = "한솔아카데미"; // 특정 광고주 이름

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

        const keywordList = response.data.keywordList;

        if (!keywordList || keywordList.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "No ads found for the given keyword." }),
            };
        }

        // 순위 계산
        let pcRank = -1;
        let mobileRank = -1;

        for (let i = 0; i < keywordList.length; i++) {
            const ad = keywordList[i];

            if (ad.relKeyword.includes(targetAdvertiser)) {
                if (ad.device === "PC") {
                    pcRank = i + 1; // 순위는 1부터 시작
                } else if (ad.device === "MOBILE") {
                    mobileRank = i + 1;
                }
            }
        }

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // CORS 해결
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            },
            body: JSON.stringify({
                keyword,
                targetAdvertiser,
                pcRank: pcRank > 0 ? pcRank : "Not found",
                mobileRank: mobileRank > 0 ? mobileRank : "Not found",
            }),
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
