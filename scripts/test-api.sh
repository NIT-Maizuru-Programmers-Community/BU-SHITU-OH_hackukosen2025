#!/bin/bash

# 部室王 API テストスクリプト
# 使い方: ./scripts/test-api.sh

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 環境変数の読み込み
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

BASE_URL="http://localhost:3000"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}部室王 API テスト${NC}"
echo -e "${BLUE}======================================${NC}\n"

# テスト関数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local headers=$4
    local data=$5
    
    echo -e "${YELLOW}テスト: ${name}${NC}"
    echo -e "エンドポイント: ${method} ${endpoint}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${BASE_URL}${endpoint}" ${headers})
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${BASE_URL}${endpoint}" ${headers} -d "${data}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ 成功 (HTTP $http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ 失敗 (HTTP $http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    fi
    echo ""
}

# 1. 認証不要のエンドポイントテスト
echo -e "${BLUE}=== 認証不要のエンドポイント ===${NC}\n"

test_api "ランキング取得" "GET" "/api/ranking"

test_api "在室者一覧取得" "GET" "/api/attendance/current"

test_api "本日のレース情報取得" "GET" "/api/race/today"

# 2. ハードウェア認証が必要なエンドポイント
if [ -n "$HARDWARE_API_KEY" ]; then
    echo -e "${BLUE}=== ハードウェア認証が必要なエンドポイント ===${NC}\n"
    
    HEADERS="-H 'X-API-Key: ${HARDWARE_API_KEY}' -H 'Content-Type: application/json'"
    
    # テスト用のユーザーIDを設定（実際のユーザーIDに置き換えてください）
    TEST_USER_ID="${TEST_USER_ID:-test_user_id}"
    
    test_api "NFCカード登録" "POST" "/api/auth/register-nfc" \
        "${HEADERS}" \
        '{"nfcCardId":"TEST_CARD_001","userId":"'${TEST_USER_ID}'"}'
    
    test_api "NFCログイン" "POST" "/api/auth/nfc-login" \
        "${HEADERS}" \
        '{"nfcCardId":"TEST_CARD_001"}'
    
    test_api "ポイント付与" "POST" "/api/points/award" \
        "${HEADERS}" \
        '{"userId":"'${TEST_USER_ID}'","amount":50,"type":"manual","description":"テストポイント"}'
    
    test_api "ポイント残高取得" "GET" "/api/points/balance?userId=${TEST_USER_ID}" \
        "${HEADERS}"
    
    test_api "チェックイン" "POST" "/api/attendance/check-in" \
        "${HEADERS}" \
        '{"userId":"'${TEST_USER_ID}'"}'
else
    echo -e "${YELLOW}⚠ HARDWARE_API_KEY が設定されていないため、ハードウェア認証のテストをスキップします${NC}\n"
fi

# 3. エラーケースのテスト
echo -e "${BLUE}=== エラーケースのテスト ===${NC}\n"

test_api "無効なAPI Key" "POST" "/api/auth/nfc-login" \
    "-H 'X-API-Key: invalid-key' -H 'Content-Type: application/json'" \
    '{"nfcCardId":"TEST"}'

test_api "存在しないNFCカード" "POST" "/api/auth/nfc-login" \
    "-H 'X-API-Key: ${HARDWARE_API_KEY}' -H 'Content-Type: application/json'" \
    '{"nfcCardId":"NONEXISTENT_CARD_XYZ"}'

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}テスト完了${NC}"
echo -e "${BLUE}======================================${NC}"


