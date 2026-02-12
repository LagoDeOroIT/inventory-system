import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif", background: "#f4f5f7" },
  sidebar: { width: 200, background: "#1f2937", color: "#fff", display: "flex", flexDirection: "column", padding: 20 },
  sidebarItem: (active) => ({ padding: "12px 16px", marginBottom: 8, borderRadius: 6, cursor: "pointer", background: active ? "#374151" : "transparent" }),
  main: { flex: 1, padding: 24, position: "relative" },
  header: { fontSize: 24, fontWeight: 700, marginBottom: 24 },
  newButton: { position: "absolute", top: 24, right: 24, background: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 6, cursor: "pointer" },
  card: { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: 24 },
  table: { width: "100%", borderCollapse: "collapse" },
  thtd: { border: "1px solid #e5e7eb", padding: 8, textAlign: "left" },
  emptyRow: { textAlign: "center", padding: 12, color: "#6b7280" },
  modalOverlay: { position: "fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 },
  modalCard: { background:"#fff", padding:24, borderRadius:8, width:"400px", boxShadow:"0 4px 12px rgba(0,0,0,0.15)" },
  input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", marginBottom: 12 },
  toggleGroup: { display:"flex", gap:12, marginBottom:12 },
  toggleButton: (active) => ({
    flex:1,
    padding:"8px 0",
    borderRadius:6,
    border: active ? "none" : "1px solid #d1d5db",
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#374151",
    cursor:"pointer",
    fontWeight:600,
  }),
  buttonPrimary: { background: "#2563eb", color: "#fff", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer", marginRight: 12 },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
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
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "item" or "transaction"
  const [modalForm, setModalForm] = useState({});
  const [transactionBrandConfirm, setTransactionBrandConfirm] = useState(false);

  const stockRooms = ["All Stock Rooms","L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7",
    "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"];

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
  useEffect(() => { if(session) loadData(); }, [session]);

  // ================= HANDLERS =================
  const handleModalChange = (key, value) => setModalForm(prev=>({...prev,[key]:value}));

  const handleSubmit = async () => {
    if(modalType==="item") {
      if(!modalForm.item_name || !modalForm.brand || !modalForm.unit_price) return alert("Fill all fields");
      await supabase.from("items").insert([modalForm]);
      setShowModal(false);
      setModalForm({});
    } else if(modalType==="transaction") {
      if(!modalForm.item_id || !modalForm.quantity || !modalForm.date) return alert("Fill all fields");
      // Check brand confirmation
      const selectedItem = items.find(i=>i.id===modalForm.item_id);
      if(modalForm.brand && selectedItem && selectedItem.brand!==modalForm.brand && !transactionBrandConfirm) {
        setTransactionBrandConfirm(true);
        return;
      }
      await supabase.from("inventory_transactions").insert([modalForm]);
      setShowModal(false);
      setModalForm({});
      setTransactionBrandConfirm(false);
    }
    loadData();
  };

  if(!session) return (
    <div style={{ padding:40, textAlign:"center" }}>
      <h2>Inventory Login</h2>
      <button style={styles.buttonPrimary} onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button>
    </div>
  );

  // ================= FILTERS =================
  const filteredTransactions = transactions.filter(t=> selectedStockRoom==="All Stock Rooms" || t.location===selectedStockRoom);
  const stockInventory = items.map(i=>{
    const related = transactions.filter(t=>t.item_id===i.id);
    const stock = related.reduce((sum, t)=>sum + (t.type==="IN"? Number(t.quantity):-Number(t.quantity)),0);
    return { ...i, stock };
  });

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={{ marginBottom:24 }}>LDO Inventory</h2>
        {["stock","transactions","deleted","report"].map(tab=>(
          <div key={tab} style={styles.sidebarItem(activeTab===tab)} onClick={()=>setActiveTab(tab)}>
            {tab==="stock" && "📦 Stock Inventory"}
            {tab==="transactions" && "📄 Transactions"}
            {tab==="deleted" && "🗑️ Deleted History"}
            {tab==="report" && "📊 Monthly Report"}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={styles.main}>
        <div style={styles.header}>Welcome, Lago De Oro Inventory System</div>

        {/* NEW BUTTON */}
        <button style={styles.newButton} onClick={()=>{
          const stockRoom = prompt("Select Stock Room:", stockRooms[0]);
          if(!stockRoom) return;
          setSelectedStockRoom(stockRoom);
          const type = prompt("Type NEW ITEM or NEW TRANSACTION? (item/transaction)", "transaction");
          if(type!=="item" && type!=="transaction") return;
          setModalType(type);
          setShowModal(true);
        }}>+ NEW</button>

        {/* Tabs Content */}
        {activeTab==="stock" && (
          <div style={styles.card}>
            <h3>📦 Stock Inventory - {selectedStockRoom}</h3>
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
                    <td style={styles.thtd}>{i.unit || "-"}</td>
                    <td style={styles.thtd}>₱{i.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab==="transactions" && (
          <div style={styles.card}>
            <h3>📄 Transactions - {selectedStockRoom}</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length===0 && emptyRow(5,"No transactions")}
                {filteredTransactions.map(t=>{
                  const item = items.find(i=>i.id===t.item_id);
                  return (
                    <tr key={t.id}>
                      <td style={styles.thtd}>{t.date}</td>
                      <td style={styles.thtd}>{item?.item_name}</td>
                      <td style={styles.thtd}>{t.brand || item?.brand}</td>
                      <td style={styles.thtd}>{t.type}</td>
                      <td style={styles.thtd}>{t.quantity}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab==="deleted" && (
          <div style={styles.card}>
            <h3>🗑️ Deleted History</h3>
            <p>Coming soon...</p>
          </div>
        )}

        {activeTab==="report" && (
          <div style={styles.card}>
            <h3>📊 Monthly Report</h3>
            <p>Coming soon...</p>
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={()=>{setShowModal(false); setTransactionBrandConfirm(false)}}>
            <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
              {modalType==="item" && (
                <>
                  <h3>New Item</h3>
                  <input style={styles.input} placeholder="Item Name" value={modalForm.item_name || ""} onChange={e=>handleModalChange("item_name",e.target.value)} />
                  <input style={styles.input} placeholder="Brand" value={modalForm.brand || ""} onChange={e=>handleModalChange("brand",e.target.value)} />
                  <input style={styles.input} type="number" placeholder="Price" value={modalForm.unit_price || ""} onChange={e=>handleModalChange("unit_price",e.target.value)} />
                </>
              )}

              {modalType==="transaction" && (
                <>
                  <h3>New Transaction</h3>
                  <input style={styles.input} type="date" value={modalForm.date || ""} onChange={e=>handleModalChange("date",e.target.value)} />
                  <input style={styles.input} list="items-list" placeholder="Select Item" value={modalForm.item_id || ""} onChange={e=>handleModalChange("item_id",e.target.value)} />
                  <datalist id="items-list">
                    {items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}
                  </datalist>
                  <input style={styles.input} placeholder="Brand" value={modalForm.brand || ""} onChange={e=>handleModalChange("brand",e.target.value)} />
                  <div style={styles.toggleGroup}>
                    <button style={styles.toggleButton(modalForm.type==="IN")} onClick={()=>handleModalChange("type","IN")}>IN</button>
                    <button style={styles.toggleButton(modalForm.type==="OUT")} onClick={()=>handleModalChange("type","OUT")}>OUT</button>
                  </div>
                  <input style={styles.input} type="number" placeholder="Quantity" value={modalForm.quantity || ""} onChange={e=>handleModalChange("quantity",e.target.value)} />
                </>
              )}

              {transactionBrandConfirm && (
                <p style={{ color:"red" }}>Brand is different. Add new item instead?</p>
              )}

              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
                <button style={styles.buttonSecondary} onClick={()=>{setShowModal(false); setTransactionBrandConfirm(false)}}>Cancel</button>
                <button style={styles.buttonPrimary} onClick={handleSubmit}>Submit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
