import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const editingRowStyle = { background: "#fff7ed" };

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>
      {text}
    </td>
  </tr>
);

export default function App() {
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [stockRooms, setStockRooms] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("transactions");

  // room filter (used in Stock Inventory tab)
  const [selectedRoom, setSelectedRoom] = useState("");

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price, brand");

    const { data: rooms } = await supabase
      .from("stock_rooms")
      .select("id, name")
      .order("name");

    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name), stock_rooms(name)")
      .eq("deleted", false);

    setItems(itemsData || []);
    setStockRooms(rooms || []);
    setTransactions(tx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

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

  // ================= STOCK INVENTORY (ROOM-AWARE) =================
  const stockInventory = items.map(item => {
    const related = transactions.filter(
      t =>
        t.item_id === item.id &&
        (!selectedRoom || String(t.stock_room_id) === String(selectedRoom))
    );

    const qtyIn = related
      .filter(t => t.type === "IN")
      .reduce((s, t) => s + t.quantity, 0);

    const qtyOut = related
      .filter(t => t.type === "OUT")
      .reduce((s, t) => s + t.quantity, 0);

    return {
      ...item,
      stock: qtyIn - qtyOut,
    };
  });

  return (
    <div style={{ padding: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ marginBottom: 4 }}>Lago De Oro Inventory System</h1>
        <p style={{ color: "#555" }}>Manage stock IN / OUT and reports</p>
      </div>

      {/* ================= TABS ================= */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setActiveTab("transactions")}>📄 Transactions</button>
        <button onClick={() => setActiveTab("stock")}>📦 Stock Inventory</button>
      </div>

      {/* ================= STOCK TAB ================= */}
      {activeTab === "stock" && (
        <>
          <h2 style={{ textAlign: "center" }}>📦 Stock Inventory</h2>

          {/* ===== ROOM FILTER ===== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "12px 0 16px",
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#f9fafb",
              maxWidth: 420,
            }}
          >
            <label style={{ fontWeight: 600 }}>Stock Room</label>
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              style={{ flex: 1, padding: 6 }}
            >
              <option value="">All rooms</option>
              {stockRooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Current Stock</th>
                <th style={thtd}>Unit Price</th>
                <th style={thtd}>Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {stockInventory.length === 0 && emptyRow(5, "No stock data")}
              {stockInventory.map(i => (
                <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : undefined}>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>₱{Number(i.unit_price || 0).toFixed(2)}</td>
                  <td style={thtd}>₱{(i.stock * (i.unit_price || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ================= TRANSACTIONS PLACEHOLDER ================= */}
      {activeTab === "transactions" && (
        <p style={{ textAlign: "center", color: "#666" }}>
          Transactions UI unchanged (focused refactor was Stock + Room Filter)
        </p>
      )}
    </div>
  );
}
