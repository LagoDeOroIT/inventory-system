import React, { useEffect, useRef, useState } from "react";     
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const editingRowStyle = {
  background: "#fef3c7"
};

const inRowStyle = {
  background: "#f0fdf4" // subtle green
};

const outRowStyle = {
  background: "#fef2f2" // subtle red
}; // highlight edited row

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

export default function App() {
  // ================= CONFIRM MODAL STATE =================
(() => {
    setInSearch("");
  }, [inFilter]);

  useEffect(() => {
    if (session) loadData();
  }, [session]);

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

  const filteredItemsForSearch = items.filter(i => {
    if (selectedStockRoom === "All Stock Rooms") return false;
    return (
      i.location === selectedStockRoom &&
      i.item_name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  });

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
      .select("id, item_name, unit_price, brand, location");

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

    const { data: stockData, error: stockError } = await supabase
      .from("stock_inventory")
      .select(`
        id,
        quantity,
        brand,
        volume_pack,
        items (
          item_name,
          unit_price
        )
      `);

    if (stockError) {
      console.error(stockError);
    }

    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);

    setStockInventory(
      (stockData || []).map(row => ({
        id: row.id,
        item_name: row.items?.item_name,
        unit_price: row.items?.unit_price || 0,
        brand: row.brand,
        volume_pack: row.volume_pack,
        stock: row.quantity,
      }))
    );
  }
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
  if (!selectedItem || !quantity) return;

  // 1️⃣ Save transaction (IN / OUT)
  const { error: txError } = await supabase
    .from("inventory_transactions")
    .insert([
      {
        item_id: selectedItem.id,
        type: transactionType,
        quantity: Number(quantity),
        brand,
        volume_pack,
        unit_price: Number(unitPrice) || 0,
        date
      }
    ]);

  if (txError) {
    console.error(txError);
    return;
  }

  // 2️⃣ Check stock inventory for SAME item + SAME brand
  const { data: existingStock, error: stockError } = await supabase
    .from("stock_inventory")
    .select("id, quantity")
    .eq("item_id", selectedItem.id)
    .eq("brand", brand)
    .maybeSingle();

  if (stockError) {
    console.error(stockError);
    return;
  }

  if (existingStock) {
    // 🔁 Update quantity if same item + same brand
    await supabase
      .from("stock_inventory")
      .update({
        quantity:
          transactionType === "IN"
            ? existingStock.quantity + Number(quantity)
            : existingStock.quantity - Number(quantity)
      })
      .eq("id", existingStock.id);
  } else {
    // ➕ Insert new stock row if brand is different
    await supabase.from("stock_inventory").insert([
      {
        item_id: selectedItem.id,
        brand,
        volume_pack,
        quantity: transactionType === "IN" ? Number(quantity) : -Number(quantity)
      }
    ]);
  }

  resetForm();
  fetchData();
}

  const handleSaveItem = async () => {
  if (!selectedStockRoom || selectedStockRoom === "All Stock Rooms") {
    alert("Please select a stock room first");
    return;
  }

  const payload = {
    item_name: newItem.item_name,
    brand: newItem.brand,
    unit_price: Number(newItem.unit_price) || 0,
    location: selectedStockRoom,
  };

  const { error } = isEditingItem && editingItemId
    ? await supabase.from("items").update(payload).eq("id", editingItemId)
    : await supabase.from("items").insert([payload]);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setNewItem({ item_name: "", brand: "", unit_price: "", location: selectedStockRoom });
  setIsEditingItem(false);
  setStockEditItem(null);
  setShowAddItem(false);
  loadData();
};

  // ================= FILTERED TRANSACTIONS =================
  const filteredTransactions = transactions.filter(t => {
    if (selectedStockRoom === "All Stock Rooms") return true;
    return t.location === selectedStockRoom;
  });

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
    <div style={{ padding: 20 }}>

      {/* ===== STOCK ROOM SELECTOR ===== */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#374151" }}>Stock Room</label>
          <select style={{ width: "100%", height: 34 }}             value={selectedStockRoom}
            onChange={e => setSelectedStockRoom(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }}
          >
            {stockRooms.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Lago De Oro Inventory System</h1>
        <p style={{ fontSize: 12, marginTop: 0, color: "#6b7280" }}>Manage stock IN / OUT and reports</p>
      </div>

      
<div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
  <div style={{ display: "flex", gap: 16, padding: 8, background: "#f3f4f6", borderRadius: 999 }}>
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
      <h3 style={{ margin: 0 }}>Inventory Transaction Entry</h3>
      <p style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
        Record inbound and outbound stock movements to maintain accurate inventory records.
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
      gridTemplateColumns: "minmax(260px,2.5fr) minmax(140px,1.1fr) minmax(140px,1fr) minmax(180px,1.2fr) minmax(180px,1.4fr) minmax(150px,1.1fr)",
      gap: 12,
      marginTop: 12,
      alignItems: "center",
      position: "relative",
    }}
  >
    <div style={{ position: "relative" }}>
      <input style={{ width: "100%", height: 34 }}         placeholder="Search by item name or SKU"
        value={itemSearch}
        onChange={e => {
          setItemSearch(e.target.value);
          setDropdownOpen(true);
        }}
        onFocus={() => setDropdownOpen(true)}
      />

      {dropdownOpen && (
        <div>
          {filteredItemsForSearch.map(i => (
            <div
              key={i.id}
              onMouseDown={() => {
                setForm(f => ({ ...f, item_id: i.id }));
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

    <select style={{ width: "100%", height: 34 }}       value={form.type}
      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
    >
      <option value="IN">Inbound</option>
      <option value="OUT">Outbound</option>
    </select>

    <input style={{ width: "100%", height: 34 }}   placeholder="Quantity (Units)"
  value={form.quantity}
  onChange={e => setForm({ ...form, quantity: e.target.value })}
/>

<input style={{ width: "100%", height: 34 }}   placeholder="Brand / Manufacturer"
  value={form.brand || ""}
  onChange={e => setForm({ ...form, brand: e.target.value })}
/>

    <input style={{ width: "100%", height: 34 }}       placeholder="Pack Size (e.g., 11 kg)"
      value={form.volume_pack}
      onChange={e => setForm(f => ({ ...f, volume_pack: e.target.value }))}
    />

    <input style={{ width: "100%", height: 34 }}       type="date"
      value={form.date}
      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
    />

    <button onClick={saveTransaction} style={{ gridColumn: "1 / -1", marginTop: 8, padding: "8px 14px", borderRadius: 6, border: "1px solid #1f2937", background: "#1f2937", color: "#fff", fontWeight: 600 }}>
      {editingId ? "Update Transaction" : "Save Transaction"}
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
                    <th style={thtd}>Brand</th>
                    <th style={thtd}>Volume / Pack</th>
                    <th style={thtd}>Unit Price</th>
                    <th style={thtd}>Quantity</th>
                    <th style={thtd}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t => t.type === "IN").length === 0 && emptyRow(7, "No IN transactions")}
                  {filteredTransactions.filter(t => t.type === "IN").map(t => (
                    <tr
  key={t.id}
  style={
    editingId === t.id
      ? editingRowStyle
      : t.type === "IN"
      ? inRowStyle
      : outRowStyle
  }
>
                      <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
                      <td style={thtd}>{t.items?.item_name}</td>
                      <td style={thtd}>{t.brand || "—"}</td>
                      <td style={thtd}>{t.volume_pack || "—"}</td>
                      <td style={thtd}>₱{Number(t.unit_price || 0).toFixed(2)}</td>
                      <td style={thtd}>{t.quantity}</td>
                      <td style={thtd}>...</td>
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
                    <th style={thtd}>Brand</th>
                    <th style={thtd}>Volume / Pack</th>
                    <th style={thtd}>Unit Price</th>
                    <th style={thtd}>Stock Value</th>
                    <th style={thtd}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t => t.type === "OUT").length === 0 && emptyRow(7, "No OUT transactions")}
                  {filteredTransactions.filter(t => t.type === "OUT").map(t => (
                    <tr
  key={t.id}
  style={
    editingId === t.id
      ? editingRowStyle
      : t.type === "IN"
      ? inRowStyle
      : outRowStyle
  }
>
                      <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
                      <td style={thtd}>{t.items?.item_name}</td>
                      <td style={thtd}>{t.brand || "—"}</td>
                      <td style={thtd}>{t.volume_pack || "—"}</td>
                      <td style={thtd}>₱{Number(t.unit_price || 0).toFixed(2)}</td>
                      <td style={thtd}>₱{(t.quantity * (t.unit_price || 0)).toFixed(2)}</td>
                      <td style={thtd}>...</td>
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
            <input style={{ width: "100%", height: 34 }}               placeholder="Search deleted items, brand, or quantity"
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
                    <th style={thtd}>Volume Pack</th>
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
                      <td style={thtd}>{t.volume_pack || "—"}</td>
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
        {/* STOCK INVENTORY HEADER */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 5,
            paddingBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h2 style={{ marginBottom: 4 }}>📦 Stock Inventory</h2>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Total items: {stockInventory.length} | Low stock:{" "}
              {stockInventory.filter(i => i.stock <= 5).length}
            </span>
          </div>
          <hr style={{ marginTop: 8 }} />
        </div>

        {/* STOCK TABLE */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Item</th>
                <th style={thtd}>Brand</th>
                <th style={thtd}>Volume Pack</th>
                <th style={thtd}>Current Stock</th>
                <th style={thtd}>Unit Price</th>
                <th style={thtd}>Stock Value</th>
                <th style={thtd}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockInventory.length === 0 && emptyRow(6, "No stock data")}
              {stockInventory.map(i => (
                <tr
                  key={i.id}
                  style={i.stock <= 5 ? { background: "#fee2e2" } : undefined}
                >
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.brand || "—"}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>₱{Number(i.unit_price || 0).toFixed(2)}</td>
                  <td style={thtd}>
                    ₱{(i.stock * (i.unit_price || 0)).toFixed(2)}
                  </td>
                  <td style={thtd}>
                    <button
                      style={{ marginRight: 6 }}
                      onClick={() =>
                        openConfirm("Edit this item?", () => {
                          setIsEditingItem(true);
                          setStockEditItem(i);
                          setEditingItemId(i.id);
                          setNewItem({
                            item_name: i.item_name,
                            brand: i.brand || "",
                            unit_price: i.unit_price,
                          });
                        })
                      }
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() =>
                        openConfirm(
                          "Permanently delete this item? This cannot be undone.",
                          async () => {
                            await supabase.from("items").delete().eq("id", i.id);
                            loadData();
                          }
                        )
                      }
                    >
                      🗑️ Delete
                    </button>
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
