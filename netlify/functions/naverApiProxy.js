const axios = require("axios");

exports.handler = async function (event) {
    const query = event.queryStringParameters.query; // 쿼리 파라미터 받아오기

    try {
        const response = await axios.get("https://openapi.naver.com/v1/search/blog.json", {
            params: { query, display: 999 },
            headers: {
                "X-Naver-Client-Id": "t3MUgXzLzdqC41kUfxHW", // 네이버 API 클라이언트 ID
                "X-Naver-Client-Secret": "vrOnBQoquC", // 네이버 API 클라이언트 시크릿
            },
        });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // CORS 해결
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // 허용 메서드
            },
            body: JSON.stringify(response.data), // API 응답 전달
        };
    } catch (error) {
        return {
            statusCode: error.response?.status || 500,
            headers: {
                "Access-Control-Allow-Origin": "*", // CORS 허용
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};