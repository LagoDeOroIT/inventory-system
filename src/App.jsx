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
function ItemManager({ onAdded, editRef }) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!editRef) return;
    editRef.current = (item) => {
      setEditingId(item.id);
      setName(item.item_name);
      setBrand(item.brand || "");
      setPrice(item.unit_price);
    };
  }, [editRef]);

  async function saveItem() {
    if (!name || !price) return alert("Item name and price required");

    const payload = {
      item_name: name,
      brand: brand || null,
      unit_price: Number(price),
    };

    const { error } = editingId
      ? await supabase.from("items").update(payload).eq("id", editingId)
      : await supabase.from("items").insert(payload);

    if (error) return alert(error.message);

    setEditingId(null);
    setName("");
    setBrand("");
    setPrice("");
    onAdded();
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input placeholder="Item name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Brand" value={brand} onChange={e => setBrand(e.target.value)} />
      <input type="number" placeholder="Unit price" value={price} onChange={e => setPrice(e.target.value)} />
      <button onClick={saveItem}>{editingId ? "Update Item" : "Add Item"}</button>
    </div>
  );
}

// ================= MAIN APP =================
export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const editItemRef = useRef(null);

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
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
      <div style={{ border: "1px solid #ddd", padding: 15, marginBottom: 30 }}>
        <h2>Item Menu</h2>
        <ItemManager onAdded={loadData} editRef={editItemRef} />

        <table style={tableStyle}>
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
                <td style={thtd}>₱{Number(i.unit_price).toFixed(2)}</td>
                <td style={thtd}>
                  <button onClick={() => editItemRef.current(i)}>✏️</button>
                  <button onClick={async () => {
                    if (!window.confirm("Delete this item?")) return;
                    await supabase.from("items").delete().eq("id", i.id);
                    loadData();
                  }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TRANSACTIONS */}
      <h2>Transactions</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Date</th>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 && emptyRow(4, "No transactions")}
          {transactions.map(t => (
            <tr key={t.id}>
              <td style={thtd}>{t.date}</td>
              <td style={thtd}>{t.items?.item_name}</td>
              <td style={thtd}>{t.brand}</td>
              <td style={thtd}>{t.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DELETE HISTORY */}
      <h2 style={{ marginTop: 40 }}>Delete History</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Date</th>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {deletedTransactions.length === 0 && emptyRow(4, "No deleted records")}
          {deletedTransactions.map(t => (
            <tr key={t.id}>
              <td style={thtd}>{t.deleted_at || t.date}</td>
              <td style={thtd}>{t.items?.item_name}</td>
              <td style={thtd}>{t.brand}</td>
              <td style={thtd}>{t.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MONTHLY REPORT */}
      <h2 style={{ marginTop: 40 }}>Monthly Report</h2>
      <p>Uses same transaction data (grouping logic can be expanded safely now)</p>
    </div>
  );
}
