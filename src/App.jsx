import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ================= SUPABASE ================= */
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ================= STYLES ================= */
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: 12,
  minWidth: 180,
};

const PAGE_SIZE = 5;

export default function App() {
  /* ================= AUTH ================= */
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => data.subscription.unsubscribe();
  }, []);

  /* ================= STATE ================= */
  const [activeTab, setActiveTab] = useState("dashboard");

  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const [txPage, setTxPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);

  /* ================= ADD ITEM ================= */
  const [newItem, setNewItem] = useState({
    item_name: "",
    brand: "",
    unit_price: "",
  });

  /* ================= TRANSACTION FORM ================= */
  const [editingId, setEditingId] = useState(null);
  const originalFormRef = useRef(null);

  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    date: "",
  });

  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  /* ================= LOAD DATA ================= */
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("*")
      .order("item_name");

    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", false)
      .order("date", { ascending: false });

    const { data: deletedTx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", true)
      .order("deleted_at", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handler = (e) =>
      searchRef.current &&
      !searchRef.current.contains(e.target) &&
      setDropdownOpen(false);

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ================= ADD ITEM ================= */
  async function addItem() {
    if (!newItem.item_name || !newItem.unit_price) {
      alert("Item name and price required");
      return;
    }

    const { error } = await supabase.from("items").insert({
      item_name: newItem.item_name,
      brand: newItem.brand || null,
      unit_price: Number(newItem.unit_price),
    });

    if (error) return alert(error.message);

    setNewItem({ item_name: "", brand: "", unit_price: "" });
    loadData();
  }

  /* ================= SAVE TRANSACTION ================= */
  async function saveTransaction() {
    if (!form.item_id || !form.quantity) {
      alert("Complete the form");
      return;
    }

    const item = items.find((i) => i.id === Number(form.item_id));
    if (!item) return alert("Item not found");

    const payload = {
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(form.item_id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
      deleted: false,
    };

    const { error } = editingId
      ? await supabase
          .from("inventory_transactions")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("inventory_transactions").insert(payload);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", date: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  /* ================= STOCK COMPUTATION ================= */
  const stockByItem = items.map((item) => {
    const txs = transactions.filter((t) => t.item_id === item.id);
    const stock = txs.reduce(
      (sum, t) => sum + (t.type === "IN" ? t.quantity : -t.quantity),
      0
    );
    return { ...item, stock };
  });

  /* ================= REPORT ================= */
  const monthlyTotals = transactions.reduce((acc, t) => {
    const m = t.date?.slice(0, 7);
    if (!m) return acc;
    acc[m] = acc[m] || { IN: 0, OUT: 0 };
    acc[m][t.type] += t.quantity * t.unit_price;
    return acc;
  }, {});

  /* ================= LOGIN ================= */
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({ provider: "google" })
          }
        >
          Login with Google
        </button>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["dashboard", "transactions", "deleted", "report"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              fontWeight: activeTab === t ? "bold" : "normal",
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ================= DASHBOARD ================= */}
      {activeTab === "dashboard" && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={cardStyle}>
              <p>Total Items</p>
              <h2>{items.length}</h2>
            </div>
            <div style={cardStyle}>
              <p>Low Stock (≤5)</p>
              <h2>{stockByItem.filter((i) => i.stock <= 5).length}</h2>
            </div>
          </div>

          <h3 style={{ marginTop: 20 }}>Add New Item</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Item name"
              value={newItem.item_name}
              onChange={(e) =>
                setNewItem({ ...newItem, item_name: e.target.value })
              }
            />
            <input
              placeholder="Brand"
              value={newItem.brand}
              onChange={(e) =>
                setNewItem({ ...newItem, brand: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Unit price"
              value={newItem.unit_price}
              onChange={(e) =>
                setNewItem({ ...newItem, unit_price: e.target.value })
              }
            />
            <button onClick={addItem}>Add</button>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {stockByItem.map((i) => (
                <tr
                  key={i.id}
                  style={{
                    background: i.stock <= 5 ? "#fff7ed" : "transparent",
                  }}
                >
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand}</td>
                  <td style={thtd}>{i.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ================= TRANSACTIONS ================= */}
      {activeTab === "transactions" && (
        <>
          <h3>Add / Edit Transaction</h3>
          <div ref={searchRef} style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Search item"
              value={itemSearch}
              onChange={(e) => {
                setItemSearch(e.target.value);
                setDropdownOpen(true);
              }}
            />
            {dropdownOpen && itemSearch && (
              <div
                style={{
                  position: "absolute",
                  background: "#fff",
                  border: "1px solid #ccc",
                  maxHeight: 150,
                  overflow: "auto",
                }}
              >
                {items
                  .filter((i) =>
                    i.item_name
                      .toLowerCase()
                      .includes(itemSearch.toLowerCase())
                  )
                  .map((i) => (
                    <div
                      key={i.id}
                      style={{ padding: 6, cursor: "pointer" }}
                      onClick={() => {
                        setForm({ ...form, item_id: i.id });
                        setItemSearch(i.item_name);
                        setDropdownOpen(false);
                      }}
                    >
                      {i.item_name}
                    </div>
                  ))}
              </div>
            )}
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
            <input
              type="number"
              placeholder="Qty"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: e.target.value })
              }
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <button onClick={saveTransaction}>
              {editingId ? "Update" : "Save"}
            </button>
          </div>
        </>
      )}

      {/* ================= DELETED ================= */}
      {activeTab === "deleted" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Item</th>
              <th style={thtd}>Qty</th>
              <th style={thtd}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deletedTransactions.map((t) => (
              <tr key={t.id}>
                <td style={thtd}>{t.items?.item_name}</td>
                <td style={thtd}>{t.quantity}</td>
                <td style={thtd}>
                  <button
                    onClick={async () => {
                      await supabase
                        .from("inventory_transactions")
                        .update({ deleted: false })
                        .eq("id", t.id);
                      loadData();
                    }}
                  >
                    Restore
                  </button>
                  <button
                    onClick={async () => {
                      await supabase
                        .from("inventory_transactions")
                        .delete()
                        .eq("id", t.id);
                      loadData();
                    }}
                  >
                    Delete Permanently
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= REPORT ================= */}
      {activeTab === "report" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Month</th>
              <th style={thtd}>IN</th>
              <th style={thtd}>OUT</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(monthlyTotals).map(([m, v]) => (
              <tr key={m}>
                <td style={thtd}>{m}</td>
                <td style={thtd}>₱{v.IN.toFixed(2)}</td>
                <td style={thtd}>₱{v.OUT.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
