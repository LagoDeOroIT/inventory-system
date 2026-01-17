import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ SUPABASE CONFIG (ANON PUBLIC KEY REQUIRED)
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x"; // <-- replace
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ item_id: "", type: "IN", quantity: 0, date: "" });

  // 🔐 AUTH
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // 📥 LOAD DATA
  useEffect(() => {
    if (!session) return;

    const load = async () => {
      const { data: items } = await supabase.from("items").select("*");
      const { data: tx } = await supabase
        .from("inventory_transactions")
        .select("*, items(item_name)");

      setItems(items || []);
      setTransactions(tx || []);
    };

    load();
  }, [session]);

  // ➕ ADD TRANSACTION
  async function addTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");

    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Invalid item");

    const { error } = await supabase.from("inventory_transactions").insert({
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: item.id,
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
    });

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: 0, date: "" });

    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)");
    setTransactions(tx || []);
  }

  // 🗑 DELETE
  async function deleteTransaction(id) {
    await supabase.from("inventory_transactions").delete().eq("id", id);
    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)");
    setTransactions(tx || []);
  }

  // 📊 STOCK SUMMARY
  const stockByItem = items.map(item => {
    const stock = transactions
      .filter(t => t.item_id === item.id)
      .reduce((s, t) => s + (t.type === "IN" ? t.quantity : -t.quantity), 0);

    return { ...item, stock, total: stock * item.unit_price };
  });

  // 📅 MONTHLY REPORT (CURRENT MONTH)
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyReport = items.map(item => {
    const monthlyTx = transactions.filter(t =>
      t.item_id === item.id && t.date.startsWith(currentMonth)
    );

    const totalIn = monthlyTx
      .filter(t => t.type === "IN")
      .reduce((s, t) => s + t.quantity, 0);

    const totalOut = monthlyTx
      .filter(t => t.type === "OUT")
      .reduce((s, t) => s + t.quantity, 0);

    return { ...item, totalIn, totalOut };
  });

(item => {
    const stock = transactions
      .filter(t => t.item_id === item.id)
      .reduce((s, t) => s + (t.type === "IN" ? t.quantity : -t.quantity), 0);

    return { ...item, stock, total: stock * item.unit_price };
  });

  // 🔑 LOGIN SCREEN
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button
          onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
        >
          Login with Google
        </button>
      </div>
    );
  }

  // 🏠 MAIN APP
  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory System</h1>

      <select value={form.item_id} onChange={e => setForm({ ...form, item_id: e.target.value })}>
        <option value="">Select Item</option>
        {items.map(i => (
          <option key={i.id} value={i.id}>{i.item_name}</option>
        ))}
      </select>

      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
      </select>

      <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      <button onClick={addTransaction}>Save</button>

      <h2>Transactions</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>Action</th></tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>{t.items?.item_name}</td>
              <td>{t.type}</td>
              <td>{t.quantity}</td>
              <td><button onClick={() => deleteTransaction(t.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Stock Summary</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr><th>Item</th><th>Stock</th><th>Total</th></tr>
        </thead>
        <tbody>
          {stockByItem.map(i => (
            <tr key={i.id}>
              <td>{i.item_name}</td>
              <td>{i.stock}</td>
              <td>{i.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Monthly Report ({currentMonth})</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr><th>Item</th><th>Total IN</th><th>Total OUT</th></tr>
        </thead>
        <tbody>
          {monthlyReport.map(r => (
            <tr key={r.id}>
              <td>{r.item_name}</td>
              <td>{r.totalIn}</td>
              <td>{r.totalOut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
