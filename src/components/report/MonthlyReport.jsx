import React from "react";

export default function MonthlyReport(props) {
  const {
    reportMonth,
    setReportMonth,
    reportYear,
    setReportYear,
    selectedStockRoom,
    styles,
    formatNumber,
    capitalizeWords,
    displayBrand,
    monthlySummary,
    netValue,
    monthlyTransactions,
    exportMonthlyReport,
    emptyRowComponent,
  } = props;

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div id="reportSection">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* HEADER */}
          <div
            style={{
              background: "#111827",
              color: "#fff",
              padding: 20,
              borderRadius: 10,
            }}
          >
            <h2 style={{ margin: 0 }}>
              Lago De Oro Inventory Monthly Report
            </h2>
            <p style={{ margin: "4px 0 0 0", opacity: 0.8 }}>
              {new Date(0, reportMonth - 1).toLocaleString("default", {
                month: "long",
              })}{" "}
              {reportYear}
              {selectedStockRoom && ` — ${selectedStockRoom}`}
            </p>
          </div>

          {/* FILTERS */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select
              style={styles.input}
              value={reportMonth}
              onChange={(e) => setReportMonth(Number(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>

            <input
              style={styles.input}
              type="number"
              value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
            />

            <button
              style={styles.buttonPrimary}
              onClick={() => window.print()}
            >
              🖨 Print Report
            </button>

            <button
              style={{ ...styles.buttonPrimary, background: "#16a34a" }}
              onClick={exportMonthlyReport}
            >
              📊 Export Excel
            </button>
          </div>

          {/* KPI SUMMARY */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <div style={{ ...styles.card, borderLeft: "6px solid #10b981" }}>
              <h4>Total IN</h4>
              <p>{formatNumber(monthlySummary?.totalInQty || 0)} units</p>
              <strong>
                ₱
                {Number(monthlySummary?.totalInValue || 0).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2 }
                )}
              </strong>
            </div>

            <div style={{ ...styles.card, borderLeft: "6px solid #ef4444" }}>
              <h4>Total OUT</h4>
              <p>{formatNumber(monthlySummary?.totalOutQty || 0)} units</p>
              <strong>
                ₱
                {Number(monthlySummary?.totalOutValue || 0).toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2 }
                )}
              </strong>
            </div>

            <div
              style={{
                ...styles.card,
                background: netValue >= 0 ? "#ecfdf5" : "#fef2f2",
                borderLeft: `6px solid ${
                  netValue >= 0 ? "#10b981" : "#ef4444"
                }`,
              }}
            >
              <h4>Net Movement</h4>
              <strong style={{ fontSize: 18 }}>
                ₱
                {Number(netValue).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>

          {/* PER ITEM SUMMARY */}
          <div style={styles.card}>
            <h3>Per Item Summary</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Total IN</th>
                  <th style={styles.thtd}>Total OUT</th>
                  <th style={styles.thtd}>Net Qty</th>
                  <th style={styles.thtd}>Net Value</th>
                </tr>
              </thead>

              <tbody>
                {monthlyTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#9ca3af",
                      }}
                    >
                      No transactions for this month
                    </td>
                  </tr>
                ) : (
                  Object.values(
                    monthlyTransactions.reduce((acc, t) => {
                      const key = `${t.items?.item_name}-${t.items?.brand}`;
                      const price = Number(
                        t.unit_price || t.items?.unit_price || 0
                      );
                      const qty = Number(t.quantity || 0);
                      const value = qty * price;

                      if (!acc[key]) {
                        acc[key] = {
                          item: t.items?.item_name,
                          brand: t.items?.brand,
                          inQty: 0,
                          outQty: 0,
                          inValue: 0,
                          outValue: 0,
                        };
                      }

                      if (t.type === "IN") {
                        acc[key].inQty += qty;
                        acc[key].inValue += value;
                      } else {
                        acc[key].outQty += qty;
                        acc[key].outValue += value;
                      }

                      return acc;
                    }, {})
                  ).map((row, idx) => {
                    const netQty = row.inQty - row.outQty;
                    const netValue = row.inValue - row.outValue;

                    return (
                      <tr key={idx}>
                        <td style={styles.thtd}>
                          {capitalizeWords(row.item)}
                        </td>
                        <td style={styles.thtd}>
                          {displayBrand(row.brand)}
                        </td>
                        <td style={styles.thtd}>
                          {formatNumber(row.inQty)}
                        </td>
                        <td style={styles.thtd}>
                          {formatNumber(row.outQty)}
                        </td>
                        <td style={styles.thtd}>
                          {formatNumber(netQty)}
                        </td>
                        <td style={styles.thtd}>
                          ₱
                          {Number(netValue).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* DETAILED TRANSACTIONS */}
          <div style={styles.card}>
            <h3>Detailed Transactions</h3>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                  <th style={styles.thtd}>Total</th>
                </tr>
              </thead>

              <tbody>
                {monthlyTransactions.length === 0
                  ? emptyRowComponent(6, "No transactions")
                  : monthlyTransactions
                      .filter(
                        (t) =>
                          !selectedStockRoom ||
                          t.items?.location === selectedStockRoom
                      )
                      .sort(
                        (a, b) => new Date(b.date) - new Date(a.date)
                      )
                      .map((t) => (
                        <tr key={t.id}>
                          <td style={styles.thtd}>{t.date}</td>
                          <td style={styles.thtd}>
                            {capitalizeWords(t.items?.item_name)}
                          </td>
                          <td style={styles.thtd}>
                            {displayBrand(t.items?.brand)}
                          </td>
                          <td style={styles.thtd}>{t.type}</td>
                          <td style={styles.thtd}>
                            {formatNumber(t.quantity)}
                          </td>
                          <td style={styles.thtd}>
                            ₱
                            {Number(
                              (t.quantity || 0) *
                                (t.unit_price ||
                                  t.items?.unit_price ||
                                  0)
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
