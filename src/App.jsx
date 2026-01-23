import React, { useEffect, useRef, useState } from "react";   
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const editingRowStyle = { background: "#fff7ed" }; // highlight edited row

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

  // tabs
  const [activeTab, setActiveTab] = useState("transactions");


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
  });

  async function handleSaveItem() {
    if (!newItem.item_name || !newItem.unit_price) {
      alert("Item name and unit price are required");
      return;
    }

    if (isEditingItem && stockEditItem) {
      const { error } = await supabase
        .from("items")
        .update({
          item_name: newItem.item_name,
          brand: newItem.brand || null,
          unit_price: Number(newItem.unit_price),
        })
        .eq("id", stockEditItem.id);

      if (error) return alert(error.message);
    } else {
      const { error } = await supabase.from("items").insert({
        item_name: newItem.item_name,
        brand: newItem.brand || null,
        unit_price: Number(newItem.unit_price),
      });

      if (error) return alert(error.message);
    }

    setNewItem({ item_name: "", brand: "", unit_price: "" });
    setIsEditingItem(false);
    setStockEditItem(null);
    setShowAddItem(false);
    loadData();
  }

  // ================= STOCK INVENTORY =================
  const stockInventory = items.map(item => {
    const related = transactions.filter(t => t.item_id === item.id);
    const qtyIn = related.filter(t => t.type === "IN").reduce((s, t) => s + t.quantity, 0);
    const qtyOut = related.filter(t => t.type === "OUT").reduce((s, t) => s + t.quantity, 0);
    return {
      ...item,
      stock: qtyIn - qtyOut,
    };
  });

  // ================= MONTHLY TOTALS =================
  const monthlyTotals = transactions.reduce((acc, t) => {
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
    <div style={{ padding: 20 }}>

      {/* MAIN HEADER */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ marginBottom: 4, fontSize: 32 }}>Lago De Oro Inventory System</h1>
        <p style={{ marginTop: 0, color: "#555" }}>Manage stock IN / OUT and reports</p>
      </div>

      {/* 
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ marginBottom: 4, fontSize: 32 }}>Lago De Oro Inventory System</h1>
        <p style={{ marginTop: 0, color: "#555" }}>Manage stock IN / OUT and reports</p>
      </div>

      {/* TABS */}
<div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
  <div style={{ display: "flex", gap: 12, padding: 8, background: "#f3f4f6", borderRadius: 999 }}>
    <button
      onClick={() => {
        if (editingId && isFormChanged()) {
          openConfirm("Discard unsaved changes?", () => {
            setEditingId(null);
            originalFormRef.current = null;
            setActiveTab("transactions");
          });
        } else {
          setEditingId(null);
          originalFormRef.current = null;
          setActiveTab("transactions");
        }
      }}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: activeTab === "transactions" ? "#1f2937" : "transparent",
        color: activeTab === "transactions" ? "#fff" : "#374151",
        fontWeight: 500,
      }}
    >
      📄 Transactions
    </button>

    <button
      onClick={() => {
        if (editingId && isFormChanged()) {
          openConfirm("Discard unsaved changes?", () => {
            setEditingId(null);
            originalFormRef.current = null;
            setActiveTab("deleted");
          });
        } else {
          setEditingId(null);
          originalFormRef.current = null;
          setActiveTab("deleted");
        }
      }}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: activeTab === "deleted" ? "#1f2937" : "transparent",
        color: activeTab === "deleted" ? "#fff" : "#374151",
        fontWeight: 500,
      }}
    >
      🗑️ Deleted History
    </button>

    <button
      onClick={() => {
        if (editingId && isFormChanged()) {
          openConfirm("Discard unsaved changes?", () => {
            setEditingId(null);
            originalFormRef.current = null;
            setActiveTab("report");
          });
        } else {
          setEditingId(null);
          originalFormRef.current = null;
          setActiveTab("report");
        }
      }}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: activeTab === "report" ? "#1f2937" : "transparent",
        color: activeTab === "report" ? "#fff" : "#374151",
        fontWeight: 500,
      }}
    >
      📊 Monthly Report
    </button>

    <button
      onClick={() => setActiveTab("stock")}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: activeTab === "stock" ? "#1f2937" : "transparent",
        color: activeTab === "stock" ? "#fff" : "#374151",
        fontWeight: 500,
      }}
    >
      📦 Stock Inventory
    </button>
  </div>
