// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include "gtest/gtest.h"
#include "jwt_verify_lib/verify.h"
#include "src/test_common.h"

namespace google {
namespace jwt_verify {
namespace {

// JWT with
// Header:  {"alg":"RS256","typ":"JWT"}
// Payload:
// {"iss":"https://example.com","sub":"test@example.com","exp":1501281058}
const std::string JwtPemRs256 =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidGVzdEBleGFtcGxlLmNvbSIs"
    "ImV4cCI6MTUwMTI4MTA1OH0.FxT92eaBr9thDpeWaQh0YFhblVggn86DBpnTa_"
    "DVO4mNoGEkdpuhYq3epHPAs9EluuxdSkDJ3fCoI758ggGDw8GbqyJAcOsH10fBOrQbB7EFRB"
    "CI1xz6-6GEUac5PxyDnwy3liwC_"
    "gK6p4yqOD13EuEY5aoYkeM382tDFiz5Jkh8kKbqKT7h0bhIimniXLDz6iABeNBFouczdPf04"
    "N09hdvlCtAF87Fu1qqfwEQ93A-J7m08bZJoyIPcNmTcYGHwfMR4-lcI5cC_93C_"
    "5BGE1FHPLOHpNghLuM6-rhOtgwZc9ywupn_bBK3QzuAoDnYwpqQhgQL_CdUD_bSHcmWFkw";

// JWT with
// Header:  {"alg":"RS384","typ":"JWT"}
// Payload:
// {"iss":"https://example.com","sub":"test@example.com","exp":1501281058}
const std::string JwtPemRs384 =
    "eyJhbGciOiJSUzM4NCIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidGVzdEBleGFtcGxlLmNvbSIs"
    "ImV4cCI6MTUwMTI4MTA1OH0.NvinWcCVmBAmbK5FnAPt8gMBSWOU9kjTEIxcDqJBzjB6nKGj"
    "sUYF05RC69F4POrJKLl3ak9LQUFPAwn732xEavbQunl-MreZCtRKrTX2xdwod0_u3gvSakcc"
    "N9kEkbXMqJ5DhFUH0Viv7oVQtbRzwB7hr0ip-Yi8RAbrKfk8qDX0bT2TOlqzbLDnIp3M5btX"
    "vO1GfOirIiz0YDfzEmSbkhZAnz4D062LWwyfIfM1ZhFusSyYBaNjib1vBfjIGsiYW-ot9dRY"
    "X0YZP1YF-XxalyUGalD6pn-5nOkd86KL8ch0OkxBpHc1XqBrrsw0Pjax6Sv-nYYUb9qN6p69"
    "q9YstA";

// JWT with
// Header:  {"alg":"RS512","typ":"JWT"}
// Payload:
// {"iss":"https://example.com","sub":"test@example.com","exp":1501281058}
const std::string JwtPemRs512 =
    "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidGVzdEBleGFtcGxlLmNvbSIs"
    "ImV4cCI6MTUwMTI4MTA1OH0.BaBGWBS5ZhOX7o0LlAYqnnS-rME0E_eAjnCzPolSY5oh-Mic"
    "WFN3B1AW-iCeAW3fHf7GhlbshKoybLaj7Cj87m9T-w015WGyIBIwWKQVjfT62RJ1hrKzoyM5"
    "flVbwMPG70vqV9xfOTpZ4iZ9QomAut4yMDSBTINeeQLRVckYUN-IQVLU-bMnnvabsIQeNxhs"
    "sG6S61cOD234mGdgkxoaZhHDprvEtAaYAuuKsIlaNIbp8r5hYFv09SMjAELlneObiMI3m5IG"
    "yx3cF3odgb8PPLRBEOxD6HwJzmvbYmkjmgLuE5vb5lLEacyn2I1ko7e-Hlzvp_ezST0wknz5"
    "wadrCQ";

const std::string PublicKeyPem =
    "MIIBCgKCAQEAtw7MNxUTxmzWROCD5BqJxmzT7xqc9KsnAjbXCoqEEHDx4WBlfcwk"
    "XHt9e/2+Uwi3Arz3FOMNKwGGlbr7clBY3utsjUs8BTF0kO/poAmSTdSuGeh2mSbc"
    "VHvmQ7X/kichWwx5Qj0Xj4REU3Gixu1gQIr3GATPAIULo5lj/ebOGAa+l0wIG80N"
    "zz1pBtTIUx68xs5ZGe7cIJ7E8n4pMX10eeuh36h+aossePeuHulYmjr4N0/1jG7a"
    "+hHYL6nqwOR3ej0VqCTLS0OloC0LuCpLV7CnSpwbp2Qg/c+MDzQ0TH8g8drIzR5h"
    "Fe9a3NlNRMXgUU5RqbLnR9zfXr7b9oEszQIDAQAB";

TEST(VerifyPemTestRs256, OKPem) {
  Jwt jwt;
  EXPECT_EQ(jwt.parseFromString(JwtPemRs256), Status::Ok);

  auto jwks = Jwks::createFrom(PublicKeyPem, Jwks::Type::PEM);
  EXPECT_EQ(jwks->getStatus(), Status::Ok);

  EXPECT_EQ(verifyJwt(jwt, *jwks, 1), Status::Ok);

  fuzzJwtSignature(jwt, [&jwks](const Jwt& jwt) {
    EXPECT_EQ(verifyJwt(jwt, *jwks, 1), Status::JwtVerificationFail);
  });
}

TEST(VerifyPemTestRs384, OKPem) {
  Jwt jwt;
  EXPECT_EQ(jwt.parseFromString(JwtPemRs384), Status::Ok);

  auto jwks = Jwks::createFrom(PublicKeyPem, Jwks::Type::PEM);
  EXPECT_EQ(jwks->getStatus(), Status::Ok);

  EXPECT_EQ(verifyJwt(jwt, *jwks, 1), Status::Ok);

  fuzzJwtSignature(jwt, [&jwks](const Jwt& jwt) {
    EXPECT_EQ(verifyJwt(jwt, *jwks, 1), Status::JwtVerificationFail);
  });
}

TEST(VerifyPemTestRs512, OKPem) {
  Jwt jwt;
  EXPECT_EQ(jwt.parseFromString(JwtPemRs512), Status::Ok);

  auto jwks = Jwks::createFrom(PublicKeyPem, Jwks::Type::PEM);
  EXPECT_EQ(jwks->getStatus(), Status::Ok);

  EXPECT_EQ(verifyJwt(jwt, *jwks, 1), Status::Ok);

  fuzzJwtSignature(jwt, [&jwks](const Jwt& jwt) {
    EXPECT_EQ(verifyJwt(jwt, *jwks, 1), Status::JwtVerificationFail);
  });
}

}  // namespace
}  // namespace jwt_verify
}  // namespace google
