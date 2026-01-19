import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  // pagination
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);

  // UI state
  const [showDeleted, setShowDeleted] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);

  // form
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    date: "",
    brand: "",
    unit: "",
    volume_pack: "",
  });

  // item search
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    // ================= TABS =================
  const [activeTab, setActiveTab] = useState("transactions");

  // ================= MONTHLY REPORT =================
  const monthlyReport = transactions.reduce((acc, t) => {
    const month = t.date.slice(0, 7);
    acc[month] = (acc[month] || 0) + t.quantity * t.unit_price;
    return acc;
  }, {});

  function exportCSV() {
    const rows = [["Month", "Total"]];
    Object.entries(monthlyReport).forEach(([m, v]) => rows.push([m, v]));
    const csv = rows.map(r => r.join(",")).join("
");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "monthly-report.csv";
    a.click();
  }

  return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price, brand");

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

  // ================= SAVE TRANSACTION =================
  async function saveTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");

    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Item not found");

    const payload = {
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(form.item_id),
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
      brand: form.brand || item.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    const { error } = editingId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert(payload);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>Login with Google</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>Inventory System</h1>

      {/* TRANSACTION FORM */}
      <div ref={searchRef} style={{ position: "relative", width: 250 }}>
        <input
          value={itemSearch}
          placeholder="Search item"
          onFocus={() => setDropdownOpen(true)}
          onChange={e => { setItemSearch(e.target.value); setDropdownOpen(true); }}
        />
        {dropdownOpen && (
          <div style={{ border: "1px solid #ccc", background: "#fff" }}>
            {items.filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
              <div
                key={i.id}
                onClick={() => {
                  setForm({ ...form, item_id: i.id, brand: i.brand || "" });
                  setItemSearch(i.item_name);
                  setDropdownOpen(false);
                }}
              >
                {i.item_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <input placeholder="Brand" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
      <input placeholder="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
      <input placeholder="Volume / Pack" value={form.volume_pack} onChange={e => setForm({ ...form, volume_pack: e.target.value })} />

      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
        <option>IN</option>
        <option>OUT</option>
      </select>

      <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      <button onClick={saveTransaction}>{editingId ? "Update" : "Save"}</button>

      {/* TRANSACTIONS */}
      <h2 style={{ marginTop: 30 }}>Transactions</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Date</th>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Qty</th>
            <th style={thtd}>Total</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 && emptyRow(5, "No transactions")}
          {transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(t => (
            <tr key={t.id}>
              <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
              <td style={thtd}>{t.items?.item_name}</td>
              <td style={thtd}>{t.brand}</td>
              <td style={thtd}>{t.quantity}</td>
              <td style={thtd}>₱{(t.quantity * t.unit_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DELETE HISTORY */}
      <h2 style={{ marginTop: 40 }}>
        Delete History <button onClick={() => setShowDeleted(v => !v)}>🗑️</button>
      </h2>

      {showDeleted && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Date</th>
              <th style={thtd}>Item</th>
              <th style={thtd}>Brand</th>
              <th style={thtd}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {deletedTransactions.length === 0 && emptyRow(4, "No deleted records")}
            {deletedTransactions.slice((deletedPage - 1) * PAGE_SIZE, deletedPage * PAGE_SIZE).map(t => (
              <tr key={t.id}>
                <td style={thtd}>{new Date(t.deleted_at || t.date).toLocaleDateString("en-CA")}</td>
                <td style={thtd}>{t.items?.item_name}</td>
                <td style={thtd}>{t.brand}</td>
                <td style={thtd}>{t.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
}
