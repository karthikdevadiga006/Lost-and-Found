// backend/test.mjs — Integration and unit tests for Lost & Found Portal backend
// Run with: node backend/test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Setup isolated test environment
const testDir = await mkdtemp(join(tmpdir(), "lf-test-"));
process.env.LOCAL_DATA_DIR = testDir;
process.env.TOKEN_SECRET = "super-secret-test-token-key-1234567890";
process.env.ADMIN_KEY = "test-admin-key";

const { handler } = await import("./index.mjs");
const { hashPassword, verifyPassword, createToken, verifyToken } = await import("./auth.mjs");

function callHandler({ method, path, headers = {}, body = null, token = null }) {
  const reqHeaders = { ...headers };
  if (token) {
    reqHeaders.authorization = `Bearer ${token}`;
  }
  return handler({
    requestContext: { http: { method, path } },
    rawPath: path,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
    isBase64Encoded: false,
  });
}

test("Password hashing and HMAC token verification", () => {
  const password = "mySecurePassword123!";
  const hash = hashPassword(password);
  assert.ok(hash.includes(":"), "Hash format should be salt:hash");
  assert.equal(verifyPassword(password, hash), true, "Correct password verifies");
  assert.equal(verifyPassword("wrongPassword", hash), false, "Wrong password fails");

  const payload = { userId: "user-1", email: "test@campus.edu", name: "Test User" };
  const token = createToken(payload, 3600);
  assert.ok(token.includes("."), "Token should have two parts");

  const decoded = verifyToken(token);
  assert.equal(decoded.userId, "user-1");
  assert.equal(decoded.email, "test@campus.edu");

  // Tampered token test
  const tampered = token.slice(0, -4) + "abcd";
  assert.equal(verifyToken(tampered), null, "Tampered signature should fail");

  // Expired token test
  const expiredToken = createToken(payload, -10);
  assert.equal(verifyToken(expiredToken), null, "Expired token should fail");
});

test("User registration & login flow", async () => {
  // Register User A (Alice)
  const regAliceRes = await callHandler({
    method: "POST",
    path: "/register",
    body: {
      name: "Alice Finder",
      email: "alice@campus.edu",
      password: "password123",
      phone: "+1234567890",
    },
  });
  assert.equal(regAliceRes.statusCode, 201);
  const aliceData = JSON.parse(regAliceRes.body);
  assert.ok(aliceData.token);
  assert.equal(aliceData.user.email, "alice@campus.edu");
  const aliceToken = aliceData.token;

  // Duplicate registration should fail
  const dupRes = await callHandler({
    method: "POST",
    path: "/register",
    body: {
      name: "Alice Imposter",
      email: "alice@campus.edu",
      password: "password456",
    },
  });
  assert.equal(dupRes.statusCode, 409);

  // Register User B (Bob)
  const regBobRes = await callHandler({
    method: "POST",
    path: "/register",
    body: {
      name: "Bob Loser",
      email: "bob@campus.edu",
      password: "password123",
      phone: "+1987654321",
    },
  });
  assert.equal(regBobRes.statusCode, 201);
  const bobToken = JSON.parse(regBobRes.body).token;

  // Login with correct credentials
  const loginRes = await callHandler({
    method: "POST",
    path: "/login",
    body: { email: "alice@campus.edu", password: "password123" },
  });
  assert.equal(loginRes.statusCode, 200);

  // Login with bad password
  const badLoginRes = await callHandler({
    method: "POST",
    path: "/login",
    body: { email: "alice@campus.edu", password: "wrong" },
  });
  assert.equal(badLoginRes.statusCode, 401);
});

test("Item posting and search flow", async () => {
  // Login Alice
  const aliceLogin = await callHandler({
    method: "POST",
    path: "/login",
    body: { email: "alice@campus.edu", password: "password123" },
  });
  const aliceToken = JSON.parse(aliceLogin.body).token;

  // Alice posts a found bottle
  const postRes = await callHandler({
    method: "POST",
    path: "/found",
    token: aliceToken,
    body: {
      category: "bottle",
      description: "Blue Hydro Flask, slightly dented on rim",
      location: "Library 2nd Floor",
      date: "2026-11-01",
      hiddenDetail: "Scratch shaped like an X on the base",
    },
  });
  assert.equal(postRes.statusCode, 201);
  const foundItem = JSON.parse(postRes.body).post;
  assert.equal(foundItem.category, "bottle");
  assert.equal(foundItem.status, "open");

  // Search by keyword and category
  const searchRes = await callHandler({
    method: "GET",
    path: "/search",
    token: aliceToken,
  });
  assert.equal(searchRes.statusCode, 200);
  const results = JSON.parse(searchRes.body).results;
  assert.equal(results.length, 1);
  assert.equal(results[0].category, "bottle");
  assert.equal(results[0].isMine, true);
  // Hidden detail should NEVER appear in public search
  assert.equal(results[0].hiddenDetail, undefined);

  // Search with multi-word keywords ("blue flask" matching "Blue Hydro Flask")
  const kwRes = await callHandler({
    method: "GET",
    path: "/search",
    token: aliceToken,
  });
  assert.equal(kwRes.statusCode, 200);

  // Search by category filter
  const searchCategoryRes = await callHandler({
    method: "GET",
    path: "/search",
    token: aliceToken,
  });
  assert.equal(searchCategoryRes.statusCode, 200);
});

