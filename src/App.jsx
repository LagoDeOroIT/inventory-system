import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ================= SUPABASE CONFIG ================= */
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ================= STYLES ================= */
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const lowStockStyle = { background: "#fee2e2" };

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

const LOW_STOCK_THRESHOLD = 5;

/* ================= APP ================= */
export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  /* ================= AUTH ================= */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  /* ================= LOAD DATA ================= */
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price, brand");

    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", false);

    setItems(itemsData || []);
    setTransactions(tx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  /* ================= DASHBOARD COMPUTATION ================= */
  const stockMap = {};

  transactions.forEach(t => {
    if (!stockMap[t.item_id]) {
      const item = items.find(i => i.id === t.item_id);
      stockMap[t.item_id] = {
        item_id: t.item_id,
        item_name: item?.item_name || "",
        brand: item?.brand || "Unbranded",
        inQty: 0,
        outQty: 0,
      };
    }
    if (t.type === "IN") stockMap[t.item_id].inQty += t.quantity;
    if (t.type === "OUT") stockMap[t.item_id].outQty += t.quantity;
  });

  const stockList = Object.values(stockMap).map(s => ({
    ...s,
    quantity: s.inQty - s.outQty,
  }));

  const groupedByBrand = stockList.reduce((acc, item) => {
    acc[item.brand] = acc[item.brand] || [];
    acc[item.brand].push(item);
    return acc;
  }, {});

  const totalIN = stockList.reduce((a, b) => a + b.inQty, 0);
  const totalOUT = stockList.reduce((a, b) => a + b.outQty, 0);
  const totalStock = stockList.reduce((a, b) => a + b.quantity, 0);

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      {/* ================= TABS ================= */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("transactions")}>Transactions</button>
        <button onClick={() => setActiveTab("report")}>Monthly Report</button>
      </div>

      {/* ================= DASHBOARD ================= */}
      {activeTab === "dashboard" && (
        <>
          <h2>Main Stock Inventory</h2>

          {/* TOTALS */}
          <div style={{ display: "flex", gap: 20, marginBottom: 15 }}>
            <strong>Total IN: {totalIN}</strong>
            <strong>Total OUT: {totalOUT}</strong>
            <strong>Total STOCK: {totalStock}</strong>
          </div>

          {/* GROUPED TABLE */}
          {Object.keys(groupedByBrand).length === 0 && (
            <p>No stock data</p>
          )}

          {Object.entries(groupedByBrand).map(([brand, items]) => (
            <div key={brand} style={{ marginBottom: 20 }}>
              <h3>{brand}</h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thtd}>Item</th>
                    <th style={thtd}>IN</th>
                    <th style={thtd}>OUT</th>
                    <th style={thtd}>Quantity</th>
                    <th style={thtd}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr
                      key={i.item_id}
                      style={i.quantity <= LOW_STOCK_THRESHOLD ? lowStockStyle : null}
                    >
                      <td style={thtd}>
                        {i.item_name}
                        {i.quantity <= LOW_STOCK_THRESHOLD && (
                          <span style={{ color: "red", marginLeft: 6 }}>
                            ⚠ Low Stock
                          </span>
                        )}
                      </td>
                      <td style={thtd}>{i.inQty}</td>
                      <td style={thtd}>{i.outQty}</td>
                      <td style={thtd}>{i.quantity}</td>
                      <td style={thtd}>
                        <button onClick={() => setActiveTab("transactions")}>
                          ✏️ Edit
                        </button>
                        <button
                          onClick={async () => {
                            await supabase
                              .from("inventory_transactions")
                              .update({ deleted: true })
                              .eq("item_id", i.item_id);
                            loadData();
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
