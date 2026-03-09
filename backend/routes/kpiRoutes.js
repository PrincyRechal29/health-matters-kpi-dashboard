const express = require("express");
const { all, get } = require("../db");

const router = express.Router();

function toCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

router.get("/kpis/summary", async (req, res) => {
  try {
    const summary = await get(`
      SELECT
        COUNT(DISTINCT r.id) AS total_referrals,
        AVG(julianday(a.appointment_date) - julianday(r.submitted_at)) AS average_sla_days
      FROM referrals r
      LEFT JOIN appointments a ON a.referral_id = r.id
    `);

    const averageSlaDays =
      summary.average_sla_days === null
        ? 0
        : Number(Number(summary.average_sla_days).toFixed(2));

    res.json({
      total_referrals: summary.total_referrals,
      average_sla_days: averageSlaDays
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch KPI summary." });
  }
});

router.get("/kpis/outcomes", async (req, res) => {
  try {
    const outcomes = await all(`
      SELECT
        outcome_status,
        COUNT(*) AS count
      FROM outcomes
      GROUP BY outcome_status
      ORDER BY outcome_status
    `);

    res.json(
      outcomes.map((row) => ({
        outcome_status: row.outcome_status,
        count: Number(row.count)
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch outcome statistics." });
  }
});

router.get("/kpis/referrals", async (req, res) => {
  try {
    const referrals = await all(`
      SELECT
        r.id AS referral_id,
        r.submitted_at,
        r.status AS referral_status,
        a.appointment_date,
        o.outcome_status,
        ROUND(julianday(a.appointment_date) - julianday(r.submitted_at), 2) AS sla_days
      FROM referrals r
      LEFT JOIN appointments a ON a.referral_id = r.id
      LEFT JOIN outcomes o ON o.referral_id = r.id
      ORDER BY r.id
    `);

    res.json(
      referrals.map((row) => ({
        referral_id: row.referral_id,
        submitted_at: row.submitted_at,
        referral_status: row.referral_status,
        appointment_date: row.appointment_date,
        outcome_status: row.outcome_status,
        sla_days: row.sla_days === null ? null : Number(row.sla_days)
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch referral details." });
  }
});

router.get("/mi/export", async (req, res) => {
  try {
    const rows = await all(`
      SELECT
        r.id AS referral_id,
        r.submitted_at,
        r.status AS referral_status,
        a.appointment_date,
        o.outcome_status
      FROM referrals r
      LEFT JOIN appointments a ON a.referral_id = r.id
      LEFT JOIN outcomes o ON o.referral_id = r.id
      ORDER BY r.id
    `);

    const headers = [
      "referral_id",
      "submitted_at",
      "referral_status",
      "appointment_date",
      "outcome_status"
    ];

    const csvLines = [headers.join(",")];

    for (const row of rows) {
      const values = [
        row.referral_id,
        row.submitted_at,
        row.referral_status,
        row.appointment_date,
        row.outcome_status
      ];
      csvLines.push(values.map(toCsvValue).join(","));
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"mi_export.csv\"");
    res.status(200).send(csvLines.join("\n"));
  } catch (error) {
    res.status(500).json({ error: "Failed to export MI CSV data." });
  }
});

module.exports = router;