</div>

      {/* CONFIRM MODAL */}
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

      {/* TRANSACTIONS TAB */}
      {activeTab === "transactions" && (
        <>
          <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 5, paddingBottom: 8 }}>
  <h2 style={{ marginBottom: 4, textAlign: "center" }}>📄 Transactions History</h2>
  <div style={{ textAlign: "center", color: "#555", fontSize: 12 }}>Total records: {transactions.length}</div>
  <hr style={{ marginTop: 8 }} />
</div>
          <div style={{ marginBottom: 20, border: "1px solid #e5e7eb", padding: 16, borderRadius: 8 }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <h3 style={{ margin: 0 }}>Create New Inventory Item</h3>
      <p style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
        Register a new product or supply into the inventory system.
      </p>
    </div>
    <button
      onClick={() => setShowNewItemForm(v => !v)}
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
      {showNewItemForm ? "Hide" : "Add Item"}
    </button>
  </div>

  {showNewItemForm && (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr auto",
        gap: 10,
        marginTop: 12,
        alignItems: "center",
      }}
    >
      <input
        placeholder="Item name"
        value={newItem.name}
        onChange={e => setNewItem(i => ({ ...i, name: e.target.value }))}
      />
      <input
        placeholder="Brand"
        value={newItem.brand}
        onChange={e => setNewItem(i => ({ ...i, brand: e.target.value }))}
      />
      <input
        type="number"
        placeholder="Unit price"
        value={newItem.price}
        onChange={e => setNewItem(i => ({ ...i, price: e.target.value }))}
      />
      <button onClick={addNewItem}>
        Save Item
      </button>
    </div>
  )}
</div>
              <button
                onClick={() => setShowAddItem(v => !v)}
                style={{
                  background: "#1f2937",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {showAddItem ? "Hide" : "Show"}
              </button>
            </div>
            {showAddItem && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="Item name" value={newItem.item_name} onChange={e => setNewItem(n => ({ ...n, item_name: e.target.value }))} />
              <input placeholder="Brand" value={newItem.brand} onChange={e => setNewItem(n => ({ ...n, brand: e.target.value }))} />
              <input type="number" placeholder="Unit price" value={newItem.unit_price} onChange={e => setNewItem(n => ({ ...n, unit_price: e.target.value }))} />
              <button onClick={handleSaveItem}>{isEditingItem ? "Update Item" : "Add Item"}</button>
                        </div>
          )}
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Current Stock</th>
                <th style={thtd}>Unit Price</th>
                <th style={thtd}>Stock Value</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockInventory.length === 0 && emptyRow(6, "No stock data")}
              {stockInventory.map(i => (
                <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : undefined}>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>₱{Number(i.unit_price || 0).toFixed(2)}</td>
                  <td style={thtd}>₱{(i.stock * (i.unit_price || 0)).toFixed(2)}</td>
                  <td style={thtd}>
                    <button
                      style={{ marginRight: 6 }}
                      onClick={() => openConfirm("Edit this item?", () => {
                        setIsEditingItem(true);
                        setStockEditItem(i);
                        setNewItem({
                          item_name: i.item_name,
                          brand: i.brand || "",
                          unit_price: i.unit_price,
                        });
                        setShowAddItem(true);
                      })}
                    >✏️ Edit</button>
                    <button
                      onClick={() => openConfirm("Permanently delete this item? This cannot be undone.", async () => {
                        await supabase.from("items").delete().eq("id", i.id);
                        loadData();
                      })}
                    >🗑️ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
