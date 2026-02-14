import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { FiEdit, FiTrash2, FiRotateCcw } from "react-icons/fi";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: "flex", fontFamily: "Inter, Arial, sans-serif", minHeight: "100vh", background: "#f3f4f6" },
  sidebar: { width: 240, background: "#111827", color: "#fff", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" },
  sidebarHeader: { fontSize: 22, fontWeight: 700, marginBottom: 24 },
  sidebarSelect: { marginBottom: 24, padding: 10, borderRadius: 6, border: "none", width: "100%", fontSize: 14 },
  sidebarTabs: { display: "flex", flexDirection: "column", gap: 12 },
  tabButton: (active) => ({
    padding: 12,
    borderRadius: 8,
    background: active ? "#1f2937" : "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 600,
    transition: "background 0.2s"
  }),
  main: { flex: 1, padding: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: "#111827" },
  buttonPrimary: { background: "#1f2937", color: "#fff", padding: "10px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600 },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "10px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600 },
  buttonDanger: { background: "#f87171", color: "#fff", padding: "10px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600 },
  buttonSuccess: { background: "#34d399", color: "#fff", padding: "10px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600 },
  card: { background: "#fff", padding: 20, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
  input: { width: "100%", padding: 10, marginBottom: 14, borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 },
  toggleGroup: { display: "flex", gap: 12, marginBottom: 12 },
  toggleButton: (active) => ({
    flex: 1,
    padding: "10px 0",
    borderRadius: 6,
    border: active ? "none" : "1px solid #d1d5db",
    background: active ? "#1f2937" : "#fff",
    color: active ? "#fff" : "#374151",
    cursor: "pointer",
    fontWeight: 600,
    transition: "background 0.2s, color 0.2s"
  }),
  newOptionButton: { padding: "14px 0", marginBottom: 12, borderRadius: 8, border: "none", width: "100%", cursor: "pointer", fontWeight: 600, fontSize: 16 },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "#fff", padding: 24, borderRadius: 12, width: 450, maxWidth: "90%", boxShadow: "0 6px 20px rgba(0,0,0,0.15)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 14 },
  th: { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", background: "#f9fafb", fontWeight: 600 },
  td: { padding: "12px 16px", borderBottom: "1px solid #e5e7eb", verticalAlign: "middle" },
  trHover: { transition: "background 0.2s", cursor: "pointer" },
  iconButton: { background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, transition: "background 0.2s" },
  emptyRow: { textAlign: "center", padding: 16, color: "#6b7280" }
};

const emptyRowRender = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={styles.emptyRow}>{text}</td>
  </tr>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("");
  const [inSearch, setInSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [form, setForm] = useState({ date:"", item_id:"", brand:"", type:"IN", quantity:"", price:"", item_name:"", id:null });
  const [confirmData, setConfirmData] = useState({ title:"", action:null });

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

  const filteredTransactions = transactions
    .filter(t => !selectedStockRoom || t.location === selectedStockRoom)
    .filter(t => t.items?.item_name.toLowerCase().includes(inSearch.toLowerCase()));

  const stockInventory = items.filter(i => !i.deleted).map(i => {
    const related = transactions.filter(t => t.item_id === i.id && !t.deleted);
    const stock = related.reduce((sum,t) => sum + (t.type==="IN"? Number(t.quantity):-Number(t.quantity)), 0);
    return { ...i, stock };
  });

  const deletedItems = items.filter(i => i.deleted);
  const deletedTransactions = transactions.filter(t => t.deleted);

  const handleFormChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // ================= CONFIRM MODAL =================
  const openConfirmModal = (title, action) => {
    setConfirmData({ title, action });
    setModalType("confirm");
    setShowModal(true);
  };
  const handleConfirm = async () => { if(confirmData.action) await confirmData.action(); setShowModal(false); setModalType(""); };

  // ================= CRUD ACTIONS =================
  const handleDeleteItem = i => openConfirmModal(`Delete "${i.item_name}"?`, async ()=>{ await supabase.from("items").update({ deleted:true }).eq("id",i.id); loadData(); });
  const handleRestoreItem = i => openConfirmModal(`Restore "${i.item_name}"?`, async ()=>{ await supabase.from("items").update({ deleted:false }).eq("id",i.id); loadData(); });
  const handlePermanentDeleteItem = i => openConfirmModal(`Permanently delete "${i.item_name}"?`, async ()=>{ await supabase.from("items").delete().eq("id",i.id); loadData(); });
  const handleDeleteTransaction = t => openConfirmModal(`Delete transaction for "${t.items?.item_name}"?`, async ()=>{ await supabase.from("inventory_transactions").update({ deleted:true }).eq("id",t.id); loadData(); });
  const handleRestoreTransaction = t => openConfirmModal(`Restore transaction for "${t.items?.item_name}"?`, async ()=>{ await supabase.from("inventory_transactions").update({ deleted:false }).eq("id",t.id); loadData(); });
  const handlePermanentDeleteTransaction = t => openConfirmModal(`Permanently delete transaction for "${t.items?.item_name}"?`, async ()=>{ await supabase.from("inventory_transactions").delete().eq("id",t.id); loadData(); });

  // ================= EDIT / NEW =================
  const handleEditItem = i => { setForm({ id:i.id,item_name:i.item_name,brand:i.brand,price:i.unit_price }); setModalType("item"); setShowModal(true); };
  const handleEditTransaction = t => { setForm({ id:t.id,date:t.date,item_id:t.item_id,brand:t.brand,type:t.type,quantity:t.quantity }); setModalType("transaction"); setShowModal(true); };

  // ================= NEW BUTTON WORKFLOW =================
  const handleNewClick = () => {
    if(!selectedStockRoom){
      setModalType("stockRoomPrompt");
      setShowModal(true);
    } else {
      setModalType("newOption");
      setShowModal(true);
    }
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if(modalType==="transaction"){
      if(!form.item_id||!form.quantity||!form.date) return alert("Fill required fields");
      if(form.id){ await supabase.from("inventory_transactions").update({ date:form.date,item_id:form.item_id,brand:form.brand,type:form.type,quantity:Number(form.quantity),unit_price:items.find(i=>i.id===form.item_id)?.unit_price||0 }).eq("id",form.id); }
      else{ await supabase.from("inventory_transactions").insert([{ date:form.date,item_id:form.item_id,brand:form.brand,type:form.type,quantity:Number(form.quantity),location:selectedStockRoom,unit_price:items.find(i=>i.id===form.item_id)?.unit_price||0 }]); }
    } else if(modalType==="item"){
      if(!form.item_name||!form.brand||!form.price) return alert("Fill required fields");
      if(form.id){ await supabase.from("items").update({ item_name:form.item_name,brand:form.brand,unit_price:Number(form.price) }).eq("id",form.id); }
      else{ await supabase.from("items").insert([{ item_name:form.item_name,brand:form.brand,unit_price:Number(form.price),location:selectedStockRoom }]); }
    }
    setShowModal(false); setModalType(""); setForm({ date:"", item_id:"", brand:"", type:"IN", quantity:"", price:"", item_name:"", id:null }); loadData();
  };

  if(!session) return (
    <div style={{ padding:40, textAlign:"center" }}>
      <h2>Inventory Login</h2>
      <button style={styles.buttonPrimary} onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}>Login with Google</button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Sidebar */}
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
            <button style={styles.tabButton(activeTab==="deleted")} onClick={()=>setActiveTab("deleted")}>🗑️ Deleted History</button>
            <button style={styles.tabButton(activeTab==="report")} onClick={()=>setActiveTab("report")}>📊 Monthly Report</button>
          </div>
        </div>
        <button style={styles.buttonPrimary} onClick={handleNewClick}>+ New</button>
      </div>

            {/* Main */}
      <div style={styles.main}>
        <div style={styles.header}>
          <div style={styles.title}>
            {activeTab === "stock" ? "Stock Inventory" : activeTab === "transactions" ? "Transactions" : activeTab === "deleted" ? "Deleted History" : "Monthly Report"}
          </div>
        </div>

        {/* ================= STOCK INVENTORY TAB ================= */}
        {activeTab==="stock" && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Item Name</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockInventory.length === 0 && emptyRowRender(5,"No stock data")}
                {stockInventory.map(i => (
                  <tr key={i.id} style={{...styles.trHover}} onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={styles.td}>{i.stock}</td>
                    <td style={styles.td}>{i.item_name}</td>
                    <td style={styles.td}>{i.brand}</td>
                    <td style={styles.td}>₱{i.unit_price.toFixed(2)}</td>
                    <td style={styles.td}>
                      <button style={styles.iconButton} title="Edit" onClick={()=>handleEditItem(i)}><FiEdit size={18} /></button>
                      <button style={styles.iconButton} title="Delete" onClick={()=>handleDeleteItem(i)}><FiTrash2 size={18} color="#f87171" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TRANSACTIONS TAB ================= */}
        {activeTab==="transactions" && (
          <div style={styles.card}>
            <input style={styles.input} placeholder="Search..." value={inSearch} onChange={e=>setInSearch(e.target.value)} />
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Item</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 && emptyRowRender(6,"No transactions")}
                {filteredTransactions.map(t => (
                  <tr key={t.id} style={{...styles.trHover}} onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.items?.item_name}</td>
                    <td style={styles.td}>{t.items?.brand}</td>
                    <td style={styles.td}>{t.type}</td>
                    <td style={styles.td}>{t.quantity}</td>
                    <td style={styles.td}>
                      <button style={styles.iconButton} title="Edit" onClick={()=>handleEditTransaction(t)}><FiEdit size={18} /></button>
                      <button style={styles.iconButton} title="Delete" onClick={()=>handleDeleteTransaction(t)}><FiTrash2 size={18} color="#f87171" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= DELETED HISTORY TAB ================= */}
        {activeTab==="deleted" && (
          <div style={styles.card}>
            <h3>Deleted Items</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Item Name</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.length === 0 && emptyRowRender(4,"No deleted items")}
                {deletedItems.map(i => (
                  <tr key={i.id}>
                    <td style={styles.td}>{i.item_name}</td>
                    <td style={styles.td}>{i.brand}</td>
                    <td style={styles.td}>₱{i.unit_price.toFixed(2)}</td>
                    <td style={styles.td}>
                      <button style={styles.buttonSuccess} onClick={()=>handleRestoreItem(i)}>Restore</button>
                      <button style={styles.buttonDanger} onClick={()=>handlePermanentDeleteItem(i)}>Delete Permanently</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop:24 }}>Deleted Transactions</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Item</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedTransactions.length === 0 && emptyRowRender(6,"No deleted transactions")}
                {deletedTransactions.map(t => (
                  <tr key={t.id}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.items?.item_name}</td>
                    <td style={styles.td}>{t.items?.brand}</td>
                    <td style={styles.td}>{t.type}</td>
                    <td style={styles.td}>{t.quantity}</td>
                    <td style={styles.td}>
                      <button style={styles.buttonSuccess} onClick={()=>handleRestoreTransaction(t)}>Restore</button>
                      <button style={styles.buttonDanger} onClick={()=>handlePermanentDeleteTransaction(t)}>Delete Permanently</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= REPORT TAB ================= */}
        {activeTab==="report" && (
          <div style={styles.card}>
            <h3>Monthly Report</h3>
            <p>Placeholder for monthly report chart or summary.</p>
          </div>
        )}

        {/* ================= MODALS ================= */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={()=>setShowModal(false)}>
            <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>
              {/* NEW OPTION MODAL */}
              {modalType==="newOption" && (
                <>
                  <h3>What do you want to add?</h3>
                  <button style={{...styles.newOptionButton, background:"#1f2937", color:"#fff"}} onClick={()=>{setModalType("item")}}>Add New Item</button>
                  <button style={{...styles.newOptionButton, background:"#e5e7eb", color:"#374151"}} onClick={()=>{setModalType("transaction")}}>Add New Transaction</button>
                  <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
                </>
              )}

              {/* STOCK ROOM PROMPT */}
              {modalType==="stockRoomPrompt" && (
                <>
                  <h3>Select Stock Room First</h3>
                  <select style={styles.input} value={selectedStockRoom} onChange={e=>{setSelectedStockRoom(e.target.value); setModalType("newOption");}}>
                    <option value="">Select Stock Room</option>
                    {stockRooms.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                  <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
                </>
              )}

              {/* ADD / EDIT ITEM MODAL */}
              {modalType==="item" && (
                <>
                  <h3>{form.id ? "Edit Item" : "New Item"}</h3>
                  <input style={styles.input} placeholder="Item Name" value={form.item_name} onChange={e=>handleFormChange("item_name",e.target.value)} />
                  <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand",e.target.value)} />
                  <input style={styles.input} type="number" placeholder="Price" value={form.price} onChange={e=>handleFormChange("price",e.target.value)} />
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                    <button style={styles.buttonPrimary} onClick={handleSubmit}>{form.id?"Save Changes":"Submit"}</button>
                    <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
                  </div>
                </>
              )}

              {/* ADD / EDIT TRANSACTION MODAL */}
              {modalType==="transaction" && (
                <>
                  <h3>{form.id ? "Edit Transaction" : "New Transaction"}</h3>
                  <input style={styles.input} type="date" value={form.date} onChange={e=>handleFormChange("date",e.target.value)} />
                  <input style={styles.input} list="items-list" placeholder="Select Item" value={form.item_id} onChange={e=>handleFormChange("item_id",e.target.value)} />
                  <datalist id="items-list">{items.map(i=><option key={i.id} value={i.id}>{i.item_name}</option>)}</datalist>
                  <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand",e.target.value)} />
                  <div style={styles.toggleGroup}>
                    <button style={styles.toggleButton(form.type==="IN")} onClick={()=>handleFormChange("type","IN")}>IN</button>
                    <button style={styles.toggleButton(form.type==="OUT")} onClick={()=>handleFormChange("type","OUT")}>OUT</button>
                  </div>
                  <input style={styles.input} type="number" placeholder="Quantity" value={form.quantity} onChange={e=>handleFormChange("quantity",e.target.value)} />
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                    <button style={styles.buttonPrimary} onClick={handleSubmit}>{form.id?"Save Changes":"Submit"}</button>
                    <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
                  </div>
                </>
              )}

              {/* CONFIRMATION MODAL */}
              {modalType==="confirm" && (
                <>
                  <h3>Confirm Action</h3>
                  <p>{confirmData.title}</p>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:16 }}>
                    <button style={styles.buttonPrimary} onClick={handleConfirm}>Yes</button>
                    <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
