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
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("dashboard");
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

  const [confirm, setConfirm] = useState(null);
  const openConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  const PAGE_SIZE = 5;
  const [txPage, setTxPage] = useState(1);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);

  const monthlyReport = transactions.reduce((acc, t) => {
    const m = t.date?.slice(0, 7);
    if (!m) return acc;
    acc[m] = acc[m] || { in: 0, out: 0 };
    acc[m][t.type === "IN" ? "in" : "out"] += t.quantity;
    return acc;
  }, {});

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("id, item_name, unit_price, brand");
    const { data: tx } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", false).order("date", { ascending: false });
    const { data: deletedTx } = await supabase.from("inventory_transactions").select("*, items(item_name)").eq("deleted", true).order("deleted_at", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(k => String(originalFormRef.current[k] || "") !== String(form[k] || ""));
  }

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
    setEditingId(null);
    originalFormRef.current = null;
    loadData();
  }

  if (!session) return <div style={{ padding: 20 }}>Please login</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("transactions")}>Transactions</button>
        <button onClick={() => setActiveTab("deleted")}>Deleted</button>
        <button onClick={() => setActiveTab("monthly")}>Monthly Report</button>
      </div>

      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 280 }}>
            <p style={{ marginBottom: 16 }}>{confirm.message}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={closeConfirm}>Cancel</button>
              <button onClick={() => { confirm.onConfirm(); closeConfirm(); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "dashboard" && (
        <>
          <h2 style={{ textAlign: "center", marginBottom: 10 }}>Stock Inventory</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && emptyRow(3, "No items")}
              {items.map(i => {
                const stock = transactions.filter(t => t.item_id === i.id).reduce((s, t) => s + (t.type === "IN" ? t.quantity : -t.quantity), 0);
                return (
                  <tr key={i.id}>
                    <td style={thtd}>{i.item_name}</td>
                    <td style={thtd}>{i.brand}</td>
                    <td style={thtd}>{stock}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {activeTab === "transactions" && (
        <>
          <h2 style={{ textAlign: "center", marginBottom: 10 }}>Transaction History</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && emptyRow(4, "No transactions")}
              {transactions.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE).map(t => (
                <tr key={t.id} style={editingId === t.id ? editingRowStyle : undefined}>
                  <td style={thtd}>{t.date}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button onClick={() => openConfirm("Edit this?", () => {
                      originalFormRef.current = { item_id: t.item_id, type: t.type, quantity: String(t.quantity) };
                      setEditingId(t.id);
                      setForm(originalFormRef.current);
                    })}>Edit</button>
                    <button disabled={editingId !== null} onClick={() => openConfirm("Delete this?", async () => {
                      await supabase.from("inventory_transactions").update({ deleted: true }).eq("id", t.id);
                      loadData();
                    })}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10 }}>
            <button disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}>Prev</button>
            <span style={{ margin: "0 10px" }}>Page {txPage}</span>
            <button disabled={txPage * PAGE_SIZE >= transactions.length} onClick={() => setTxPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}
              {transactions.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE).map(t => (
                <tr key={t.id} style={editingId === t.id ? editingRowStyle : undefined}>
                  <td style={thtd}>{t.date}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button onClick={() => openConfirm("Edit this?", () => {
                      originalFormRef.current = { item_id: t.item_id, type: t.type, quantity: String(t.quantity) };
                      setEditingId(t.id);
                      setForm(originalFormRef.current);
                    })}>Edit</button>
                    <button onClick={() => openConfirm("Delete this?", async () => {
                      await supabase.from("inventory_transactions").update({ deleted: true }).eq("id", t.id);
                      loadData();
                    })}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 10 }}>
            <button disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}>Prev</button>
            <span style={{ margin: "0 10px" }}>Page {txPage}</span>
            <button disabled={txPage * PAGE_SIZE >= transactions.length} onClick={() => setTxPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}

      {activeTab === "deleted" && (
        <h2 style={{ textAlign: "center", marginBottom: 10 }}>Deleted Records</h2>
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {deletedTransactions.length === 0 && emptyRow(2, "No deleted records")}
              {deletedTransactions.slice((deletedPage - 1) * PAGE_SIZE, deletedPage * PAGE_SIZE).map(t => (
                <tr key={t.id}>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 10 }}>
            <button disabled={deletedPage === 1} onClick={() => setDeletedPage(p => p - 1)}>Prev</button>
            <span style={{ margin: "0 10px" }}>Page {deletedPage}</span>
            <button disabled={deletedPage * PAGE_SIZE >= deletedTransactions.length} onClick={() => setDeletedPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}

      {activeTab === "monthly" && (
        <h2 style={{ textAlign: "center", marginBottom: 10 }}>Monthly Report</h2>
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Month</th>
                <th style={thtd}>Total IN</th>
                <th style={thtd}>Total OUT</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyReport).length === 0 && emptyRow(3, "No data")}
              {Object.entries(monthlyReport)
                .slice((monthlyPage - 1) * PAGE_SIZE, monthlyPage * PAGE_SIZE)
                .map(([m, v]) => (
                  <tr key={m}>
                    <td style={thtd}>{m}</td>
                    <td style={thtd}>{v.in}</td>
                    <td style={thtd}>{v.out}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div style={{ marginTop: 10 }}>
            <button disabled={monthlyPage === 1} onClick={() => setMonthlyPage(p => p - 1)}>Prev</button>
            <span style={{ margin: "0 10px" }}>Page {monthlyPage}</span>
            <button disabled={monthlyPage * PAGE_SIZE >= Object.keys(monthlyReport).length} onClick={() => setMonthlyPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
