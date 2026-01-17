import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ SUPABASE CONFIG
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: 0,
    date: "",
  });

  // 🔍 SINGLE SEARCH BAR STATE
  const [itemSearch, setItemSearch] = useState("");
  const searchRef = useRef(null);

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
  async function loadData() {
    const { data: items } = await supabase.from("items").select("*");
    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .order("date", { ascending: false });

    setItems(items || []);
    setTransactions(tx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  // ➕ ADD / ✏️ UPDATE
  async function saveTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");

    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Invalid item");

    const payload = {
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: item.id,
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
    };

    if (editingId) {
      await supabase.from("inventory_transactions").update(payload).eq("id", editingId);
    } else {
      await supabase.from("inventory_transactions").insert(payload);
    }

    setForm({ item_id: "", type: "IN", quantity: 0, date: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // 🗑 DELETE
  async function deleteTransaction(id) {
    await supabase.from("inventory_transactions").delete().eq("id", id);
    loadData();
  }

  // ✏️ EDIT
  function editTransaction(t) {
    setEditingId(t.id);
    setForm({
      item_id: t.item_id,
      type: t.type,
      quantity: t.quantity,
      date: t.date,
    });
    setItemSearch(t.items?.item_name || "");
  }

  // 📊 STOCK SUMMARY
  const stockByItem = items.map(item => {
    const stock = transactions
      .filter(t => t.item_id === item.id)
      .reduce((s, t) => s + (t.type === "IN" ? t.quantity : -t.quantity), 0);

    return { ...item, stock, total: stock * item.unit_price };
  });

  // 📅 MONTHLY REPORT
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthlyReport = items.map(item => {
    const monthlyTx = transactions.filter(
      t => t.item_id === item.id && t.date.startsWith(reportMonth)
    );

    const totalIn = monthlyTx.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
    const totalOut = monthlyTx.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

    return { ...item, totalIn, totalOut };
  });

  // 🖱 CLOSE DROPDOWN ON OUTSIDE CLICK
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔑 LOGIN
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
      <h1>Inventory System</h1>

      {/* 🔍 SEARCHABLE ITEM SELECT */}
      <div ref={searchRef} style={{ position: "relative", display: "inline-block", width: 220 }}>
        <input
          type="text"
          placeholder="Search item..."
          value={itemSearch}
          onChange={e => {
            setItemSearch(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          style={{ width: "100%" }}
        />

        {dropdownOpen && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, border: "1px solid #ccc", background: "#fff", zIndex: 10 }}>
            {items
              .filter(i => !itemSearch || i.item_name.toLowerCase().includes(itemSearch.toLowerCase()))
              .map(i => (
                <div
                  key={i.id}
                  style={{ padding: 6, cursor: "pointer" }}
                  onClick={() => {
                    setForm({ ...form, item_id: i.id });
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

      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
      </select>

      <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      <button onClick={saveTransaction}>{editingId ? "Update" : "Save"}</button>

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
              <td>
                <button onClick={() => editTransaction(t)}>Edit</button>{" "}
                <button onClick={() => deleteTransaction(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Stock Summary</h2>
      <table border="1" cellPadding="5">
        <thead><tr><th>Item</th><th>Stock</th><th>Total</th></tr></thead>
        <tbody>
          {stockByItem.map(i => (
            <tr key={i.id}><td>{i.item_name}</td><td>{i.stock}</td><td>{i.total}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Monthly Report</h2>
      <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />

      <table border="1" cellPadding="5">
        <thead><tr><th>Item</th><th>Total IN</th><th>Total OUT</th></tr></thead>
        <tbody>
          {monthlyReport.map(r => (
            <tr key={r.id}><td>{r.item_name}</td><td>{r.totalIn}</td><td>{r.totalOut}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
