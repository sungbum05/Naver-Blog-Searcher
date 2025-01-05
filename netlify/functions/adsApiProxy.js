const axios = require("axios");
const crypto = require("crypto");

exports.handler = async function (event) {
    const keyword = event.queryStringParameters.keyword; // 쿼리 파라미터로 키워드 받기
    const targetAdvertiser = "한솔아카데미"; // 광고주 이름 설정

    if (!keyword) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameter: keyword" }),
        };
    }

    try {
        // 네이버 광고 API 인증 정보
        const API_KEY = "0100000000d39787e7a99b1ea7aedd90a41e5a137c2f299c3f0c3c3b9edc72532b5f729a5d"; // 네이버 광고 API 엑세스 키
        const SECRET_KEY = "AQAAAADTl4fnqZsep67dkKQeWhN8+IbWG5dNUnuKq4oK61RJVQ=="; // 네이버 광고 API 비밀 키
        const CUSTOMER_ID = "3363318"; // 네이버 광고 API 고객 ID

        // 네이버 광고 API 요청 설정
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
            params: { keyword }, // 키워드 전달
        });

        // 광고 데이터 처리
        const ads = response.data;
        let pcRank = -1;
        let mobileRank = -1;

        // 광고 순위 계산
        ads.forEach((ad, index) => {
            if (ad.advertiserName === targetAdvertiser) {
                if (ad.device === "PC") pcRank = index + 1;
                if (ad.device === "MOBILE") mobileRank = index + 1;
            }
        });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // CORS 해결
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // 허용 메서드
            },

            //출력 데이터
            body: JSON.stringify({
                keyword,
                targetAdvertiser,
                pcRank: pcRank > 0 ? pcRank : "Not found",
                mobileRank: mobileRank > 0 ? mobileRank : "Not found",
            }),
        };
    } catch (error) {
        return {
            statusCode: error.response?.status || 500,
            headers: {
                "Access-Control-Allow-Origin": "*", // CORS 해결
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
