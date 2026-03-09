const request = require("supertest");
const app = require("../server");
const { initDatabase, closeDatabase } = require("../db");

beforeAll(async () => {
  await initDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("KPI API", () => {
  test("GET /api/kpis/summary returns summary fields", async () => {
    const response = await request(app).get("/api/kpis/summary");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("total_referrals");
    expect(response.body).toHaveProperty("average_sla_days");
    expect(typeof response.body.total_referrals).toBe("number");
    expect(typeof response.body.average_sla_days).toBe("number");
  });

  test("GET /api/kpis/outcomes returns grouped outcomes", async () => {
    const response = await request(app).get("/api/kpis/outcomes");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const firstRow = response.body[0];
    expect(firstRow).toHaveProperty("outcome_status");
    expect(firstRow).toHaveProperty("count");
    expect(typeof firstRow.outcome_status).toBe("string");
    expect(typeof firstRow.count).toBe("number");
  });

  test("GET /api/mi/export returns CSV", async () => {
    const response = await request(app).get("/api/mi/export");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.text).toContain(
      "referral_id,submitted_at,referral_status,appointment_date,outcome_status"
    );
  });

  test("GET /api/kpis/referrals returns detailed referral rows", async () => {
    const response = await request(app).get("/api/kpis/referrals");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const firstRow = response.body[0];
    expect(firstRow).toHaveProperty("referral_id");
    expect(firstRow).toHaveProperty("submitted_at");
    expect(firstRow).toHaveProperty("referral_status");
    expect(firstRow).toHaveProperty("appointment_date");
    expect(firstRow).toHaveProperty("outcome_status");
    expect(firstRow).toHaveProperty("sla_days");
  });
});
