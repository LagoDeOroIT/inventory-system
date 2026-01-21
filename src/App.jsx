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
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

export default function App() {
  const [confirm, setConfirm] = useState(null);
  const openConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const PAGE_SIZE = 5;
  const [txPage, setTxPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);

  const [activeTab, setActiveTab] = useState("transactions");

  const [editingId, setEditingId] = useState(null);
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

  // ================= STOCK CALCULATION (DATE-AWARE) =================
  function getCurrentStock(itemId, excludeTransactionId = null, upToDate = null) {
    return transactions.reduce((stock, t) => {
      if (t.item_id !== itemId) return stock;
      if (excludeTransactionId && t.id === excludeTransactionId) return stock;
      if (upToDate && new Date(t.date) > new Date(upToDate)) return stock;

      if (t.type === "IN") return stock + Number(t.quantity);
      if (t.type === "OUT") return stock - Number(t.quantity);
      return stock;
    }, 0);
  }

  // ================= FORM CHANGE CHECK =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(
      k => String(originalFormRef.current[k] || "") !== String(form[k] || "")
    );
  }

  // ================= SAVE =================
  async function saveTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");

    const quantity = Number(form.quantity);
    if (quantity <= 0) return alert("Quantity must be greater than zero");

    const itemId = Number(form.item_id);
    const item = items.find(i => i.id === itemId);
    if (!item) return alert("Item not found");

    const effectiveDate = form.date || new Date().toISOString().slice(0, 10);
    const currentStock = getCurrentStock(itemId, editingId, effectiveDate);

    if (form.type === "OUT" && quantity > currentStock) {
      return alert(`Insufficient stock. Available: ${currentStock}`);
    }

    const payload = {
      date: effectiveDate,
      item_id: itemId,
      type: form.type,
      quantity,
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
    originalFormRef.current = null;
    loadData();
  }

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
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>Login with Google</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      {activeTab === "transactions" && (
        <div style={{ marginBottom: 20 }} ref={searchRef}>
          <input placeholder="Search item" value={itemSearch} onChange={e => { setItemSearch(e.target.value); setDropdownOpen(true); }} />

          {dropdownOpen && itemSearch && (
            <div style={{ border: "1px solid #ccc" }}>
              {items.filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
                <div key={i.id} style={{ padding: 6, cursor: "pointer" }} onClick={() => { setForm(f => ({ ...f, item_id: i.id })); setItemSearch(i.item_name); setDropdownOpen(false); }}>{i.item_name}</div>
              ))}
            </div>
          )}

          {form.item_id && (
            <div style={{ fontSize: 12, color: "#555" }}>
              Available stock: <strong>{getCurrentStock(Number(form.item_id), editingId, form.date)}</strong>
            </div>
          )}

          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>

          <input type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

          <button onClick={saveTransaction}>{editingId ? "Update" : "Save"}</button>
        </div>
      )}

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
    </div>
  );
}
