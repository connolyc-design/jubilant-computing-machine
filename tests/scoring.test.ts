import { describe, it, expect } from "vitest";
import {
  scorePrediction,
  normaliseResult,
  computeStandings,
  memberTotal,
  isValidCode,
  NOT_PLAYED_PLACEHOLDER,
  type ScoringMatch,
  type ScoringMember,
  type ScoringPrediction,
} from "../src/lib/scoring";

describe("isValidCode", () => {
  it("accepts only 0, 1, 2", () => {
    expect(isValidCode(0)).toBe(true);
    expect(isValidCode(1)).toBe(true);
    expect(isValidCode(2)).toBe(true);
    expect(isValidCode(5)).toBe(false);
    expect(isValidCode(null)).toBe(false);
    expect(isValidCode("1")).toBe(false);
  });
});

describe("normaliseResult", () => {
  it("maps the Excel '5' placeholder to null (not played)", () => {
    expect(normaliseResult(NOT_PLAYED_PLACEHOLDER)).toBeNull();
    expect(normaliseResult(5)).toBeNull();
  });
  it("passes through valid codes", () => {
    expect(normaliseResult(0)).toBe(0);
    expect(normaliseResult(1)).toBe(1);
    expect(normaliseResult(2)).toBe(2);
  });
  it("maps junk to null", () => {
    expect(normaliseResult(undefined)).toBeNull();
    expect(normaliseResult("x")).toBeNull();
    expect(normaliseResult(3)).toBeNull();
  });
});

describe("scorePrediction", () => {
  it("awards 1 point (default) for a correct pick", () => {
    expect(scorePrediction(1, 1)).toBe(1);
    expect(scorePrediction(0, 0)).toBe(1);
    expect(scorePrediction(2, 2)).toBe(1);
  });
  it("awards 0 for a wrong pick", () => {
    expect(scorePrediction(1, 2)).toBe(0);
    expect(scorePrediction(0, 1)).toBe(0);
  });
  it("awards 0 when the match has no result yet", () => {
    expect(scorePrediction(1, null)).toBe(0);
  });
  it("awards 0 for a missing pick", () => {
    expect(scorePrediction(null, 1)).toBe(0);
    expect(scorePrediction(undefined, 0)).toBe(0);
  });
  it("respects a configurable points-per-correct value", () => {
    expect(scorePrediction(1, 1, 3)).toBe(3);
    expect(scorePrediction(1, 2, 3)).toBe(0);
  });
});

describe("computeStandings", () => {
  const members: ScoringMember[] = [
    { id: "a", name: "Angelo" },
    { id: "b", name: "Bruno" },
    { id: "c", name: "Carla" },
  ];
  // Two finished matches (m1 -> 1, m2 -> 0) and one unplayed (m3 -> null).
  const matches: ScoringMatch[] = [
    { id: "m1", result: 1 },
    { id: "m2", result: 0 },
    { id: "m3", result: null },
  ];
  const predictions: ScoringPrediction[] = [
    // Angelo: both correct -> 2
    { memberId: "a", matchId: "m1", pick: 1 },
    { memberId: "a", matchId: "m2", pick: 0 },
    { memberId: "a", matchId: "m3", pick: 2 }, // unplayed, no points
    // Bruno: one correct -> 1
    { memberId: "b", matchId: "m1", pick: 1 },
    { memberId: "b", matchId: "m2", pick: 2 },
    // Carla: no correct picks (and skipped m2) -> 0
    { memberId: "c", matchId: "m1", pick: 0 },
  ];

  it("computes points, correct and played correctly", () => {
    const s = computeStandings(members, matches, predictions);
    const byId = Object.fromEntries(s.map((x) => [x.memberId, x]));
    expect(byId.a.points).toBe(2);
    expect(byId.a.correct).toBe(2);
    expect(byId.a.played).toBe(2); // m3 unplayed not counted
    expect(byId.b.points).toBe(1);
    expect(byId.b.played).toBe(2);
    expect(byId.c.points).toBe(0);
    expect(byId.c.played).toBe(1);
  });

  it("ranks by points descending (PUESTO)", () => {
    const s = computeStandings(members, matches, predictions);
    expect(s[0].memberId).toBe("a");
    expect(s[0].rank).toBe(1);
    expect(s[1].memberId).toBe("b");
    expect(s[1].rank).toBe(2);
    expect(s[2].memberId).toBe("c");
    expect(s[2].rank).toBe(3);
  });

  it("uses standard competition ranking for ties (1,2,2,4)", () => {
    const tieMembers: ScoringMember[] = [
      { id: "w", name: "Win" },
      { id: "x", name: "Xena" },
      { id: "y", name: "Yon" },
      { id: "z", name: "Zoe" },
    ];
    const tieMatch: ScoringMatch[] = [{ id: "g", result: 1 }];
    const tiePreds: ScoringPrediction[] = [
      { memberId: "w", matchId: "g", pick: 1 }, // correct
      { memberId: "x", matchId: "g", pick: 1 }, // correct
      { memberId: "y", matchId: "g", pick: 1 }, // correct
      { memberId: "z", matchId: "g", pick: 2 }, // wrong
    ];
    const s = computeStandings(tieMembers, tieMatch, tiePreds);
    const ranks = Object.fromEntries(s.map((x) => [x.memberId, x.rank]));
    expect(ranks.w).toBe(1);
    expect(ranks.x).toBe(1);
    expect(ranks.y).toBe(1);
    expect(ranks.z).toBe(4); // three tied at 1, next rank is 4
  });

  it("includes members with no predictions at zero", () => {
    const s = computeStandings(members, matches, []);
    expect(s.every((x) => x.points === 0)).toBe(true);
  });
});

describe("memberTotal", () => {
  const matches: ScoringMatch[] = [
    { id: "m1", result: 1 },
    { id: "m2", result: 0 },
  ];
  const predictions: ScoringPrediction[] = [
    { memberId: "a", matchId: "m1", pick: 1 },
    { memberId: "a", matchId: "m2", pick: 1 },
    { memberId: "b", matchId: "m1", pick: 1 },
  ];
  it("sums one member's awarded points", () => {
    expect(memberTotal("a", matches, predictions)).toBe(1);
    expect(memberTotal("b", matches, predictions)).toBe(1);
    expect(memberTotal("c", matches, predictions)).toBe(0);
  });
});
