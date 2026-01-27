import React, { useEffect, useRef, useState } from "react";    
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const card = {
  background: "#ffffff",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  marginTop: 10,
  fontSize: 13,
};

const thtd = {
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
};

const editingRowStyle = { background: "#fef3c7" }; // highlight edited row

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

export default function App() {
  // ===== CONFIRM MODAL STATE =====
  const [confirm, setConfirm] = useState(null);
  const openConfirm = (message, onConfirm) => {
    setConfirm({ message, onConfirm });
  };
  const closeConfirm = () => setConfirm(null);
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [deletedSearch, setDeletedSearch] = useState("");
  const [inSearch, setInSearch] = useState("");
  const [inFilter, setInFilter] = useState("all");
  const [outSearch, setOutSearch] = useState("");
  const [outFilter, setOutFilter] = useState("all");

  // reset search when filter changes
  useEffect(() => {
    setInSearch("");
  }, [inFilter]);

  useEffect(() => {
    setOutSearch("");
  }, [outFilter]);

  // tabs
  const [activeTab, setActiveTab] = useState("stock");

  // ===== STOCK ROOMS =====
  const stockRooms = [
    "All Stock Rooms",
    "L1",
    "L2 Room 1",
    "L2 Room 2",
    "L2 Room 3",
    "L2 Room 4",
    "L3",
    "L5",
    "L6",
    "L7",
    "Maintenance Bodega 1",
    "Maintenance Bodega 2",
    "Maintenance Bodega 3",
    "SKI Stock Room",
    "Quarry Stock Room",
  ];

  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");


  // form
  const [showForm, setShowForm] = useState(false);
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

  // item search
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
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price, brand");

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

    // NOTE: stock room filtering is applied at render level
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  // ================= SAVE =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(k => String(originalFormRef.current[k] || "") !== String(form[k] || ""));
  }

  async function saveTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");
    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Item not found");

    if (form.type === "OUT") {
      const stockItem = stockInventory.find(i => i.id === item.id);
      if (stockItem && Number(form.quantity) > stockItem.stock) {
        alert("Cannot OUT more than available stock");
        return;
      }
    }

    const payload = {
      location: selectedStockRoom === "All Stock Rooms" ? null : selectedStockRoom,
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
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // ================= ADD NEW ITEM (STOCK TAB) =================

  const [showAddItem, setShowAddItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [stockEditItem, setStockEditItem] = useState(null);

  const [newItem, setNewItem] = useState({
    item_name: "",
    brand: "",
    unit_price: "",
    initial_quantity: "",
    location: "",
  });

  async function handleSaveItem() {
    if (!newItem.item_name || !newItem.unit_price) {
      alert("Item name and unit price are required");
      return;
    }

    const { data: insertedItem, error } = isEditingItem && stockEditItem
      ? await supabase
          .from("items")
          .update({
            item_name: newItem.item_name,
            brand: newItem.brand || null,
            unit_price: Number(newItem.unit_price),
          })
          .eq("id", stockEditItem.id)
          .select()
      : await supabase
          .from("items")
          .insert({
            item_name: newItem.item_name,
            brand: newItem.brand || null,
            unit_price: Number(newItem.unit_price),
          })
          .select();

    if (error) return alert(error.message);

    const itemId = isEditingItem ? stockEditItem.id : insertedItem[0].id;

    if (newItem.initial_quantity && newItem.location) {
      await supabase.from("inventory_transactions").insert({
        item_id: itemId,
        type: "IN",
        quantity: Number(newItem.initial_quantity),
        date: new Date().toISOString().slice(0, 10),
        unit_price: Number(newItem.unit_price),
        brand: newItem.brand || null,
        location: newItem.location,
        deleted: false,
      });
    }

    setNewItem({ item_name: "", brand: "", unit_price: "", initial_quantity: "", location: "" });
    setIsEditingItem(false);
    setStockEditItem(null);
    setShowAddItem(false);
    loadData();
  }

  // ================= STOCK INVENTORY =================
  const filteredTransactions = selectedStockRoom === "All Stock Rooms"
    ? transactions
    : transactions.filter(t => t.location === selectedStockRoom);

  const stockInventory = items.map(item => {
    const related = filteredTransactions.filter(t => t.item_id === item.id);
    const qtyIn = related.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
    const qtyOut = related.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);
    return {
      ...item,
      stock: qtyIn - qtyOut,
    };
  });

  // ================= DASHBOARD SUMMARY METRICS =================
  const totalItems = stockInventory.length;
  const totalStockQty = stockInventory.reduce((s, i) => s + i.stock, 0);
  const lowStockCount = stockInventory.filter(i => i.stock <= 5).length;
  const totalStockValue = stockInventory.reduce((s, i) => s + i.stock * (i.unit_price || 0), 0);

  // ================= MONTHLY TOTALS =================
  const monthlyTotals = filteredTransactions.reduce((acc, t) => {
    if (!t.date) return acc;
    const month = t.date.slice(0, 7);
    acc[month] = acc[month] || { IN: 0, OUT: 0 };
    acc[month][t.type] += t.quantity * t.unit_price;
    return acc;
  }, {});

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
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>

      {/* ===== STOCK ROOM SELECTOR ===== */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#374151" }}>Stock Room</label>
          <select
            value={selectedStockRoom}
            onChange={e => setSelectedStockRoom(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }}
          >
            {stockRooms.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0, fontWeight: 600 }}>Lago De Oro Inventory</h1>
          <p style={{ fontSize: 13, margin: "4px 0 0", color: "#6b7280" }}>Inventory, transactions, and reports dashboard</p>
        </div>
      </div>

      
<div style={{ marginBottom: 24 }}>
  <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb" }}>
    {[{ id: "stock", label: "Inventory" }, { id: "transactions", label: "Transactions" }, { id: "report", label: "Monthly Report" }, { id: "deleted", label: "Delete History" }].map(tab => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        style={{
          padding: "10px 16px",
          fontSize: 13,
          fontWeight: 600,
          border: "none",
          background: "transparent",
          borderBottom: activeTab === tab.id ? "3px solid #1f2937" : "3px solid transparent",
          color: activeTab === tab.id ? "#111827" : "#6b7280",
          cursor: "pointer",
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
</div>

      
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, width: 360, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Confirm Action</h3>
            <p style={{ marginBottom: 24, color: "#444" }}>{confirm.message}</p>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button style={{ flex: 1, background: "#1f2937", color: "#fff", padding: "8px 0", borderRadius: 4 }} onClick={() => { confirm.onConfirm(); closeConfirm(); }}>Confirm</button>
              <button style={{ flex: 1, background: "#e5e7eb", padding: "8px 0", borderRadius: 4 }} onClick={closeConfirm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      
      {activeTab === "transactions" && (
        <>
          <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 5, paddingBottom: 8 }}>
  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
    <h2 style={{ fontSize: 16, marginTop: 16, marginBottom: 4 }}>📄 Transactions History</h2>
    <span style={{ fontSize: 12, color: "#6b7280" }}>Total records: {transactions.length}</span>
  </div>
  <hr style={{ marginTop: 8 }} />
</div>
          <div style={{ marginBottom: 20, border: "1px solid #e5e7eb", padding: 16, borderRadius: 8 }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <h3 style={{ margin: 0 }}>Record Inventory Transaction</h3>
      <p style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
        Log incoming and outgoing stock movements for accurate inventory tracking.
      </p>
    </div>
    <button
      onClick={() => setShowForm(v => !v)}
      style={{
        background: "#1f2937",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "6px 14px",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {showForm ? "Hide" : "Add Transaction"}
    </button>
  </div>

  {showForm && (
    <div
      ref={searchRef}
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
        gap: 10,
        marginTop: 12,
        alignItems: "center",
      }}
    >
      <input
        placeholder="Search item"
        value={itemSearch}
        onChange={e => {
          setItemSearch(e.target.value);
          setDropdownOpen(true);
        }}
      />
      <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
      </select>
      <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      <button onClick={saveTransaction}>
        {editingId ? "Update" : "Save"}
      </button>
    </div>
  )}
</div>

<div style={{ display: "flex", gap: 16 }}>

            
            <div style={{ flex: 1, maxHeight: 400, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8 }}>
              <h4 style={{ marginTop: 0, textAlign: "center" }}>⬇️ IN Transactions</h4>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: "#6b7280" }}>Filter</label>
                <select
                  value={inFilter}
                  onChange={e => setInFilter(e.target.value)}
                  style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }}
                >
                  <option value="all">All</option>
                  <option value="item">Item</option>
                  <option value="brand">Brand</option>
                  <option value="quantity">Quantity</option>
                </select>
                <input
                  placeholder="Search"
                  value={inSearch}
                  onChange={e => setInSearch(e.target.value)}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                />
              </div>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thtd}>Date</th>
                    <th style={thtd}>Item</th>
                    <th style={thtd}>Qty</th>
                    <th style={thtd}>Brand</th>
                    <th style={thtd}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t => t.type === "IN").length === 0 && emptyRow(5, "No IN transactions")}
                  {transactions
                    .filter(t => t.type === "IN")
                    .filter(t => {
                      const q = inSearch.toLowerCase();
                      if (!q) return true;
                      if (inFilter === "item") return t.items?.item_name?.toLowerCase().includes(q);
                      if (inFilter === "brand") return t.brand?.toLowerCase().includes(q);
                      if (inFilter === "quantity") return String(t.quantity).includes(q);
                      return (
                        t.items?.item_name?.toLowerCase().includes(q) ||
                        t.brand?.toLowerCase().includes(q) ||
                        String(t.quantity).includes(q)
                      );
                    })
                    .map(t => (
                    <tr key={t.id} style={editingId === t.id ? editingRowStyle : undefined}>
                      <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
                      <td style={thtd}>{t.items?.item_name}</td>
                      <td style={thtd}>{t.quantity}</td>
                      <td style={thtd}>{t.brand}</td>
                      <td style={thtd}>
                        <button disabled={editingId && editingId !== t.id} onClick={() => openConfirm("Edit this transaction?", () => {
                          originalFormRef.current = { item_id: t.item_id, type: t.type, quantity: String(t.quantity), date: t.date, brand: t.brand || "", unit: t.unit || "", volume_pack: t.volume_pack || "" };
                          setEditingId(t.id);
                          setForm(originalFormRef.current);
                          setItemSearch(t.items?.item_name || "");
                          setShowForm(true);
                          setActiveTab("transactions");
                        })}>✏️ Edit</button>
                        <button disabled={!!editingId} onClick={() => openConfirm("Delete this transaction?", async () => {
                          await supabase.from("inventory_transactions").update({ deleted: true, deleted_at: new Date().toISOString() }).eq("id", t.id);
                          loadData();
                        })}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            
            <div style={{ flex: 1, maxHeight: 400, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8 }}>
              <h4 style={{ marginTop: 0, textAlign: "center" }}>⬆️ OUT Transactions</h4>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: "#6b7280" }}>Filter</label>
                <select
                  value={outFilter}
                  onChange={e => setOutFilter(e.target.value)}
                  style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }}
                >
                  <option value="all">All</option>
                  <option value="item">Item</option>
                  <option value="brand">Brand</option>
                  <option value="quantity">Quantity</option>
                </select>
                <input
                  placeholder="Search"
                  value={outSearch}
                  onChange={e => setOutSearch(e.target.value)}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                />
              </div>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thtd}>Date</th>
                    <th style={thtd}>Item</th>
                    <th style={thtd}>Qty</th>
                    <th style={thtd}>Brand</th>
                    <th style={thtd}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t => t.type === "OUT").length === 0 && emptyRow(5, "No OUT transactions")}
                  {transactions
                    .filter(t => t.type === "OUT")
                    .filter(t => {
                      const q = outSearch.toLowerCase();
                      return (
                        t.items?.item_name?.toLowerCase().includes(q) ||
                        t.brand?.toLowerCase().includes(q) ||
                        String(t.quantity).includes(q)
                      );
                    })
                    .map(t => (
                    <tr key={t.id} style={editingId === t.id ? editingRowStyle : undefined}>
                      <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
                      <td style={thtd}>{t.items?.item_name}</td>
                      <td style={thtd}>{t.quantity}</td>
                      <td style={thtd}>{t.brand}</td>
                      <td style={thtd}>
                        <button disabled={editingId && editingId !== t.id} onClick={() => openConfirm("Edit this transaction?", () => {
                          originalFormRef.current = { item_id: t.item_id, type: t.type, quantity: String(t.quantity), date: t.date, brand: t.brand || "", unit: t.unit || "", volume_pack: t.volume_pack || "" };
                          setEditingId(t.id);
                          setForm(originalFormRef.current);
                          setItemSearch(t.items?.item_name || "");
                          setShowForm(true);
                          setActiveTab("transactions");
                        })}>✏️ Edit</button>
                        <button disabled={!!editingId} onClick={() => openConfirm("Delete this transaction?", async () => {
                          await supabase.from("inventory_transactions").update({ deleted: true, deleted_at: new Date().toISOString() }).eq("id", t.id);
                          loadData();
                        })}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
          
        </>
      )}

      {activeTab === "deleted" && (
        <>
          <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 5, paddingBottom: 8 }}>
  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
    <h2 style={{ marginBottom: 4 }}>🗑️ Delete History</h2>
    <span style={{ fontSize: 12, color: "#6b7280" }}>Deleted records: {deletedTransactions.length}</span>
  </div>
  <hr style={{ marginTop: 8 }} />
</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <input
              placeholder="Search deleted items, brand, or quantity"
              value={deletedSearch}
              onChange={e => setDeletedSearch(e.target.value)}
              style={{
                padding: "8px 12px",
                width: 320,
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Date</th>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Qty</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deletedTransactions.length === 0 && emptyRow(5, "No deleted records")}
              {deletedTransactions
                .filter(t => {
                  const q = deletedSearch.toLowerCase();
                  return (
                    t.items?.item_name?.toLowerCase().includes(q) ||
                    t.brand?.toLowerCase().includes(q) ||
                    String(t.quantity).includes(q)
                  );
                })
                .map(t => (
                <tr key={t.id}>
                  <td style={thtd}>{new Date(t.deleted_at || t.date).toLocaleDateString("en-CA")}</td>
                  <td style={thtd}>{t.items?.item_name}</td>
                  <td style={thtd}>{t.brand}</td>
                  <td style={thtd}>{t.quantity}</td>
                  <td style={thtd}>
                    <button onClick={() => openConfirm("Restore this transaction?", async () => {
                      await supabase.from("inventory_transactions").update({ deleted: false, deleted_at: null }).eq("id", t.id);
                      loadData();
                    })}>♻️ Restore</button>
                    <button onClick={() => openConfirm("Permanently delete this transaction?", async () => {
                      await supabase.from("inventory_transactions").delete().eq("id", t.id);
                      loadData();
                    })}>❌ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          
        </>
      )}

      {activeTab === "report" && (
        <>
          <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 5, paddingBottom: 8 }}>
  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
    <h2 style={{ marginBottom: 4 }}>📊 Monthly Report</h2>
    <span style={{ fontSize: 12, color: "#6b7280" }}>Months tracked: {Object.keys(monthlyTotals).length}</span>
  </div>
  <hr style={{ marginTop: 8 }} />
</div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Month</th>
                <th style={thtd}>IN Total</th>
                <th style={thtd}>OUT Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlyTotals).length === 0 && emptyRow(3, "No data")}
              {Object.entries(monthlyTotals)
                .map(([m, v]) => (
                  <tr key={m}>
                    <td style={thtd}>{m}</td>
                    <td style={thtd}>₱{v.IN.toFixed(2)}</td>
                    <td style={thtd}>₱{v.OUT.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        </>
      )}

     {activeTab === "stock" && (
  <>
    {/* ===== DASHBOARD SUMMARY CARDS ===== */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
      <div style={{ ...card, padding: 16 }}>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Total Items</div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>{totalItems}</div>
      </div>
      <div style={{ ...card, padding: 16 }}>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Total Stock Quantity</div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>{totalStockQty}</div>
      </div>
      <div style={{ ...card, padding: 16, borderColor: lowStockCount ? "#fca5a5" : "#e5e7eb" }}>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Low Stock Items</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: lowStockCount ? "#b91c1c" : "#111827" }}>{lowStockCount}</div>
      </div>
      <div style={{ ...card, padding: 16 }}>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Total Stock Value</div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>₱{totalStockValue.toFixed(2)}</div>
      </div>
    </div>

    {/* ===== STOCK INVENTORY TABLE ===== */}
    <div style={{ maxHeight: 400, overflowY: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtd}>Item</th>
            <th style={thtd}>Brand</th>
            <th style={thtd}>Current Stock</th>
            <th style={thtd}>Unit Price</th>
            <th style={thtd}>Stock Value</th>
          </tr>
        </thead>
        <tbody>
          {stockInventory.length === 0 && emptyRow(5, "No stock data")}
          {stockInventory.map(i => (
            <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : undefined}>
              <td style={thtd}>{i.item_name}</td>
              <td style={thtd}>{i.brand}</td>
              <td style={thtd}>{i.stock}</td>
              <td style={thtd}>₱{Number(i.unit_price || 0).toFixed(2)}</td>
              <td style={thtd}>₱{(i.stock * (i.unit_price || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)
    </div>
  );
}
