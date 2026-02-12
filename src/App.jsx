import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: "#f3f4f6" },
  sidebar: { width: 220, background: "#1f2937", color: "#fff", display: "flex", flexDirection: "column", padding: 20 },
  sidebarTitle: { fontSize: 18, fontWeight: 700, marginBottom: 24, textAlign: "center" },
  sidebarButton: (active) => ({
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 12,
    background: active ? "#374151" : "transparent",
    color: "#fff",
    cursor: "pointer",
    textAlign: "left",
    border: "none",
    fontWeight: active ? 700 : 500,
  }),
  main: { flex: 1, padding: 30 },
  header: { marginBottom: 24 },
  card: { background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginBottom: 24 },
  buttonPrimary: { background: "#1f2937", color: "#fff", padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", marginBottom: 12, fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: 12, borderBottom: "2px solid #e5e7eb", color: "#374151" },
  td: { padding: 12, borderBottom: "1px solid #e5e7eb", color: "#4b5563" },
  emptyRow: { textAlign: "center", padding: 16, color: "#6b7280" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "#fff", padding: 28, borderRadius: 12, width: "420px", boxShadow: "0 6px 20px rgba(0,0,0,0.2)" },
  toggleGroup: { display: "flex", gap: 12, marginBottom: 12 },
  toggleButton: (active) => ({
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: active ? "none" : "1px solid #d1d5db",
    background: active ? "#1f2937" : "#fff",
    color: active ? "#fff" : "#374151",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  }),
};

// ================= EMPTY ROW =================
const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={styles.emptyRow}>{text}</td>
  </tr>
);

