import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8 };

const Modal = ({ title, message, onConfirm, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 }}>
    <div style={{ background: "#fff", padding: 20, borderRadius: 10, minWidth: 320 }}>
      <h3 style={{ marginBottom: 10 }}>{title}</h3>
      <p>{message}</p>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button style={{ background: "#16a34a", color: "#fff", padding: "6px 14px", borderRadius: 6 }} onClick={onConfirm}>Confirm</button>
        <button style={{ background: "#dc2626", color: "#fff", padding: "6px 14px", borderRadius: 6 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  </div>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddItem, setShowAddItem] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const [searchStock, setSearchStock] = useState("");
  const [searchTx, setSearchTx] = useState("");
  const [searchDeleted, setSearchDeleted] = useState("");

  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  const [newItem, setNewItem] = useState({ item_name: "", brand: "", unit_price: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function loadData() {
    const { data: i } = await supabase.from("items").select("*");
    const { data: t } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", false);
    const { data: d } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", true);
    setItems(i || []);
    setTransactions(t || []);
    setDeletedTransactions(d || []);
  }

  if (!session) return <div style={{ padding: 20 }}>Please login</div>;

  const paginate = (arr) => arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const monthly = transactions.reduce((acc, t) => {
    const m = t.date?.slice(0, 7);
    if (!m) return acc;
    acc[m] = acc[m] || { in: 0, out: 0 };
    acc[m][t.type === "IN" ? "in" : "out"] += t.quantity;
    return acc;
  }, {});

  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("dashboard")}>Stock</button>
        <button onClick={() => setActiveTab("transactions")}>Transactions</button>
        <button onClick={() => setActiveTab("deleted")}>Deleted</button>
        <button onClick={() => setActiveTab("monthly")}>Monthly</button>
        <button style={{ background: "#2563eb", color: "#fff" }} onClick={() => setShowAddItem(true)}>+ Add New Item</button>
      </div>

      {activeTab === "dashboard" && (
        <>
          <h2 style={{ textAlign: "center" }}>Stock Inventory</h2>
          <input placeholder="Search..." value={searchStock} onChange={e => setSearchStock(e.target.value)} />
          <table style={tableStyle}>
            <thead><tr><th style={thtd}>Item</th><th style={thtd}>Brand</th><th style={thtd}>Stock</th></tr></thead>
            <tbody>
              {paginate(items.filter(i => i.item_name.toLowerCase().includes(searchStock.toLowerCase()))).map(i => {
                const stock = transactions.filter(t => t.item_id === i.id).reduce((s, t) => s + (t.type === "IN" ? t.quantity : -t.quantity), 0);
                return <tr key={i.id}><td style={thtd}>{i.item_name}</td><td style={thtd}>{i.brand}</td><td style={thtd}>{stock}</td></tr>;
              })}
            </tbody>
          </table>
        </>
      )}

      {activeTab === "transactions" && (
        <>
          <h2 style={{ textAlign: "center" }}>Transactions (IN / OUT)</h2>
          <input placeholder="Search..." value={searchTx} onChange={e => setSearchTx(e.target.value)} />
          <table style={tableStyle}>
            <thead><tr><th style={thtd}>Item</th><th style={thtd}>Type</th><th style={thtd}>Qty</th></tr></thead>
            <tbody>
              {paginate(transactions.filter(t => t.items?.item_name?.toLowerCase().includes(searchTx.toLowerCase()))).map(t => (
                <tr key={t.id}><td style={thtd}>{t.items?.item_name}</td><td style={thtd}>{t.type}</td><td style={thtd}>{t.quantity}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activeTab === "deleted" && (
        <>
          <h2 style={{ textAlign: "center" }}>Deleted History</h2>
          <input placeholder="Search..." value={searchDeleted} onChange={e => setSearchDeleted(e.target.value)} />
          <table style={tableStyle}>
            <thead><tr><th style={thtd}>Item</th><th style={thtd}>Actions</th></tr></thead>
            <tbody>
              {paginate(deletedTransactions.filter(t => t.items?.item_name?.toLowerCase().includes(searchDeleted.toLowerCase()))).map(t => (
                <tr key={t.id}>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>
                    <button onClick={() => setConfirm({ title: "Restore", message: "Restore this item?", action: async () => { await supabase.from("inventory_transactions").update({ deleted: false }).eq("id", t.id); loadData(); } })}>Restore</button>
                    <button onClick={() => setConfirm({ title: "Delete", message: "Delete permanently?", action: async () => { await supabase.from("inventory_transactions").delete().eq("id", t.id); loadData(); } })}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activeTab === "monthly" && (
        <>
          <h2 style={{ textAlign: "center" }}>Monthly Report (IN / OUT)</h2>
          <table style={tableStyle}>
            <thead><tr><th style={thtd}>Month</th><th style={thtd}>IN</th><th style={thtd}>OUT</th></tr></thead>
            <tbody>
              {Object.entries(monthly).map(([m, v]) => <tr key={m}><td style={thtd}>{m}</td><td style={thtd}>{v.in}</td><td style={thtd}>{v.out}</td></tr>)}
            </tbody>
          </table>
        </>
      )}

      {showAddItem && (
        <Modal title="Add New Item" message={
          <div>
            <input placeholder="Item name" value={newItem.item_name} onChange={e => setNewItem({ ...newItem, item_name: e.target.value })} />
            <input placeholder="Brand" value={newItem.brand} onChange={e => setNewItem({ ...newItem, brand: e.target.value })} />
            <input type="number" placeholder="Unit price" value={newItem.unit_price} onChange={e => setNewItem({ ...newItem, unit_price: e.target.value })} />
          </div>
        } onConfirm={async () => { await supabase.from("items").insert(newItem); setShowAddItem(false); setNewItem({ item_name: "", brand: "", unit_price: "" }); loadData(); }} onCancel={() => setShowAddItem(false)} />
      )}

      {confirm && (
        <Modal title={confirm.title} message={confirm.message} onConfirm={async () => { await confirm.action(); setConfirm(null); }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}
