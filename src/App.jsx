import React, { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= SIMPLE UI COMPONENTS =================
function Card({ children }) {
  return <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>{children}</div>;
}
function CardContent({ children }) {
  return <div style={{ padding: 16 }}>{children}</div>;
}

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
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);

  const PAGE_SIZE = 5;
  const [txPage, setTxPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);

  const [activeTab, setActiveTab] = useState("dashboard");

  const [editingId, setEditingId] = useState(null);
  const originalFormRef = useRef(null);

  const [form, setForm] = useState({ item_id: "", type: "IN", quantity: "", date: "", brand: "" });
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
    const { data: itemsData } = await supabase.from("items").select("id, item_name, unit_price, brand");

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

  useEffect(() => { if (session) loadData(); }, [session]);

  // ================= DASHBOARD =================
  const stockByItem = useMemo(() => {
    const map = {};
    items.forEach(i => map[i.id] = { ...i, stock: 0, value: 0 });
    transactions.forEach(t => {
      if (!map[t.item_id]) return;
      map[t.item_id].stock += t.type === "IN" ? t.quantity : -t.quantity;
      map[t.item_id].value = map[t.item_id].stock * map[t.item_id].unit_price;
    });
    return Object.values(map);
  }, [items, transactions]);

  const totalStockValue = stockByItem.reduce((s, i) => s + i.value, 0);

  // ================= SAVE =================
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
      deleted: false,
    };

    const { error } = editingId
      ? await supabase.from("inventory_transactions").update(payload).eq("id", editingId)
      : await supabase.from("inventory_transactions").insert(payload);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "" });
    setItemSearch("");
    setEditingId(null);
    originalFormRef.current = null;
    loadData();
  }

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      <h1>Inventory System</h1>

      {/* TABS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["dashboard", "transactions", "deleted", "report"].map(t => (
          <button key={t} onClick={() => { setActiveTab(t); setTxPage(1); setDeletedPage(1); setReportPage(1); }} style={{ fontWeight: activeTab === t ? "bold" : "normal" }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <>
          {/* ADD NEW ITEM */}
          <div style={{ marginBottom: 20, border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <h3>Add New Item</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="Item name" value={newItem.item_name} onChange={e => setNewItem(i => ({ ...i, item_name: e.target.value }))} />
              <input placeholder="Brand" value={newItem.brand} onChange={e => setNewItem(i => ({ ...i, brand: e.target.value }))} />
              <input type="number" placeholder="Unit price" value={newItem.unit_price} onChange={e => setNewItem(i => ({ ...i, unit_price: e.target.value }))} />
              <button onClick={addItem}>Add Item</button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            <Card><CardContent><p>Total Items</p><h2>{items.length}</h2></CardContent></Card>
            <Card><CardContent><p>Total Stock Value</p><h2>₱{totalStockValue.toFixed(2)}</h2></CardContent></Card>
            <Card>
  <CardContent>
    <p>Low Stock Items</p>
    <h2>{stockByItem.filter(i => i.stock <= 5).length}</h2>
  </CardContent>
</Card>
          </div>

          {/* STOCK TABLE */}
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Stock</th>
                <th style={thtd}>Unit Price</th>
                <th style={thtd}>Value</th>
              </tr>
            </thead>
            <tbody>
              {stockByItem.map(i => (
                <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : {}}>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>₱{i.unit_price.toFixed(2)}</td>
                  <td style={thtd}>₱{i.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}</h2></CardContent></Card>
            <Card><CardContent><p>Low Stock Items</p><h2>{stockByItem.filter(i => i.stock <= 5).length}</h2></CardContent></Card>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Stock</th>
                <th style={thtd}>Unit Price</th>
                <th style={thtd}>Value</th>
              </tr>
            </thead>
            <tbody>
              {stockByItem.map(i => (
                <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : {}}>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>₱{i.unit_price.toFixed(2)}</td>
                  <td style={thtd}>₱{i.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* TRANSACTIONS TAB */}
      {activeTab === "transactions" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <input placeholder="Item ID" value={form.item_id} onChange={e => setForm(f => ({ ...f, item_id: e.target.value }))} />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option>IN</option><option>OUT</option></select>
            <input type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            <button onClick={saveTransaction}>{editingId ? "Update" : "Save"}</button>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Type</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && emptyRow(6, "No transactions")}
              {transactions.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE).map(t => (
                <tr key={t.id} style={editingId === t.id ? editingRowStyle : {}}>
                  <td style={thtd}>{t.date}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.type}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>{t.brand}</td>
                  <td style={thtd}>
                    <button onClick={() => { setEditingId(t.id); setForm({ item_id: t.item_id, type: t.type, quantity: t.quantity, date: t.date, brand: t.brand || "" }); }}>Edit</button>
                    <button onClick={async () => { await supabase.from("inventory_transactions").update({ deleted: true, deleted_at: new Date().toISOString() }).eq("id", t.id); loadData(); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <button disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}>Prev</button>
            <span> Page {txPage} </span>
            <button disabled={txPage * PAGE_SIZE >= transactions.length} onClick={() => setTxPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}

      {/* DELETED TAB */}
      {activeTab === "deleted" && (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deletedTransactions.length === 0 && emptyRow(3, "No deleted records")}
              {deletedTransactions.slice((deletedPage - 1) * PAGE_SIZE, deletedPage * PAGE_SIZE).map(t => (
                <tr key={t.id}>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button onClick={async () => { await supabase.from("inventory_transactions").update({ deleted: false, deleted_at: null }).eq("id", t.id); loadData(); }}>Restore</button>
                    <button onClick={async () => { await supabase.from("inventory_transactions").delete().eq("id", t.id); loadData(); }}>Delete Permanently</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* REPORT TAB */}
      {activeTab === "report" && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Month</th>
              <th style={thtd}>IN</th>
              <th style={thtd}>OUT</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(transactions.reduce((a, t) => {
              const m = t.date?.slice(0, 7); if (!m) return a;
              a[m] = a[m] || { IN: 0, OUT: 0 };
              a[m][t.type] += t.quantity * t.unit_price;
              return a;
            }, {})).map(([m, v]) => (
              <tr key={m}><td style={thtd}>{m}</td><td style={thtd}>₱{v.IN.toFixed(2)}</td><td style={thtd}>₱{v.OUT.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
