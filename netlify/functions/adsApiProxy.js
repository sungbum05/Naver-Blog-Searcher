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
        const BASE_URL = "https://api.searchad.naver.com";
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

        // API 응답 데이터
        const keywordList = response.data.keywordList;

        if (!keywordList || keywordList.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "No ads found for the given keyword." }),
            };
        }

        // 광고주 정보 추가 (광고주 이름을 예시로 추가)
        const enrichedKeywordList = await Promise.all(
            keywordList.map(async (item) => {
                // 광고주 이름 및 기타 정보 추가 (예제에서는 광고주 이름만 추가)
                const advertiserInfo = await getAdvertiserInfo(item.relKeyword, headers);
                return {
                    ...item,
                    advertiserName: advertiserInfo.name || "Unknown",
                    advertiserId: advertiserInfo.id || "Unknown",
                };
            })
        );

        // 순위 계산
        let pcRank = -1;
        let mobileRank = -1;

        for (let i = 0; i < enrichedKeywordList.length; i++) {
            const ad = enrichedKeywordList[i];

            if (ad.advertiserName === targetAdvertiser) {
                if (ad.device === "PC") {
                    pcRank = i + 1; // 순위는 1부터 시작
                } else if (ad.device === "MOBILE") {
                    mobileRank = i + 1;
                }
            }
        }

        // 최종 응답 반환
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
                enrichedKeywordList, // 광고주 정보가 포함된 전체 리스트
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

// 광고주 정보 가져오기 함수
async function getAdvertiserInfo(keyword, headers) {
    try {
        const API_URL = "https://api.searchad.naver.com/ncc/ads"; // 광고주 정보를 가져올 수 있는 엔드포인트
        const response = await axios.get(API_URL, { headers, params: { keyword } });

        // 광고주 정보를 가정한 구조로 반환
        return {
            name: response.data.advertiserName || "Unknown",
            id: response.data.advertiserId || "Unknown",
        };
    } catch (error) {
        console.error("Error fetching advertiser info:", error.response?.data || error.message);
        return { name: "Unknown", id: "Unknown" };
    }
}