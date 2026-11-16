import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRecommendedSize } from '../../../vfitai/client/src/utils/sizeCalculator.ts';

const profile = { chest: 88, waist: 72, hips: 96, shoulder: 40 };
const chart = [
  { size: 'S', chest: [80, 84], waist: [64, 68] },
  { size: 'M', chest: [86, 90], waist: [70, 74] },
  { size: 'L', chest: [94, 98], waist: [78, 82] },
];

test('UNIT-SIZE-01: missing size chart uses the documented fallback', () => {
  assert.deepEqual(calculateRecommendedSize(profile, undefined, 'tops'),
    { recommendedSize: 'M', fitScore: 80 });
});

test('UNIT-SIZE-02: empty chart behaves like missing chart', () => {
  assert.deepEqual(calculateRecommendedSize(profile, [], 'tops'),
    calculateRecommendedSize(profile, undefined, 'tops'));
});

test('UNIT-SIZE-03: choose the fitting size even when it is not the first entry', () => {
  assert.deepEqual(calculateRecommendedSize(profile, chart, 'tops'),
    { recommendedSize: 'M', fitScore: 100 });
});

test('UNIT-SIZE-04: lower measurement boundaries are inclusive', () => {
  const result = calculateRecommendedSize({ ...profile, chest: 86, waist: 70 }, chart, 'tops');
  assert.equal(result.recommendedSize, 'M');
  assert.equal(result.fitScore, 100);
});

test('UNIT-SIZE-05: upper measurement boundaries are inclusive', () => {
  const result = calculateRecommendedSize({ ...profile, chest: 90, waist: 74 }, chart, 'tops');
  assert.equal(result.recommendedSize, 'M');
  assert.equal(result.fitScore, 100);
});

test('UNIT-SIZE-06: a measurement outside the range reduces fit quality', () => {
  const inside = calculateRecommendedSize(profile, [chart[1]], 'tops');
  const outside = calculateRecommendedSize({ ...profile, chest: 91 }, [chart[1]], 'tops');
  assert.ok(outside.fitScore < inside.fitScore);
  assert.ok(outside.fitScore >= 0 && outside.fitScore <= 100);
});

test('UNIT-SIZE-07: bottoms use hips rather than chest to select size', () => {
  const bottomChart = [{ size: 'S', hips: [80, 84] }, { size: 'L', hips: [94, 98] }];
  const result = calculateRecommendedSize({ ...profile, chest: 82 }, bottomChart, 'bottoms');
  assert.equal(result.recommendedSize, 'L');
  assert.equal(result.fitScore, 100);
});

test('UNIT-SIZE-08: shoes use the fallback when a chart exists', () => {
  assert.deepEqual(calculateRecommendedSize(profile, chart, 'shoes'),
    { recommendedSize: '39', fitScore: 85 });
});

test('UNIT-SIZE-09: calculation preserves caller profile and chart', () => {
  const inputProfile = structuredClone(profile);
  const inputChart = structuredClone(chart);
  calculateRecommendedSize(inputProfile, inputChart, 'tops');
  assert.deepEqual(inputProfile, profile);
  assert.deepEqual(inputChart, chart);
});

test('UNIT-SIZE-10: reordering distinct candidates preserves the best size', () => {
  assert.deepEqual(calculateRecommendedSize(profile, [...chart].reverse(), 'tops'),
    calculateRecommendedSize(profile, chart, 'tops'));
});
