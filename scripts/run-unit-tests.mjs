import assert from "node:assert/strict";
import {
  canTransitionOrderStatus,
  canTransitionTaskStatus,
  createFamilyCode,
  createAuthEmailFromUsername,
  formatOrderingWindow,
  getUsernameFromAuthEmail,
  getInvitationStatusLabel,
  isValidUsername,
  normalizeEmail
} from "../packages/lib/src/index.ts";

const results = [];

function run(name, fn) {
  fn();
  results.push(name);
}

run("normalizeEmail trims and lowercases", () => {
  assert.equal(normalizeEmail("  FAMILY@Example.com "), "family@example.com");
});

run("username auth helpers map public usernames to internal emails", () => {
  assert.equal(isValidUsername("owner_01"), true);
  assert.equal(isValidUsername("bad user"), false);
  assert.equal(createAuthEmailFromUsername(" Owner_01 "), "owner_01@users.night-food.local");
  assert.equal(getUsernameFromAuthEmail("owner_01@users.night-food.local"), "owner_01");
});

run("family codes use the household-safe alphabet", () => {
  const code = createFamilyCode(12);
  assert.equal(code.length, 12);
  assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
});

run("formatOrderingWindow returns all-day fallback", () => {
  assert.equal(formatOrderingWindow(undefined, undefined), "全天可点");
});

run("formatOrderingWindow returns explicit range", () => {
  assert.equal(formatOrderingWindow("09:00", "21:30"), "09:00 - 21:30");
});

run("order transitions follow the designed state machine", () => {
  assert.equal(canTransitionOrderStatus("submitted", "confirmed"), true);
  assert.equal(canTransitionOrderStatus("completed", "cancelled"), false);
});

run("task transitions follow the designed state machine", () => {
  assert.equal(canTransitionTaskStatus("cancelled", "open"), true);
  assert.equal(canTransitionTaskStatus("completed", "open"), false);
});

run("invitation labels are user-friendly", () => {
  assert.equal(getInvitationStatusLabel("pending"), "待接受");
  assert.equal(getInvitationStatusLabel("revoked"), "已撤销");
});

console.log(`Passed ${results.length} unit checks.`);
