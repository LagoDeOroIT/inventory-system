import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔧 SUPABASE CONFIG
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ item_id: "", type: "IN", quantity: 0, date: "" });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function loadData() {
    const { data: items } = await supabase.from("items").select("*");
    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)");

    setItems(items || []);
    setTransactions(tx || []);
  }

  async function addTransaction() {
    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Select item");

    const stock = transactions
      .filter(t => t.item_id === item.id && t.id !== editingId)
      .reduce((sum, t) => sum + (t.type === "IN" ? t.quantity : -t.quantity), 0);

    if (form.type === "OUT" && stock < Number(form.quantity)) {
      return alert("Not enough stock");
    }

    if (editingId) {
      const { error } = await supabase
        .from("inventory_transactions")
        .update({
          date: form.date || new Date().toISOString().slice(0,10),
          item_id: item.id,
          type: form.type,
          quantity: Number(form.quantity),
          unit_price: item.unit_price,
        })
        .eq("id", editingId);

      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from("inventory_transactions").insert({
        date: form.date || new Date().toISOString().slice(0,10),
        item_id: item.id,
        type: form.type,
        quantity: Number(form.quantity),
        unit_price: item.unit_price,
      });

      if (error) return alert(error.message);
    }

    setForm({ item_id: "", type: "IN", quantity: 0, date: "" });
    setEditingId(null);
    loadData();
  }

  // 🗑️ DELETE TRANSACTION
  async function deleteTransaction(id) {
    const ok = window.confirm("Delete this transaction?");
    if (!ok) return;

    const { error } = await supabase
      .from("inventory_transactions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadData();
  }

  // 📊 STOCK SUMMARY
  const stockByItem = items.map(item => {
    const stock = transactions
      .filter(t => t.item_id === item.id)
      .reduce((sum, t) => sum + (t.type === "IN" ? t.quantity : -t.quantity), 0);

    return {
      ...item,
      stock,
      totalValue: stock * item.unit_price,
    };
  });

  // 📅 MONTHLY REPORT FILTER
  const [reportMonth, setReportMonth] = useState("");

  const monthlyReport = items.map(item => {
    const filtered = transactions.filter(t =>
      t.item_id === item.id &&
      (!reportMonth || t.date?.startsWith(reportMonth))
    );

    const totalIn = filtered
      .filter(t => t.type === "IN")
      .reduce((s, t) => s + t.quantity, 0);

    const totalOut = filtered
      .filter(t => t.type === "OUT")
      .reduce((s, t) => s + t.quantity, 0);

    return {
      item_name: item.item_name,
      totalIn,
      totalOut,
    };
  });

  if (!session) {
  return (
    <div style={{ padding: 30 }}>
      <h2>Inventory Login</h2>
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
        Login
      </button>
    </div>
  );
}

  return (
  <div style={{ padding: 20 }}>
    <h1>Inventory System</h1>

    {/* ADD TRANSACTION */}
    <div>
      <select
        value={form.item_id}
        onChange={e => setForm({ ...form, item_id: e.target.value })}
      >
        <option value="">Select Item</option>
        {items.map(i => (
          <option key={i.id} value={i.id}>
            {i.item_name}
          </option>
        ))}
      </select>

      <select
        value={form.type}
        onChange={e => setForm({ ...form, type: e.target.value })}
      >
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
      </select>

      <input
        type="number"
        value={form.quantity}
        onChange={e => setForm({ ...form, quantity: e.target.value })}
      />

      <input
        type="date"
        value={form.date}
        onChange={e => setForm({ ...form, date: e.target.value })}
      />

      <button onClick={addTransaction}>
        {editingId ? "Update" : "Save"}
      </button>
    </div>

    {/* TRANSACTIONS TABLE */}
    <table border="1" cellPadding="5">
      <thead>
        <tr>
          <th>Date</th>
          <th>Item</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(t => (
          <tr key={t.id}>
            <td>{t.date}</td>
            <td>{t.items?.item_name}</td>
            <td>{t.type}</td>
            <td>{t.quantity}</td>
            <td>{t.unit_price}</td>
            <td>
              <button onClick={() => deleteTransaction(t.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* STOCK SUMMARY */}
    <h2>Current Stock Summary</h2>
    <table border="1" cellPadding="5">
      <thead>
        <tr>
          <th>Item</th>
          <th>Stock</th>
          <th>Unit Price</th>
          <th>Total Value</th>
        </tr>
      </thead>
      <tbody>
        {stockByItem.map(i => (
          <tr key={i.id}>
            <td>{i.item_name}</td>
            <td>{i.stock}</td>
            <td>{i.unit_price}</td>
            <td>{i.totalValue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

}

