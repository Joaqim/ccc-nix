import { test, describe, before } from 'node:test';
import type { Express } from "express";
import assert from 'node:assert/strict';
import request from 'supertest';
import setupApi from './setupApi';

// Top level test suite
describe('API', () => {
  let app: Express;

  // Before any tests run, setup our Express app
  before(async () => {
    app = setupApi();
  });

  // Test the GET request
  test('GET request', async () => {
    // Supertest has built-in tests/assertions for response codes
    const { text } = await request(app).get('/').expect(200);
    assert.equal(text, "Get Received");
  });

  // A sub test suite so we can batch related tests
  describe('POST request', () => {
    // Test the POST request
    test("success", async () => {
      const { text } = await request(app).post("/").expect(200);
      assert.equal(text, "Post Received");
    });

    // We'll come back to this later. The Node Test Runner will print out that we have a test TODO later.
    test.todo('error');
  });
});