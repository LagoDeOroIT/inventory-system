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

// ================= ITEM MANAGER =================
function ItemManager({ onAdded, onEditRef }) {
  const [editingItemId, setEditingItemId] = useState(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!onEditRef) return;
    onEditRef.current = (item) => {
      setEditingItemId(item.id);
      setName(item.item_name);
      setBrand(item.brand || "");
      setPrice(item.unit_price);
    };
  }, [onEditRef]);

  async function addOrUpdateItem() {
    if (!name || !price) return alert("Item name and price required");

    const payload = {
      item_name: name,
      brand: brand || null,
      unit_price: Number(price),
    };

    const { error } = editingItemId
      ? await supabase.from("items").update(payload).eq("id", editingItemId)
      : await supabase.from("items").insert(payload);

    if (error) return alert(error.message);

    setEditingItemId(null);
    setName("");
    setBrand("");
    setPrice("");
    onAdded && onAdded();
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input placeholder="Item name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Brand" value={brand} onChange={e => setBrand(e.target.value)} />
      <input type="number" placeholder="Unit price" value={price} onChange={e => setPrice(e.target.value)} />
      <button onClick={addOrUpdateItem}>{editingItemId ? "Update Item" : "Add Item"}</button>
    </div>
  );
}

// ================= MAIN APP =================
export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const editItemRef = useRef(null);

  const currencySymbol = "₱";
  const formatMoney = (v) => `${currencySymbol}${new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2 }).format(Number(v || 0))}`;

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
    const { data: itemsData } = await supabase.from("items").select("id, item_name, brand, unit_price");
    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .order("date", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  // ================= SAVE TRANSACTION =================
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
      brand: item.brand,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
    };

    const { error } = await supabase.from("inventory_transactions").insert(payload);
    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    loadData();
  }

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
      <h1 style={{ textAlign: "center" }}>Inventory System</h1>

      {/* ITEM MENU */}
      <div style={{ border: "1px solid #ddd", padding: 15, marginBottom: 20 }}>
        <h2>Item Menu</h2>
        <ItemManager onAdded={loadData} onEditRef={editItemRef} />

        <table style={{ ...tableStyle, marginTop: 15, fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thtd}>Item</th>
              <th style={thtd}>Brand</th>
              <th style={thtd}>Unit Price</th>
              <th style={thtd}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && emptyRow(4, "No items yet")}
            {items.map(i => (
              <tr key={i.id}>
                <td style={thtd}>{i.item_name}</td>
                <td style={thtd}>{i.brand}</td>
                <td style={thtd}>{formatMoney(i.unit_price)}</td>
                <td style={thtd}>
                  <button onClick={() => editItemRef.current(i)}>✏️</button>
                  <button onClick={async () => {
                    await supabase.from("items").delete().eq("id", i.id);
                    loadData();
                  }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TRANSACTION FORM */}
      <div ref={searchRef} style={{ position: "relative", width: 250 }}>
        <input
          value={itemSearch}
          placeholder="Search item"
          onFocus={() => setDropdownOpen(true)}
          onChange={e => { setItemSearch(e.target.value); setDropdownOpen(true); }}
        />
        {dropdownOpen && (
          <div style={{ border: "1px solid #ccc", background: "#fff" }}>
            {items.filter(i => i.item_name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
              <div key={i.id} onClick={() => {
                setForm({ ...form, item_id: i.id });
                setItemSearch(`${i.item_name} (${i.brand})`);
                setDropdownOpen(false);
              }}>{i.item_name} ({i.brand})</div>
            ))}
          </div>
        )}
      </div>

      <input placeholder="Unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
      <input placeholder="Volume / Pack" value={form.volume_pack} onChange={e => setForm({ ...form, volume_pack: e.target.value })} />
      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>IN</option><option>OUT</option></select>
      <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
      <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      <button onClick={saveTransaction}>Save</button>

      {/* TRANSACTIONS */}
      <h2 style={{ textAlign: "center", marginTop: 30 }}>Transactions</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Date</th>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Qty</th>
            <th style={thtd}>Total</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 && emptyRow(5, "No transactions")}
          {transactions.map(t => (
            <tr key={t.id}>
              <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
              <td style={thtd}>{t.items?.item_name}</td>
              <td style={thtd}>{t.brand}</td>
              <td style={thtd}>{t.quantity}</td>
              <td style={thtd}>{formatMoney(t.quantity * t.unit_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
