import React from "react";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔧 STEP A: PUT YOUR SUPABASE KEYS HERE
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ item_id: "", type: "IN", quantity: 0, date: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    const { data: items } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions").select("*, items(item_name)");
    setItems(items || []);
    setTransactions(tx || []);
  }

  async function addTransaction() {
    const item = items.find(i => i.id === form.item_id);
    if (!item) return alert("Select item");

    // prevent negative stock
    const stock = transactions
      .filter(t => t.item_id === form.item_id)
      .reduce((sum, t) => sum + (t.type === "IN" ? t.quantity : -t.quantity), 0);

    if (form.type === "OUT" && stock < Number(form.quantity)) {
      return alert("Not enough stock");
    }

    await supabase.from("inventory_transactions").insert({
      date: form.date,
      item_id: form.item_id,
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
    });

    setForm({ item_id: "", type: "IN", quantity: 0, date: "" });
    loadData();
  }

  if (!session) {
      // 📊 COMPUTED STOCK PER ITEM
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

  return (
      <div style={{ padding: 40 }}>
        <h2>Inventory Login</h2>
        <button onClick={() => supabase.auth.signInWithPassword({ email: prompt("Email"), password: prompt("Password") })}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Inventory System</h2>

      <div style={{ marginBottom: 20 }}>
        <select value={form.item_id} onChange={e => setForm({ ...form, item_id: e.target.value })}>
          <option value="">Select Item</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
        </select>

        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
        </select>

        <input type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <button onClick={addTransaction}>Save</button>
      </div>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Type</th>
            <th>Qty</th>
            <th>Unit Price</th>
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
            </tr>
          ))}
        </tbody>
            </table>

      <h3 style={{ marginTop: 30 }}>Current Stock Summary</h3>
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
