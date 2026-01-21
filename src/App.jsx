import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const editingRowStyle = { background: "#fff7ed" }; // highlight edited row

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

export default function App() {
  // ===== CONFIRM MODAL STATE =====
  const [confirm, setConfirm] = useState(null);
  const openConfirm = (message, onConfirm) => {
    setConfirm({ message, onConfirm });
  };
  const closeConfirm = () => setConfirm(null);
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  // pagination (ONE declaration each)
  const PAGE_SIZE = 5;
  const [txPage, setTxPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);

  // tabs
  const [activeTab, setActiveTab] = useState("transactions");


  // form
  const [editingId, setEditingId] = useState(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const originalFormRef = useRef(null);
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

  // ================= SAVE =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(k => String(originalFormRef.current[k] || "") !== String(form[k] || ""));
  }

  async function saveTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");
    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Item not found");

    if (form.type === "OUT") {
      const stockItem = stockInventory.find(i => i.id === item.id);
      if (stockItem && Number(form.quantity) > stockItem.stock) {
        alert("Cannot OUT more than available stock");
        return;
      }
    }

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

  // ================= ADD NEW ITEM (STOCK TAB) =================
  const [newItem, setNewItem] = useState({ item_name: "", brand: "", unit_price: "" });
  const [showNewItemForm, setShowNewItemForm] = useState(false);

  async function addNewItem() {
    if (!newItem.item_name || !newItem.unit_price) {
      alert("Item name and unit price are required");
      return;
    }

    const { error } = await supabase.from("items").insert({
      item_name: newItem.item_name,
      brand: newItem.brand || null,
      unit_price: Number(newItem.unit_price),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNewItem({ item_name: "", brand: "", unit_price: "" });
    loadData();
  }

  // ================= STOCK INVENTORY =================
  const stockInventory = items.map(item => {
    const related = transactions.filter(t => t.item_id === item.id);
    const qtyIn = related.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
    const qtyOut = related.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);
    return {
      ...item,
      stock: qtyIn - qtyOut,
    };
  });

  // ================= MONTHLY TOTALS =================
  const monthlyTotals = transactions.reduce((acc, t) => {
    if (!t.date) return acc;
    const month = t.date.slice(0, 7);
    acc[month] = acc[month] || { IN: 0, OUT: 0 };
    acc[month][t.type] += t.quantity * t.unit_price;
    return acc;
  }, {});

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!session) {
    return (
      <div style={{ padding: 40, maxWidth: 360, margin: "0 auto" }}>
        <h2>Inventory Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={form.email || ""}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password || ""}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <button
          style={{ width: "100%" }}
          onClick={async () => {
            const { error } = await supabase.auth.signInWithPassword({
              email: form.email,
              password: form.password,
            });
            if (error) alert(error.message);
          }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>Lago De Oro Inventory System</h1>
      <p style={{ textAlign: "center", color: "#555" }}>You are logged in.</p>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("transactions")}>Transactions</button>
        <button onClick={() => setActiveTab("stock")}>Stock</button>
        <button onClick={() => setActiveTab("reports")}>Reports</button>
      </div>

      {/* TRANSACTIONS TAB */}
      {activeTab === "transactions" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Date</th>
              <th style={thtd}>Item</th>
              <th style={thtd}>Type</th>
              <th style={thtd}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && emptyRow(4, "No transactions")}
            {transactions.map(t => (
              <tr key={t.id}>
                <td style={thtd}>{t.date}</td>
                <td style={thtd}>{t.items?.item_name}</td>
                <td style={thtd}>{t.type}</td>
                <td style={thtd}>{t.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* STOCK TAB */}
      {activeTab === "stock" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Item</th>
              <th style={thtd}>Brand</th>
              <th style={thtd}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {stockInventory.length === 0 && emptyRow(3, "No stock data")}
            {stockInventory.map(i => (
              <tr key={i.id}>
                <td style={thtd}>{i.item_name}</td>
                <td style={thtd}>{i.brand}</td>
                <td style={thtd}>{i.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Month</th>
              <th style={thtd}>IN Total</th>
              <th style={thtd}>OUT Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(monthlyTotals).length === 0 && emptyRow(3, "No reports")}
            {Object.entries(monthlyTotals).map(([month, v]) => (
              <tr key={month}>
                <td style={thtd}>{month}</td>
                <td style={thtd}>{v.IN}</td>
                <td style={thtd}>{v.OUT}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 30, textAlign: "center" }}>
        <button onClick={() => supabase.auth.signOut()}>Logout</button>
      </div>
    </div>
  );
}