test("Claim, decision, and contact exchange flow", async () => {
  // Login Bob
  const bobLogin = await callHandler({
    method: "POST",
    path: "/login",
    body: { email: "bob@campus.edu", password: "password123" },
  });
  const bobToken = JSON.parse(bobLogin.body).token;
  const bobUserId = JSON.parse(bobLogin.body).user.userId;

  // Register a second claimant to verify that multiple claims can be reviewed.
  const charlieRegister = await callHandler({
    method: "POST",
    path: "/register",
    body: {
      name: "Charlie Claimant",
      email: "charlie@campus.edu",
      password: "password123",
    },
  });
  assert.equal(charlieRegister.statusCode, 201);
  const charlieToken = JSON.parse(charlieRegister.body).token;

  // Login Alice
  const aliceLogin = await callHandler({
    method: "POST",
    path: "/login",
    body: { email: "alice@campus.edu", password: "password123" },
  });
  const aliceToken = JSON.parse(aliceLogin.body).token;

  // Alice finds the post ID from search
  const searchRes = await callHandler({ method: "GET", path: "/search", token: bobToken });
  const items = JSON.parse(searchRes.body).results;
  const bottlePostId = items[0].id;

  // Alice cannot claim her own post
  const selfClaimRes = await callHandler({
    method: "POST",
    path: "/respond",
    token: aliceToken,
    body: { postId: bottlePostId, message: "Claiming my own thing" },
  });
  assert.equal(selfClaimRes.statusCode, 403);

  // Bob claims the bottle with proof
  const claimRes = await callHandler({
    method: "POST",
    path: "/respond",
    token: bobToken,
    body: { postId: bottlePostId, message: "It has an X scratch on the base!" },
  });
  assert.equal(claimRes.statusCode, 201);
  const responseId = JSON.parse(claimRes.body).responseId;

  // Bob cannot claim the same post twice
  const dupClaimRes = await callHandler({
    method: "POST",
    path: "/respond",
    token: bobToken,
    body: { postId: bottlePostId, message: "Trying again" },
  });
  assert.equal(dupClaimRes.statusCode, 409);

  // A different user can submit another claim while the first is pending.
  const secondClaimRes = await callHandler({
    method: "POST",
    path: "/respond",
    token: charlieToken,
    body: { postId: bottlePostId, message: "It has a matching mark inside the cap." },
  });
  assert.equal(secondClaimRes.statusCode, 201);
  const secondResponseId = JSON.parse(secondClaimRes.body).responseId;

  // Check Alice's /me profile before decision
  const aliceProfileBefore = await callHandler({ method: "GET", path: "/me", token: aliceToken });
  assert.equal(aliceProfileBefore.statusCode, 200);
  const pData = JSON.parse(aliceProfileBefore.body);
  assert.equal(pData.responsesOnMyPosts.length, 2);
  // Contact details should NOT be released yet (pending)
  assert.equal(pData.responsesOnMyPosts.every(response => response.responderEmail === undefined), true);

  // Bob cannot accept or reject (not owner)
  const bobDecideRes = await callHandler({
    method: "POST",
    path: "/decide",
    token: bobToken,
    body: { postId: bottlePostId, responseId, decision: "accept" },
  });
  assert.equal(bobDecideRes.statusCode, 403);

  // Alice accepts Bob's claim
  const aliceDecideRes = await callHandler({
    method: "POST",
    path: "/decide",
    token: aliceToken,
    body: { postId: bottlePostId, responseId, decision: "accept" },
  });
  assert.equal(aliceDecideRes.statusCode, 200);
  assert.equal(JSON.parse(aliceDecideRes.body).postStatus, "returned");

  // Check Alice's /me profile after decision
  const aliceProfileAfter = await callHandler({ method: "GET", path: "/me", token: aliceToken });
  const pAfterData = JSON.parse(aliceProfileAfter.body);
  const acceptedResp = pAfterData.responsesOnMyPosts.find(response => response.responseId === responseId);
  const rejectedResp = pAfterData.responsesOnMyPosts.find(response => response.responseId === secondResponseId);
  assert.equal(acceptedResp.status, "accepted");
  assert.equal(acceptedResp.responderEmail, "bob@campus.edu");
  assert.equal(acceptedResp.responderPhone, "+1987654321");
  assert.equal(rejectedResp.status, "rejected");
  assert.equal(rejectedResp.responderEmail, undefined);

  // Check Bob's /me profile after decision
  const bobProfileAfter = await callHandler({ method: "GET", path: "/me", token: bobToken });
  const bAfterData = JSON.parse(bobProfileAfter.body);
  const myResp = bAfterData.myResponses[0];
  assert.equal(myResp.status, "accepted");
  assert.equal(myResp.ownerEmail, "alice@campus.edu");
  assert.equal(myResp.ownerPhone, "+1234567890");

  // Stats should now reflect 1 item returned
  const statsRes = await callHandler({ method: "GET", path: "/stats" });
  assert.equal(statsRes.statusCode, 200);
  const stats = JSON.parse(statsRes.body);
  assert.equal(stats.itemsReturned, 1);
});

