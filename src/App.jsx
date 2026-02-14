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
  buttonPrimary: { background: "#1f2937", color: "#fff", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
  buttonDanger: { background: "#dc2626", color: "#fff", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
  card: { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16 },
  thtd: { border: "1px solid #e5e7eb", padding: 8, textAlign: "left" },
  emptyRow: { textAlign: "center", padding: 12, color: "#6b7280" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "#fff", padding: 24, borderRadius: 10, width: 420, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" },
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

export default function App() {
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("");
  const [inSearch, setInSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [confirmModal, setConfirmModal] = useState({ show:false, title:"", message:"", onConfirm:null });
  const [form, setForm] = useState({ date:"", item_id:"", brand:"", type:"IN", quantity:"", price:"", item_name:"", id: null });

  const stockRooms = [
    "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L5","L6","L7",
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
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase.from("inventory_transactions")
      .select("*, items(item_name, brand, unit_price)")
      .order("date", { ascending: false });
    setItems(itemsData || []);
    setTransactions(tx || []);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  const filteredTransactions = transactions.filter(t => !selectedStockRoom || t.location === selectedStockRoom);

  const stockInventory = items.filter(i => !i.deleted).map(i => {
    const related = transactions.filter(t => t.item_id === i.id && !t.deleted);
    const stock = related.reduce((sum, t) => sum + (t.type==="IN"? Number(t.quantity):-Number(t.quantity)),0);
    return { id:i.id, item_name:i.item_name, brand:i.brand, unit_price:i.unit_price, stock };
  });

  const deletedItems = items.filter(i => i.deleted);
  const deletedTransactions = transactions.filter(t => t.deleted);

  const handleFormChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const openConfirm = (title, message, onConfirm) => {
    setConfirmModal({ show:true, title, message, onConfirm });
  };

  const closeConfirm = () => setConfirmModal({ show:false, title:"", message:"", onConfirm:null });

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if(modalType==="transaction"){
      if(!form.item_id || !form.quantity || !form.date) return alert("Fill required fields");

      if(form.id){
        openConfirm("Save Changes?", "Are you sure you want to update this transaction?", async () => {
          await supabase.from("inventory_transactions").update({
            date: form.date,
            item_id: form.item_id,
            brand: form.brand,
            type: form.type,
            quantity: Number(form.quantity),
            unit_price: items.find(i=>i.id===form.item_id)?.unit_price || 0
          }).eq("id", form.id);
          closeConfirm();
          setShowModal(false);
          loadData();
        });
        return;
      } else {
        await supabase.from("inventory_transactions").insert([{
          date: form.date,
          item_id: form.item_id,
          brand: form.brand,
          type: form.type,
          quantity: Number(form.quantity),
          location: selectedStockRoom,
          unit_price: items.find(i=>i.id===form.item_id)?.unit_price || 0
        }]);
      }
    } else if(modalType==="item"){
      if(!form.item_name || !form.brand || !form.price) return alert("Fill required fields");

      if(form.id){
        openConfirm("Save Changes?", `Update item \"${form.item_name}\"?`, async () => {
          await supabase.from("items").update({
            item_name: form.item_name,
            brand: form.brand,
            unit_price: Number(form.price)
          }).eq("id", form.id);
          closeConfirm();
          setShowModal(false);
          loadData();
        });
        return;
      } else {
        await supabase.from("items").insert([{
          item_name: form.item_name,
          brand: form.brand,
          unit_price: Number(form.price),
          location: selectedStockRoom
        }]);
      }
    }
    setShowModal(false);
    setModalType("");
    setForm({ date:"", item_id:"", brand:"", type:"IN", quantity:"", price:"", item_name:"", id:null });
    loadData();
  };

  // ================= ITEM HANDLERS =================
  const handleDeleteItem = (item) => {
    openConfirm("Delete Item", `Are you sure you want to delete \"${item.item_name}\"?`, async () => {
      await supabase.from("items").update({ deleted: true }).eq("id", item.id);
      closeConfirm();
      loadData();
    });
  };

  const handlePermanentDeleteItem = (item) => {
    openConfirm("Permanent Delete", `This will permanently remove \"${item.item_name}\". Continue?`, async () => {
      await supabase.from("items").delete().eq("id", item.id);
      closeConfirm();
      loadData();
    });
  };

  const handleDeleteTransaction = (tx) => {
    openConfirm("Delete Transaction", `Delete transaction for \"${tx.items?.item_name}\"?`, async () => {
      await supabase.from("inventory_transactions").update({ deleted: true }).eq("id", tx.id);
      closeConfirm();
      loadData();
    });
  };

  const handlePermanentDeleteTransaction = (tx) => {
    openConfirm("Permanent Delete", `Permanently delete transaction for \"${tx.items?.item_name}\"?`, async () => {
      await supabase.from("inventory_transactions").delete().eq("id", tx.id);
      closeConfirm();
      loadData();
    });
  };

  if(!session) return (
    <div style={{ padding:40, textAlign:"center" }}>
      <h2>Inventory Login</h2>
      <button style={styles.buttonPrimary} onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Main UI unchanged except confirmations */}

      {confirmModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={{ marginBottom:8 }}>{confirmModal.title}</h3>
            <p style={{ marginBottom:20, color:"#4b5563" }}>{confirmModal.message}</p>
            <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
              <button style={styles.buttonSecondary} onClick={closeConfirm}>Cancel</button>
              <button style={styles.buttonDanger} onClick={confirmModal.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
