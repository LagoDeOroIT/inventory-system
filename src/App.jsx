import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// SUPABASE CONFIG
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: "8px", textAlign: "left" };

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>
      {text}
    </td>
  </tr>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    date: "",
    brand: "",
    unit: "",
  });

  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  // AUTH
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // LOAD DATA
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price");

    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .or("deleted.is.null,deleted.eq.false")
      .order("date", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  // SAVE
  async function saveTransaction() {
    if (!form.item_id || !form.quantity) {
      alert("Complete the form");
      return;
    }

    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return;

    const payload = {
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: item.id,
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: item.unit_price,
      brand: form.brand,
      unit: form.unit,
    };

    if (editingId) {
      await supabase.from("inventory_transactions").update(payload).eq("id", editingId);
    } else {
      await supabase.from("inventory_transactions").insert(payload);
    }

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  function editTransaction(t) {
    setEditingId(t.id);
    setForm({
      item_id: t.item_id,
      type: t.type,
      quantity: t.quantity,
      date: t.date,
      brand: t.brand || "",
      unit: t.unit || "",
    });
    setItemSearch(t.items?.item_name || "");
  }

  // CLICK OUTSIDE DROPDOWN
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      <h1>Inventory System</h1>

      <div ref={searchRef} style={{ position: "relative", width: 220 }}>
        <input
          placeholder="Search item..."
          value={itemSearch}
          onFocus={() => setDropdownOpen(true)}
          onChange={e => {
            setItemSearch(e.target.value);
            setDropdownOpen(true);
          }}
        />

        {dropdownOpen && (
          <div style={{ border: "1px solid #ccc", background: "#fff" }}>
            {items
              .filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase()))
              .map(i => (
                <div
                  key={i.id}
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

      <div style={{ marginTop: 10 }}>
        <label>Brand</label><br />
        <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />

        <br /><label>Unit</label><br />
        <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
      </div>

      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
      </select>

      <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />

      <button onClick={saveTransaction}>{editingId ? "Update" : "Save"}</button>

      <h2>Transactions</h2>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Date</th>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Unit</th>
            <th style={thtd}>Type</th>
            <th style={thtd}>Qty</th>
            <th style={thtd}>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 && emptyRow(7, "No transactions yet")}
          {transactions.map(t => (
            <tr key={t.id}>
              <td style={thtd}>{t.date}</td>
              <td style={thtd}>{t.items?.item_name}</td>
              <td style={thtd}>{t.brand || "-"}</td>
              <td style={thtd}>{t.unit || "-"}</td>
              <td style={thtd}>{t.type}</td>
              <td style={thtd}>{t.quantity}</td>
              <td style={thtd}>
                <button onClick={() => editTransaction(t)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Stock Summary</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Item</th>
            <th style={thtd}>Stock</th>
            <th style={thtd}>Total Value</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && emptyRow(3, "No stock data")}
          {items.map(i => {
            const stock = transactions
              .filter(t => t.item_id === i.id)
              .reduce((sum, t) => sum + (t.type === "IN" ? t.quantity : -t.quantity), 0);

            return (
              <tr key={i.id}>
                <td style={thtd}>{i.item_name}</td>
                <td style={thtd}>{stock}</td>
                <td style={thtd}>{stock * i.unit_price}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Monthly Report</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Item</th>
            <th style={thtd}>Total IN</th>
            <th style={thtd}>Total OUT</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && emptyRow(3, "No report data")}
          {items.map(i => {
            const monthly = transactions.filter(t => t.item_id === i.id);
            const totalIn = monthly.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
            const totalOut = monthly.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);

            return (
              <tr key={i.id}>
                <td style={thtd}>{i.item_name}</td>
                <td style={thtd}>{totalIn}</td>
                <td style={thtd}>{totalOut}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