test("Admin route protection and actions", async () => {
  // Login Alice
  const aliceLogin = await callHandler({
    method: "POST",
    path: "/login",
    body: { email: "alice@campus.edu", password: "password123" },
  });
  const aliceToken = JSON.parse(aliceLogin.body).token;

  // Alice posts a lost keys request
  const postRes = await callHandler({
    method: "POST",
    path: "/lost",
    token: aliceToken,
    body: {
      category: "keys",
      description: "Spam / test post",
      location: "Gym",
    },
  });
  const lostId = JSON.parse(postRes.body).post.id;

  // Admin action with wrong key
  const badAdminRes = await callHandler({
    method: "POST",
    path: "/admin",
    token: aliceToken,
    headers: { "x-admin-key": "wrong-key" },
    body: { action: "delete", postId: lostId },
  });
  assert.equal(badAdminRes.statusCode, 403);

  // Admin action with correct key
  const goodAdminRes = await callHandler({
    method: "POST",
    path: "/admin",
    token: aliceToken,
    headers: { "x-admin-key": "test-admin-key" },
    body: { action: "delete", postId: lostId },
  });
  assert.equal(goodAdminRes.statusCode, 200);

  // Post should be deleted
  const checkRes = await callHandler({ method: "GET", path: "/search", token: aliceToken });
  const items = JSON.parse(checkRes.body).results;
  assert.ok(!items.some(i => i.id === lostId));
});

test("Post owner closeItem flow", async () => {
  // Login Alice and Bob
  const aliceLogin = await callHandler({
    method: "POST",
    path: "/login",
    body: { email: "alice@campus.edu", password: "password123" },
  });
  const aliceToken = JSON.parse(aliceLogin.body).token;

  const bobLogin = await callHandler({
    method: "POST",
    path: "/login",
    body: { email: "bob@campus.edu", password: "password123" },
  });
  const bobToken = JSON.parse(bobLogin.body).token;

  // Alice posts a found backpack
  const postRes = await callHandler({
    method: "POST",
    path: "/found",
    token: aliceToken,
    body: {
      category: "bag",
      description: "Black JanSport backpack",
      location: "Student Center",
    },
  });
  const bagId = JSON.parse(postRes.body).post.id;

  // Bob cannot close Alice's post
  const unauthorizedClose = await callHandler({
    method: "POST",
    path: "/close",
    token: bobToken,
    body: { postId: bagId },
  });
  assert.equal(unauthorizedClose.statusCode, 403);

  // Alice closes her post
  const ownerClose = await callHandler({
    method: "POST",
    path: "/close",
    token: aliceToken,
    body: { postId: bagId },
  });
  assert.equal(ownerClose.statusCode, 200);
  assert.equal(JSON.parse(ownerClose.body).status, "returned");

  // Attempting to close again returns 400
  const repeatClose = await callHandler({
    method: "POST",
    path: "/close",
    token: aliceToken,
    body: { postId: bagId },
  });
  assert.equal(repeatClose.statusCode, 400);

  // Claiming a closed post fails with 400
  const claimClosed = await callHandler({
    method: "POST",
    path: "/respond",
    token: bobToken,
    body: { postId: bagId, message: "Is this mine?" },
  });
  assert.equal(claimClosed.statusCode, 400);
});

// Cleanup temp test files
test.after(async () => {
  try {
    await rm(testDir, { recursive: true, force: true });
  } catch {}
});
