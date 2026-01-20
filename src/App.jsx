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
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 4 }}>Inventory System</h1>
      <p style={{ marginTop: 0, color: "#555" }}>Manage stock IN / OUT and reports</p>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("transactions")} style={{ fontWeight: activeTab === "transactions" ? "bold" : "normal" }}>Transactions</button>
        <button onClick={() => setActiveTab("deleted")} style={{ fontWeight: activeTab === "deleted" ? "bold" : "normal" }}>Deleted</button>
        <button onClick={() => setActiveTab("report")} style={{ fontWeight: activeTab === "report" ? "bold" : "normal" }}>Monthly Report</button>
      </div>

      {/* CONFIRM MODAL */}
            {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, width: 360, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Confirm Action</h3>
            <p style={{ marginBottom: 24, color: "#444" }}>{confirm.message}</p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button style={{ flex: 1, background: "#1f2937", color: "#fff", padding: "8px 0", borderRadius: 4 }} onClick={() => { confirm.onConfirm(); closeConfirm(); }}>Confirm</button>
              <button style={{ flex: 1, background: "#e5e7eb", padding: "8px 0", borderRadius: 4 }} onClick={closeConfirm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

{/* TRANSACTIONS TAB */}
{activeTab === "transactions" && (
$1
)}

      {/* DELETE TAB */}
      {activeTab === "deleted" && (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deletedTransactions.length === 0 && emptyRow(5, "No deleted records")}
              {deletedTransactions.slice((deletedPage - 1) * PAGE_SIZE, deletedPage * PAGE_SIZE).map(t => (
                <tr key={t.id}>
                  <td style={thtd}>{new Date(t.deleted_at || t.date).toLocaleDateString("en-CA")}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.brand}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button onClick={() => openConfirm("Restore this transaction?", async () => {
                      await supabase.from("inventory_transactions").update({ deleted: false, deleted_at: null }).eq("id", t.id);
                      loadData();
                    })}>♻️ Restore</button>
                    <button onClick={() => openConfirm("Permanently delete this transaction?", async () => {
                      await supabase.from("inventory_transactions").delete().eq("id", t.id);
                      loadData();
                    })}>❌ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <button disabled={deletedPage === 1} onClick={() => setDeletedPage(p => p - 1)}>Prev</button>
            <span> Page {deletedPage} </span>
            <button disabled={deletedPage * PAGE_SIZE >= deletedTransactions.length} onClick={() => setDeletedPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}

      {/* REPORT TAB */}
      {activeTab === "report" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Month</th>
              <th style={thtd}>IN Total</th>
              <th style={thtd}>OUT Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(monthlyTotals).length === 0 && emptyRow(3, "No data")}
            {Object.entries(monthlyTotals).slice((reportPage - 1) * PAGE_SIZE, reportPage * PAGE_SIZE).map(([m, v]) => (
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