export default function App() {
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");
  const [inSearch, setInSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "", brand: "", unit: "", volume_pack: "" });

  // ================= STOCK ROOMS =================
  const stockRooms = [
    "All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7",
    "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("id, item_name, unit_price, brand, location, unit");
    const { data: tx } = await supabase.from("inventory_transactions")
      .select("*, items(item_name, unit, brand, unit_price, location)")
      .eq("deleted", false)
      .order("date", { ascending: false });
    const { data: deletedTx } = await supabase.from("inventory_transactions")
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

  // ================= FILTERED DATA =================
  const filteredTransactions = transactions.filter(t => selectedStockRoom === "All Stock Rooms" || t.items?.location === selectedStockRoom);
  const stockInventory = items.map(i => {
    const related = transactions.filter(t => t.item_id === i.id);
    const stock = related.reduce((sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)), 0);
    const latestTx = related.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    return { 
      id: i.id, 
      item_name: i.item_name, 
      brand: latestTx?.brand || i.brand || "—", 
      unit: latestTx?.unit || i.unit || "—", 
      unit_price: Number(latestTx?.unit_price ?? i.unit_price ?? 0), 
      stock,
    };
  });

  // ================= HANDLE FORM =================
  const handleFormChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const handleSubmit = async () => {
    if (!form.item_id || !form.quantity || !form.unit_price || !form.date) return alert("Please fill all required fields");
    if (editingId) {
      await supabase.from("inventory_transactions").update(form).eq("id", editingId);
    } else {
      await supabase.from("inventory_transactions").insert([form]);
    }
    setShowForm(false);
    setForm({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "", brand: "", unit: "", volume_pack: "" });
    loadData();
  };

  if (!session) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Inventory Login</h2>
      <button style={styles.buttonPrimary} onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}>Login with Google</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>Lago De Oro</div>
        <button style={styles.sidebarButton(activeTab === "stock")} onClick={() => setActiveTab("stock")}>📦 Stock Inventory</button>
        <button style={styles.sidebarButton(activeTab === "transactions")} onClick={() => setActiveTab("transactions")}>📄 Transactions</button>
        <button style={styles.sidebarButton(activeTab === "deleted")} onClick={() => setActiveTab("deleted")}>🗑️ Deleted History</button>
        <button style={styles.sidebarButton(activeTab === "report")} onClick={() => setActiveTab("report")}>📊 Monthly Report</button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <h1>{activeTab === "stock" ? "Stock Inventory" :
               activeTab === "transactions" ? "Transactions" :
               activeTab === "deleted" ? "Deleted History" : "Monthly Report"}</h1>
        </div>

        {/* Stock Room Selector */}
        {activeTab !== "report" && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, marginRight: 10 }}>Stock Room:</label>
            <select style={styles.input} value={selectedStockRoom} onChange={e => setSelectedStockRoom(e.target.value)}>
              {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}

        {/* Render active tab */}
        {activeTab === "stock" && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Available Stocks</th>
                  <th style={styles.th}>Item Name</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Unit</th>
                  <th style={styles.th}>Price (₱)</th>
                </tr>
              </thead>
              <tbody>
                {stockInventory.length === 0 && emptyRow(5, "No stock data available")}
                {stockInventory.map(i => (
                  <tr key={i.id} style={i.stock <= 5 ? { background: "#fee2e2" } : {}}>
                    <td style={styles.td}>{i.stock}</td>
                    <td style={styles.td}>{i.item_name}</td>
                    <td style={styles.td}>{i.brand}</td>
                    <td style={styles.td}>{i.unit}</td>
                    <td style={styles.td}>₱{i.unit_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "transactions" && (
          <div style={styles.card}>
            <button style={styles.buttonPrimary} onClick={() => setShowForm(true)}>+ Add Transaction</button>
            <input style={styles.input} placeholder="Search by item, type, or date..." value={inSearch} onChange={e => setInSearch(e.target.value)} />
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Price (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions
                    .filter(t => {
                      const search = inSearch.toLowerCase();
                      return t.items?.item_name.toLowerCase().includes(search) || t.type.toLowerCase().includes(search) || t.date.includes(search);
                    })
                    .map(t => (
                      <tr key={t.id}>
                        <td style={styles.td}>{t.date}</td>
                        <td style={styles.td}>{t.items?.item_name}</td>
                        <td style={styles.td}>{t.type}</td>
                        <td style={styles.td}>{t.quantity}</td>
                        <td style={styles.td}>₱{t.unit_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  {filteredTransactions.filter(t => {
                    const search = inSearch.toLowerCase();
                    return t.items?.item_name.toLowerCase().includes(search) || t.type.toLowerCase().includes(search) || t.date.includes(search);
                  }).length === 0 && emptyRow(5, "No matching transactions")}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "deleted" && (
          <div style={styles.card}>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date Deleted</th>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedTransactions.length === 0 && emptyRow(4, "No deleted transactions")}
                  {deletedTransactions.map(t => (
                    <tr key={t.id}>
                      <td style={styles.td}>{t.deleted_at?.split("T")[0]}</td>
                      <td style={styles.td}>{t.items?.item_name}</td>
                      <td style={styles.td}>{t.type}</td>
                      <td style={styles.td}>{t.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "report" && (
          <div style={styles.card}>
            <p>📊 Monthly Report feature coming soon…</p>
          </div>
        )}

        {/* ================= MODAL FORM ================= */}
        {showForm && (
          <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <h3>{editingId ? "Edit Transaction" : "New Transaction"}</h3>

              <input style={styles.input} list="items-list" placeholder="Select item..." value={form.item_id} onChange={e => handleFormChange("item_id", e.target.value)} />
              <datalist id="items-list">
                {items.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
              </datalist>

              <div style={styles.toggleGroup}>
                <button style={styles.toggleButton(form.type === "IN")} onClick={() => handleFormChange("type", "IN")}>IN</button>
                <button style={styles.toggleButton(form.type === "OUT")} onClick={() => handleFormChange("type", "OUT")}>OUT</button>
              </div>

              <input style={styles.input} type="number" placeholder="Quantity" value={form.quantity} onChange={e => handleFormChange("quantity", e.target.value)} />
              <input style={styles.input} type="number" placeholder="Unit Price" value={form.unit_price} onChange={e => handleFormChange("unit_price", e.target.value)} />
              <input style={styles.input} type="date" placeholder="Date" value={form.date} onChange={e => handleFormChange("date", e.target.value)} />
              <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e => handleFormChange("brand", e.target.value)} />
              <input style={styles.input} placeholder="Unit" value={form.unit} onChange={e => handleFormChange("unit", e.target.value)} />
              <input style={styles.input} placeholder="Volume / Pack" value={form.volume_pack} onChange={e => handleFormChange("volume_pack", e.target.value)} />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button style={styles.buttonSecondary} onClick={() => setShowForm(false)}>Cancel</button>
                <button style={styles.buttonPrimary} onClick={handleSubmit}>{editingId ? "Update" : "Submit"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
