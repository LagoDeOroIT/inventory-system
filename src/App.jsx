import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: "#f3f4f6" },
  sidebar: { width: 220, background: "#1f2937", color: "#fff", display: "flex", flexDirection: "column", padding: 20 },
  sidebarHeader: { fontSize: 20, fontWeight: 700, marginBottom: 24 },
  sidebarButton: (active) => ({
    background: active ? "#374151" : "transparent",
    color: "#fff",
    border: "none",
    padding: "12px 16px",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: 6,
    marginBottom: 8,
    fontWeight: 500,
  }),
  main: { flex: 1, padding: 24, position: "relative" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: "#111827" },
  newButton: { background: "#1f2937", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 },
  dropdown: { position: "absolute", top: 60, right: 24, background: "#fff", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 100 },
  dropdownButton: { width: "100%", padding: "10px 16px", border: "none", textAlign: "left", cursor: "pointer", background: "#fff" },
  card: { background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginBottom: 24 },
  table: { width: "100%", borderCollapse: "collapse" },
  thtd: { border: "1px solid #e5e7eb", padding: 12, textAlign: "left" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", marginBottom: 12 },
  toggleGroup: { display: "flex", gap: 12, marginBottom: 12 },
  toggleButton: (active) => ({
    flex: 1,
    padding: "8px 0",
    borderRadius: 6,
    border: active ? "none" : "1px solid #d1d5db",
    background: active ? "#1f2937" : "#fff",
    color: active ? "#fff" : "#374151",
    cursor: "pointer",
    fontWeight: 600,
  }),
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "#fff", padding: 24, borderRadius: 12, width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  emptyRow: { textAlign: "center", padding: 12, color: "#6b7280" },
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
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const [formItem, setFormItem] = useState({ item_name: "", brand: "", unit: "", unit_price: "", location: "" });
  const [formTx, setFormTx] = useState({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "" });

  // ================= STOCK ROOMS =================
  const stockRooms = ["All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7","Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"];
  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions").select("*").eq("deleted", false).order("date", { ascending: false });
    const { data: deletedTx } = await supabase.from("inventory_transactions").select("*").eq("deleted", true).order("deleted_at", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => { if (session) loadData(); }, [session]);

  // ================= STOCK INVENTORY =================
  const stockInventory = items.map(i => {
    const related = transactions.filter(t => t.item_id === i.id);
    const stock = related.reduce((sum, t) => sum + (t.type==="IN"? Number(t.quantity):-Number(t.quantity)),0);
    return { ...i, stock };
  });

  // ================= HANDLE FORM =================
  const handleSubmitItem = async () => {
    if(!formItem.item_name || !formItem.unit || !formItem.unit_price) return alert("Please fill required fields");
    await supabase.from("items").insert([formItem]);
    setShowItemForm(false);
    setFormItem({ item_name: "", brand: "", unit: "", unit_price: "", location: "" });
    loadData();
  };

  const handleSubmitTx = async () => {
    if(!formTx.item_id || !formTx.quantity || !formTx.unit_price || !formTx.date) return alert("Please fill required fields");
    await supabase.from("inventory_transactions").insert([formTx]);
    setShowTransactionForm(false);
    setFormTx({ item_id: "", type: "IN", quantity: "", unit_price: "", date: "" });
    loadData();
  };

  if(!session) return (
    <div style={{ padding:40, textAlign:"center" }}>
      <h2>Inventory Login</h2>
      <button style={styles.newButton} onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>Lago De Oro</div>
        <button style={styles.sidebarButton(activeTab==="stock")} onClick={()=>setActiveTab("stock")}>📦 Stock Inventory</button>
        <button style={styles.sidebarButton(activeTab==="transactions")} onClick={()=>setActiveTab("transactions")}>📄 Transactions</button>
        <button style={styles.sidebarButton(activeTab==="deleted")} onClick={()=>setActiveTab("deleted")}>🗑️ Deleted History</button>
        <button style={styles.sidebarButton(activeTab==="report")} onClick={()=>setActiveTab("report")}>📊 Monthly Report</button>
      </div>

      {/* Main */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>{activeTab==="stock"?"Stock Inventory":activeTab==="transactions"?"Transactions":activeTab==="deleted"?"Deleted History":"Monthly Report"}</div>
          {/* NEW BUTTON */}
          <div style={{ position:"relative" }}>
            <button style={styles.newButton} onClick={()=>setShowNewMenu(prev=>!prev)}>+ NEW</button>
            {showNewMenu && (
              <div style={styles.dropdown}>
                <button style={styles.dropdownButton} onClick={()=>{setShowItemForm(true); setShowNewMenu(false);}}>Add New Item</button>
                <button style={styles.dropdownButton} onClick={()=>{setShowTransactionForm(true); setShowNewMenu(false);}}>Add Transaction</button>
              </div>
            )}
          </div>
        </div>

        {/* Stock Room Selector */}
        <div style={{ marginBottom:16 }}>
          <label>Stock Room: </label>
          <select value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
            {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* ================= STOCK TAB ================= */}
        {activeTab==="stock" && (
          <div style={styles.card}>
            <h2>📦 Stock Inventory</h2>
            <div style={{ maxHeight:400, overflowY:"auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thtd}>Available Stocks</th>
                    <th style={styles.thtd}>Item Name</th>
                    <th style={styles.thtd}>Brand</th>
                    <th style={styles.thtd}>Unit</th>
                    <th style={styles.thtd}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {stockInventory.length===0 && emptyRow(5,"No stock data")}
                  {stockInventory.map(i=>(
                    <tr key={i.id}>
                      <td style={styles.thtd}>{i.stock}</td>
                      <td style={styles.thtd}>{i.item_name}</td>
                      <td style={styles.thtd}>{i.brand}</td>
                      <td style={styles.thtd}>{i.unit}</td>
                      <td style={styles.thtd}>₱{i.unit_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TRANSACTIONS TAB ================= */}
        {activeTab==="transactions" && (
          <div style={styles.card}>
            <h2>📄 Transactions</h2>
            <div style={{ maxHeight:400, overflowY:"auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thtd}>Date</th>
                    <th style={styles.thtd}>Item</th>
                    <th style={styles.thtd}>Type</th>
                    <th style={styles.thtd}>Qty</th>
                    <th style={styles.thtd}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length===0 && emptyRow(5,"No transactions")}
                  {transactions.map(t=>(
                    <tr key={t.id}>
                      <td style={styles.thtd}>{t.date}</td>
                      <td style={styles.thtd}>{items.find(i=>i.id===t.item_id)?.item_name || "—"}</td>
                      <td style={styles.thtd}>{t.type}</td>
                      <td style={styles.thtd}>{t.quantity}</td>
                      <td style={styles.thtd}>₱{t.unit_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= DELETED TAB ================= */}
        {activeTab==="deleted" && (
          <div style={styles.card}>
            <h2>🗑️ Deleted History</h2>
            <div style={{ maxHeight:400, overflowY:"auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thtd}>Date</th>
                    <th style={styles.thtd}>Item</th>
                    <th style={styles.thtd}>Type</th>
                    <th style={styles.thtd}>Qty</th>
                    <th style={styles.thtd}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedTransactions.length===0 && emptyRow(5,"No deleted records")}
                  {deletedTransactions.map(t=>(
                    <tr key={t.id}>
                      <td style={styles.thtd}>{t.date}</td>
                      <td style={styles.thtd}>{items.find(i=>i.id===t.item_id)?.item_name || "—"}</td>
                      <td style={styles.thtd}>{t.type}</td>
                      <td style={styles.thtd}>{t.quantity}</td>
                      <td style={styles.thtd}>₱{t.unit_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MONTHLY REPORT TAB ================= */}
        {activeTab==="report" && (
          <div style={styles.card}>
            <h2>📊 Monthly Report</h2>
            <p>Coming Soon...</p>
          </div>
        )}

        {/* ================= MODALS ================= */}
        {showItemForm && (
          <div style={styles.modalOverlay} onClick={()=>setShowItemForm(false)}>
            <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
              <h3>New Item</h3>
              <input style={styles.input} placeholder="Item Name" value={formItem.item_name} onChange={e=>setFormItem({...formItem,item_name:e.target.value})}/>
              <input style={styles.input} placeholder="Brand" value={formItem.brand} onChange={e=>setFormItem({...formItem,brand:e.target.value})}/>
              <input style={styles.input} placeholder="Unit" value={formItem.unit} onChange={e=>setFormItem({...formItem,unit:e.target.value})}/>
              <input style={styles.input} placeholder="Unit Price" type="number" value={formItem.unit_price} onChange={e=>setFormItem({...formItem,unit_price:e.target.value})}/>
              <select style={styles.input} value={formItem.location} onChange={e=>setFormItem({...formItem,location:e.target.value})}>
                <option value="">Select Stock Room</option>
                {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                <button style={styles.newButton} onClick={()=>setShowItemForm(false)}>Cancel</button>
                <button style={styles.newButton} onClick={handleSubmitItem}>Submit</button>
              </div>
            </div>
          </div>
        )}

        {showTransactionForm && (
          <div style={styles.modalOverlay} onClick={()=>setShowTransactionForm(false)}>
            <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
              <h3>New Transaction</h3>
              <select style={styles.input} value={formTx.item_id} onChange={e=>setFormTx({...formTx,item_id:e.target.value})}>
                <option value="">Select Item</option>
                {items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}
              </select>
              <div style={styles.toggleGroup}>
                <button style={styles.toggleButton(formTx.type==="IN")} onClick={()=>setFormTx({...formTx,type:"IN"})}>IN</button>
                <button style={styles.toggleButton(formTx.type==="OUT")} onClick={()=>setFormTx({...formTx,type:"OUT"})}>OUT</button>
              </div>
              <input style={styles.input} type="number" placeholder="Quantity" value={formTx.quantity} onChange={e=>setFormTx({...formTx,quantity:e.target.value})}/>
              <input style={styles.input} type="number" placeholder="Unit Price" value={formTx.unit_price} onChange={e=>setFormTx({...formTx,unit_price:e.target.value})}/>
              <input style={styles.input} type="date" placeholder="Date" value={formTx.date} onChange={e=>setFormTx({...formTx,date:e.target.value})}/>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                <button style={styles.newButton} onClick={()=>setShowTransactionForm(false)}>Cancel</button>
                <button style={styles.newButton} onClick={handleSubmitTx}>Submit</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
