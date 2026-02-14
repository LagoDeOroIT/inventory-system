import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: "flex", fontFamily: "Inter, Arial, sans-serif", minHeight: "100vh", background: "#f3f4f6" },
  sidebar: { width: 220, background: "#111827", color: "#fff", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  sidebarHeader: { fontSize: 20, fontWeight: 700, marginBottom: 24 },
  sidebarSelect: { marginBottom: 24, padding: 8, borderRadius: 6, border: "none", width: "100%" },
  sidebarTabs: { display: "flex", flexDirection: "column", gap: 12 },
  tabButton: (active) => ({ padding: 10, borderRadius: 6, background: active ? "#1f2937" : "transparent", border: "none", color: "#fff", cursor: "pointer", textAlign: "left" }),
  main: { flex: 1, padding: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: "#111827" },
  buttonPrimary: { background: "#1f2937", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 },
  card: { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16 },
  thtd: { border: "1px solid #e5e7eb", padding: 8, textAlign: "left" },
  emptyRow: { textAlign: "center", padding: 12, color: "#6b7280" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "#fff", padding: 24, borderRadius: 8, width: 400, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  input: { width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #d1d5db" },
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
  newOptionButton: { padding: "12px 0", marginBottom: 12, borderRadius: 8, border: "none", width: "100%", cursor: "pointer", fontWeight: 600, fontSize: 16 },
};

// ================= EMPTY ROW =================
const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={styles.emptyRow}>{text}</td>
  </tr>
);

// ================= CONFIRM MODAL =================
function ConfirmModal({ show, title, message, confirmLabel = "Confirm", confirmColor = "#f87171", onConfirm, onCancel }) {
  if (!show) return null;

  const buttonStyle = { padding: "10px 18px", borderRadius: 8, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s ease", minWidth: 110, transform: "translateY(0px)", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" };

  return (
    <div
      style={{
        ...styles.modalOverlay,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        background: "rgba(0,0,0,0.35)",
        animation: "fadeIn 0.15s ease-in"
      }}
      onClick={onCancel}
    >
      <div
        style={{ ...styles.modalCard, animation: "scaleIn 0.2s ease-in", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 12 }}>{title}</h3>
        <p style={{ marginBottom: 24, color: "#374151" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            style={{ ...buttonStyle, background: "#e5e7eb", color: "#374151" }}
            onMouseEnter={e => e.currentTarget.style.background = "#d1d5db"}
            onMouseLeave={e => e.currentTarget.style.background = "#e5e7eb"}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{ ...buttonStyle, background: confirmColor, color: "#fff" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0px)"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)"; }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
        @keyframes scaleIn { 0% { transform: scale(0.95); opacity:0;} 100% { transform: scale(1); opacity:1;} }
      `}</style>
    </div>
  );
}

// ================= APP =================
export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("");
  const [inSearch, setInSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "transaction" | "item" | "newOption" | "stockRoomPrompt"
  const [form, setForm] = useState({ date:"", item_id:"", brand:"", type:"IN", quantity:"", price:"", item_name:"", id:null });
  const [confirmData, setConfirmData] = useState({ show: false, title: "", message: "", confirmLabel:"Confirm", confirmColor:"#f87171", onConfirm:()=>{} });

  const stockRooms = ["L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7","Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"];

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions")
      .select("*, items(item_name, brand, unit_price)")
      .order("date", { ascending: false });
    setItems(itemsData || []);
    setTransactions(tx || []);
  }
  useEffect(() => { if(session) loadData(); }, [session]);

  const handleFormChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // ================= UTILITY: CONFIRM ACTION =================
  const confirmAction = ({ title, message, confirmLabel="Confirm", confirmColor="#f87171", onConfirm }) => {
    setConfirmData({ show: true, title, message, confirmLabel, confirmColor, onConfirm: () => { onConfirm(); setConfirmData({...confirmData, show:false}); }});
  };

  // ================= BUTTON HANDLERS =================
  const handleDeleteItem = (item) => confirmAction({
    title: "Delete Item",
    message: `Are you sure you want to delete "${item.item_name}"?`,
    confirmColor:"#f87171",
    onConfirm: async () => { await supabase.from("items").update({deleted:true}).eq("id", item.id); loadData(); }
  });

  const handleRestoreItem = (item) => confirmAction({
    title: "Restore Item",
    message: `Do you want to restore "${item.item_name}"?`,
    confirmColor:"#34d399",
    onConfirm: async () => { await supabase.from("items").update({deleted:false}).eq("id", item.id); loadData(); }
  });

  // ================= RENDER LOGIN IF NO SESSION =================
  if(!session) return (
    <div style={{ padding:40, textAlign:"center" }}>
      <h2>Inventory Login</h2>
      <button style={styles.buttonPrimary} onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div>
          <div style={styles.sidebarHeader}>Lago De Oro</div>
          <select style={styles.sidebarSelect} value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
            <option value="">Select Stock Room</option>
            {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <div style={styles.sidebarTabs}>
            <button style={styles.tabButton(activeTab==="stock")} onClick={()=>setActiveTab("stock")}>📦 Stock Inventory</button>
            <button style={styles.tabButton(activeTab==="transactions")} onClick={()=>setActiveTab("transactions")}>📄 Transactions</button>
          </div>
        </div>
        <button style={styles.buttonPrimary} onClick={()=>{setModalType("newOption"); setShowModal(true);}}>+ New</button>
      </div>

      <div style={styles.main}>
        <div style={styles.header}><div style={styles.title}>{activeTab==="stock"?"Stock Inventory":"Transactions"}</div></div>
        {/* Your table rendering code here (same as before) */}
      </div>

      {/* CONFIRM MODAL */}
      <ConfirmModal {...confirmData} onCancel={()=>setConfirmData({...confirmData, show:false})} />
    </div>
  );
}
