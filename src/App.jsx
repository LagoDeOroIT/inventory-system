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
}
