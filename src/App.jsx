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
      : await supabase.from("inventory_transactions").insert([payload]);

    if (error) return alert(error.message);

    setForm({ item_id: "", type: "IN", quantity: "", date: "", brand: "", unit: "", volume_pack: "" });
    setItemSearch("");
    setEditingId(null);
    loadData();
  }

  // ================= STOCK INVENTORY =================
  const stockInventory = items
  .filter(i => selectedStockRoom === "All Stock Rooms" || i.location === selectedStockRoom)
  .map(i => {
    const related = transactions.filter(t => t.item_id === i.id);
    const stock = related.reduce((sum, t) => sum + (t.type === "IN" ? t.quantity : -t.quantity), 0);
    return { ...i, stock };
  });

  // ================= ADD NEW ITEM (STOCK TAB) =================

  const [showAddItem, setShowAddItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [stockEditItem, setStockEditItem] = useState(null);

  const [newItem, setNewItem] = useState({
  item_name: "",
  brand: "",
  unit_price: "",
  
  location: selectedStockRoom !== "All Stock Rooms" ? selectedStockRoom : "",
});

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
  const filteredTransactions = Array.isArray(transactions) ? transactions : [];

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
  </div>

  {showForm && (
  <div
    ref={searchRef}
    style={{
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
      gap: 10,
      marginTop: 12,
      alignItems: "center",
      position: "relative",
    }}
  >
    <div style={{ position: "relative" }}>
      <input
        placeholder="Search item"
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

    <select
      value={form.type}
      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
    >
      <option value="IN">IN</option>
      <option value="OUT">OUT</option>
    </select>

    <input
      type="number"
      placeholder="Quantity"
      value={form.quantity}
      onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
    />

    <input
      placeholder="Volume Pack (e.g. 11kg)"
      value={form.volume_pack}
      onChange={e => setForm(f => ({ ...f, volume_pack: e.target.value }))}
    />

    <input
      type="date"
      value={form.date}
      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
    />

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
              <table className="inventory-table" style={{ tableLayout: 'fixed', width: '100%' }} style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thtd}>Date</th>
                    <th style={thtd}>Item</th>
<th style={thtd}>Brand</th>
<th style={thtd}>Current Stock</th>
<th style={thtd}>Unit Price</th>
<th style={thtd}>Stock Value</th>
<th style={thtd}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions
  .filter(t => t.type === "IN")
  .filter(t => {
    if (filter === "All") return true;
    return t.item === filter;
  })
  .map(t => (
                    <tr key={t.id} style={editingId === t.id ? editingRowStyle : undefined}>
                      <td style={thtd}>{new Date(t.date).toLocaleDateString("en-CA")}</td>
                      <td style={thtd}>{t.items?.item_name}</td>
                      <td style={thtd}>{t.quantity}</td>
                      <td style={thtd}>{t.brand}</td>
                      <td style={thtd}>{t.volume_pack || "—"}</td>
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
              <table className="inventory-table" style={{ tableLayout: 'fixed', width: '100%' }} style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thtd}>Date</th>
                    <th style={thtd}>Item</th>
                    <th style={thtd}>Qty</th>
                    <th style={thtd}>Brand</th>
                    <th style={thtd}>Volume Pack</th>
                    <th style={thtd}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.filter(t => t.type === "OUT").length === 0 && emptyRow(5, "<tr><td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>No OUT transactions</td></tr>")}
                  {filteredTransactions.filter(t => t.type === "OUT")
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
                      <td style={thtd}>{t.volume_pack || "—"}</td>
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
          <table className="inventory-table" style={{ tableLayout: 'fixed', width: '100%' }} style={tableStyle}>
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
          <table className="inventory-table" style={{ tableLayout: 'fixed', width: '100%' }} style={tableStyle}>
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

    <div
      style={{
        marginBottom: 16,
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0 }}>Create New Inventory Item</h3>
          <p style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
            Register a new product or supply into the inventory system.
          </p>
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
          <table className="inventory-table" style={{ tableLayout: 'fixed', width: '100%' }} style={tableStyle}>
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
                <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : undefined}>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.item_name}</td>
                  <td style={thtd}>{i.stock}</td>
                  <td style={thtd}>₱{Number(i.unit_price || 0).toFixed(2)}</td>
                  <td style={thtd}>₱{(i.stock * (i.unit_price || 0)).toFixed(2)}</td>
                  <td style={thtd}>
                     <button
                        style={{ marginRight: 6 }}
                        onClick={() => openConfirm("Edit this item?", () => {
                        setIsEditingItem(true);
                        setStockEditItem(i);
                        setEditingItemId(i.id);
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
