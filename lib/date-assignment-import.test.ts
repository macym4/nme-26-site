import assert from "node:assert/strict";
import test from "node:test";
import { parsePairings, movePairing } from "./date-assignment-import";

test("imports all pairing columns and ignores Markdown headers and empty rows", () => {
  const pairs = parsePairings(`| **PC 26** | **Pairing #1** | **Pairing #2** | **Pairing #3** |
| --- | --- | --- | --- |
| **Addison Yurchak** | Parker Yates | Divya Krishna | Kiara Figueras |
| **Andrea Cummings** | Julia Cherchever | Jadyn Grant | |
| | | | <br>these are the dates |`);
  assert.equal(pairs.length, 5);
  assert.deepEqual(pairs.slice(0, 3).map((pair) => pair.two), ["Parker Yates", "Divya Krishna", "Kiara Figueras"]);
  assert.equal(pairs[4].one, "Andrea Cummings");
});

test("preserves blank columns and supports spreadsheet and quoted CSV rows", () => {
  assert.equal(parsePairings("PC 26\tPairing #1\tPairing #2\nAddison\t\tDivya")[0].two, "Divya");
  assert.equal(parsePairings('\tParker\tDivya').length, 0);
  assert.equal(parsePairings('"Surname, First",Partner')[0].one, "Surname, First");
});

test("moves cards in both directions without losing pairs or accepting stale IDs", () => {
  const pairs = parsePairings("Addison,Parker,Divya,Kiara");
  const moved = movePairing(pairs, pairs[0].id, pairs[2].id);
  assert.deepEqual(moved.map((pair) => pair.two), ["Divya", "Kiara", "Parker"]);
  assert.deepEqual(movePairing(moved, pairs[0].id, pairs[1].id), pairs);
  assert.equal(movePairing(pairs, "missing", pairs[0].id), pairs);
  assert.equal(pairs[0].two, "Parker");
});
