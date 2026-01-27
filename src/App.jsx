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
  const [transactions, set"📦 Stock Inventory"
  </button>

  <button class="nav-btn" data-page="transactions">
    "📄 Transactions"
  </button>

  <button class="nav-btn" data-page="monthly">
    "📊 Monthly Report"
  </button>

  <button class="nav-btn" data-page="deleted">
    "🗑 Deleted History"
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
      "📊 Monthly Report"
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
      "📦 Stock Inventory"
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
    <h2 style={{ fontSize: 16, marginTop: 16, marginBottom: 4 }}>"📄 Transactions" History</h2>
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
    <h2 style={{ marginBottom: 4 }}>"📊 Monthly Report"</h2>
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
        <h2 style={{ marginBottom: 4 }}>"📦 Stock Inventory"</h2>
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
              <input type="number" placeholder="Initial quantity" value={newItem.initial_quantity} onChange={e => setNewItem(n => ({ ...n, initial_quantity: e.target.value }))} />
              <select value={newItem.location} onChange={e => setNewItem(n => ({ ...n, location: e.target.value }))}>
                <option value="">Select stock room</option>
                {stockRooms.filter(r => r !== "All Stock Rooms").map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
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
