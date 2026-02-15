import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {
  container: { display: "flex", fontFamily: "Inter, Arial, sans-serif", minHeight: "100vh", background: "#f3f4f6" },
  sidebar: { width: 240, background: "#1e293b", color: "#fff", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "0 16px 16px 0", boxShadow: "2px 0 12px rgba(0,0,0,0.1)" },
  sidebarHeader: { fontSize: 22, fontWeight: 700, marginBottom: 24, color:"#f1f5f9" },
  sidebarSelect: { marginBottom: 24, padding: 10, borderRadius: 8, border: "none", width: "100%", fontSize:14 },
  sidebarTabs: { display: "flex", flexDirection: "column", gap: 12 },
  tabButton: (active) => ({ padding: 12, borderRadius: 8, background: active ? "#334155" : "transparent", border: "none", color: "#f1f5f9", cursor: "pointer", textAlign: "left", fontWeight:500, transition:"background 0.3s" }),
  main: { flex: 1, padding: 32 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  title: { fontSize: 30, fontWeight: 700, color: "#111827" },
  buttonPrimary: { background: "#4f46e5", color: "#fff", padding: "12px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight:600, transition:"background 0.3s" },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "12px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight:500, transition:"background 0.3s" },
  card: { background: "#fff", padding: 24, borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", marginBottom:24 },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize:14 },
  thtd: { border: "1px solid #e5e7eb", padding: 12, textAlign: "left" },
  emptyRow: { textAlign: "center", padding: 16, color: "#6b7280" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.45)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { background: "#fff", padding: 32, borderRadius: 16, width: 440, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" },
  input: { width: "100%", padding: 12, marginBottom: 16, borderRadius: 8, border: "1px solid #d1d5db", fontSize:14 },
  toggleGroup: { display: "flex", gap: 12, marginBottom: 16 },
  toggleButton: (active) => ({
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: active ? "none" : "1px solid #d1d5db",
    background: active ? "#4f46e5" : "#fff",
    color: active ? "#fff" : "#374151",
    cursor: "pointer",
    fontWeight: 600,
    transition:"background 0.3s, color 0.3s"
  }),
  newOptionButton: { padding: "14px 0", marginBottom: 12, borderRadius: 12, border: "none", width: "100%", cursor: "pointer", fontWeight: 600, fontSize: 16 },
};

// ================= EMPTY ROW =================
const emptyRow = (colSpan, text) => (
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
  const [form, setForm] = useState({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id: null });
  const [confirmAction, setConfirmAction] = useState(null);
  const [modalTypeBeforeItem, setModalTypeBeforeItem] = useState(""); 

  // ================= AUTH FORM =================
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

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

  const handleAuth = async () => {
    if (!authEmail || !authPassword) return alert("Fill email and password");
    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (result.error) return alert(result.error.message);
      alert("Sign up successful! Please check your email to confirm.");
    } else {
      result = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (result.error) return alert(result.error.message);
    }
  };

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase.from("items").select("*");
    const itemsWithDeleted = (itemsData || []).map(i => ({ ...i, deleted: i.deleted ?? false }));

    const { data: tx } = await supabase.from("inventory_transactions")
      .select("*, items(item_name, brand, unit_price, location)")
      .order("date", { ascending: false });
    const transactionsWithDeleted = (tx || []).map(t => ({ ...t, deleted: t.deleted ?? false }));

    setItems(itemsWithDeleted);
    setTransactions(transactionsWithDeleted);
  }

  useEffect(() => { if(session) loadData(); }, [session]);

  // ================= AUTH SCREEN =================
  if(!session) return (
    <div style={{
      display:"flex", justifyContent:"center", alignItems:"center",
      height:"100vh",
      background: "linear-gradient(135deg, #4f46e5, #3b82f6)"
    }}>
      <div style={{
        width: 400,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
        padding: 36,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "Inter, Arial, sans-serif"
      }}>
        <h2 style={{ marginBottom: 24, fontSize: 28, color:"#1f2937" }}>
          {isSignUp ? "Sign Up" : "Inventory Login"}
        </h2>

        <input style={styles.input} type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />

        <button 
          style={{...styles.buttonPrimary, width:"100%", marginBottom:12}}
          onClick={handleAuth}
          onMouseOver={e => e.currentTarget.style.background="#4338ca"}
          onMouseOut={e => e.currentTarget.style.background="#4f46e5"}
        >
          {isSignUp ? "Sign Up" : "Login"}
        </button>

        <button 
          style={{ background:"transparent", border:"none", color:"#4f46e5", cursor:"pointer", fontSize:14 }}
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );

  // ================= MAIN APP =================
  return (
    <div style={styles.container}>
      {/* ================= SIDEBAR ================= */}
      <div style={styles.sidebar}>
        <div>
          <div style={styles.sidebarHeader}>Lago De Oro</div>
          <select style={styles.sidebarSelect} value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
            <option value="">Select Stock Room</option>
            {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div style={styles.sidebarTabs}>
            <button style={styles.tabButton(activeTab==="stock")} onClick={()=>setActiveTab("stock")}>📦 Stock Inventory</button>
            <button style={styles.tabButton(activeTab==="transactions")} onClick={()=>setActiveTab("transactions")}>📄 Transactions</button>
            <button style={styles.tabButton(activeTab==="deleted")} onClick={()=>setActiveTab("deleted")}>🗑️ Deleted History</button>
            <button style={styles.tabButton(activeTab==="report")} onClick={()=>setActiveTab("report")}>📊 Monthly Report</button>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap: 10, marginTop:16 }}>
          {session?.user?.email && (
            <div style={{ color:"#f1f5f9", marginBottom:8, fontSize:14, fontWeight:500 }}>
              Logged in as:<br />{session.user.email}
            </div>
          )}
          <button style={styles.buttonPrimary} onClick={() => setShowModal(true)}>+ New</button>
          <button style={{...styles.buttonSecondary, background:"#ef4444", color:"#fff"}} 
                  onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>
            Logout
          </button>
        </div>
      </div>

      {/* ================= MAIN AREA ================= */}
  return (
    <div style={styles.container}>
      {/* ================= SIDEBAR ================= */}
      <div style={styles.sidebar}>
        <div>
          <div style={styles.sidebarHeader}>Lago De Oro</div>
          <select style={styles.sidebarSelect} value={selectedStockRoom} onChange={e=>setSelectedStockRoom(e.target.value)}>
            <option value="">Select Stock Room</option>
            {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div style={styles.sidebarTabs}>
            <button style={styles.tabButton(activeTab==="stock")} onClick={()=>setActiveTab("stock")}>📦 Stock Inventory</button>
            <button style={styles.tabButton(activeTab==="transactions")} onClick={()=>setActiveTab("transactions")}>📄 Transactions</button>
            <button style={styles.tabButton(activeTab==="deleted")} onClick={()=>setActiveTab("deleted")}>🗑️ Deleted History</button>
            <button style={styles.tabButton(activeTab==="report")} onClick={()=>setActiveTab("report")}>📊 Monthly Report</button>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap: 8, marginTop:16 }}>
          {session?.user?.email && (
            <div style={{ color:"#fff", marginBottom:8, fontSize:14, fontWeight:500 }}>
              Logged in as:<br />{session.user.email}
            </div>
          )}
          <button style={styles.buttonPrimary} onClick={handleNewClick}>+ New</button>
          <button style={{...styles.buttonSecondary, background:"#ef4444", color:"#fff"}} 
                  onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>
            Logout
          </button>
        </div>
      </div>

      
      {/* ================= MAIN AREA ================= */}
      <div style={styles.main}>

        
        {/* ================= STOCK TAB ================= */}
        {activeTab==="stock" && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Available Stocks</th>
                  <th style={styles.thtd}>Item Name</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                  <th style={styles.thtd}>Total Value</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockInventory.length === 0 ? emptyRowComponent(6, "No stock data") :
                  stockInventory.map(i => (
                    <tr key={i.id}>
                      <td style={styles.thtd}>{i.stock}</td>
                      <td style={styles.thtd}>{i.item_name}</td>
                      <td style={styles.thtd}>{i.brand}</td>
                      <td style={styles.thtd}>₱{i.unit_price.toFixed(2)}</td>
                      <td style={styles.thtd}>₱{(i.stock * i.unit_price).toFixed(2)}</td>
                      <td style={styles.thtd}>
                        <button style={{ ...styles.buttonSecondary, marginRight: 8 }} onClick={() => { setForm({ id: i.id, item_name: i.item_name, brand: i.brand, price: i.unit_price }); setModalType("item"); setShowModal(true); }}>Edit</button>
                        <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={() => setConfirmAction({ type:"deleteItem", data:i })}>Delete</button>
                      </td>
                    </tr>
                  ))
                }
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
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                  <th style={styles.thtd}>Total Price</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.filter(t=>t.items?.item_name.toLowerCase().includes(inSearch.toLowerCase())).length===0
                  ? emptyRowComponent(7,"No transactions")
                  : filteredTransactions.filter(t=>t.items?.item_name.toLowerCase().includes(inSearch.toLowerCase())).map(t => (
                  <tr key={t.id}>
                    <td style={styles.thtd}>{t.date}</td>
                    <td style={styles.thtd}>{t.items?.item_name}</td>
                    <td style={styles.thtd}>{t.items?.brand}</td>
                    <td style={styles.thtd}>{t.type}</td>
                    <td style={styles.thtd}>{t.quantity}</td>
                    <td style={styles.thtd}>₱{((t.quantity || 0) * (t.unit_price || t.items?.unit_price || 0)).toFixed(2)}</td>
                    <td style={styles.thtd}>
                      <button style={{ ...styles.buttonSecondary, marginRight: 8 }} onClick={() => { setForm({ id: t.id, date: t.date, item_id: t.item_id, item_name: t.items?.item_name || "", brand: t.brand, type: t.type, quantity: t.quantity }); setModalType("transaction"); setShowModal(true); }}>Edit</button>
                      <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={() => setConfirmAction({ type:"deleteTx", data:t })}>Delete</button>
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
            <h3>Deleted Inventory</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Item Name</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.length===0 ? emptyRowComponent(4,"No deleted items") :
                  deletedItems.map(i => (
                  <tr key={i.id}>
                    <td style={styles.thtd}>{i.item_name}</td>
                    <td style={styles.thtd}>{i.brand}</td>
                    <td style={styles.thtd}>₱{i.unit_price.toFixed(2)}</td>
                    <td style={styles.thtd}>
                      <button style={{ ...styles.buttonSecondary, background:"#34d399", color:"#fff", marginRight: 8 }} onClick={()=>setConfirmAction({ type:"restoreItem", data:i })}>Restore</button>
                      <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={()=>setConfirmAction({ type:"permanentDeleteItem", data:i })}>Delete Permanently</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop:24 }}>Deleted Transactions</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Date</th>
                  <th style={styles.thtd}>Item</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Type</th>
                  <th style={styles.thtd}>Qty</th>
                  <th style={styles.thtd}>Total Price</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedTransactions.length === 0
                  ? emptyRowComponent(7, "No deleted transactions")
                  : deletedTransactions.map(t => (
                    <tr key={t.id}>
                      <td style={styles.thtd}>{t.date}</td>
                      <td style={styles.thtd}>{t.items?.item_name}</td>
                      <td style={styles.thtd}>{t.items?.brand}</td>
                      <td style={styles.thtd}>{t.type}</td>
                      <td style={styles.thtd}>{t.quantity}</td>
                      <td style={styles.thtd}>₱{((t.quantity || 0) * (t.unit_price || t.items?.unit_price || 0)).toFixed(2)}</td>
                      <td style={styles.thtd}>
                        <button style={{ ...styles.buttonSecondary, background:"#34d399", color:"#fff", marginRight: 8 }} onClick={() => setConfirmAction({ type:"restoreTx", data:t })}>Restore</button>
                        <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={() => setConfirmAction({ type:"permanentDeleteTx", data:t })}>Delete Permanently</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= MODALS ================= */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              {/* NEW OPTION MODAL */}
              {modalType === "newOption" && (
                <>
                  <h3>What do you want to add?</h3>
                  <button style={{ ...styles.newOptionButton, background:"#1f2937", color:"#fff" }} onClick={() => setModalType("item")}>Add New Item</button>
                  <button style={{ ...styles.newOptionButton, background:"#e5e7eb", color:"#374151" }} onClick={() => setModalType("transaction")}>Add New Transaction</button>
                  <button style={styles.buttonSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                </>
              )}

              {/* STOCK ROOM PROMPT */}
              {modalType === "stockRoomPrompt" && (
                <>
                  <h3>Select Stock Room First</h3>
                  <select style={styles.input} value={selectedStockRoom} onChange={e => { setSelectedStockRoom(e.target.value); setModalType("newOption"); }}>
                    <option value="">Select Stock Room</option>
                    {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button style={styles.buttonSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                </>
              )}

              {/* ADD ITEM MODAL */}
              {modalType === "item" && (
                <>
                  <h3>{form.id ? "Edit Item" : "New Item"}</h3>
                  <input style={styles.input} placeholder="Item Name" value={form.item_name} onChange={e => handleFormChange("item_name", e.target.value)} />
                  <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e => handleFormChange("brand", e.target.value)} />
                  <input style={styles.input} type="number" placeholder="Price" value={form.price} onChange={e => handleFormChange("price", e.target.value)} />
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                    <button style={styles.buttonPrimary} onClick={handleSubmit}>{form.id ? "Save Changes" : "Submit"}</button>
                    <button style={styles.buttonSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </>
              )}

              {/* ADD TRANSACTION MODAL */}
              {modalType === "transaction" && (
                <>
                  <h3>{form.id ? "Edit Transaction" : "New Transaction"}</h3>
                  <input style={styles.input} type="date" value={form.date} onChange={e => handleFormChange("date", e.target.value)} />
                  <input style={styles.input} list="items-list" placeholder="Select Item" value={form.item_name} onChange={e => handleFormChange("item_name", e.target.value)} />
                  <datalist id="items-list">
                    {items.filter(i => i.location === selectedStockRoom).map(i => (
                      <option key={i.id} value={i.item_name}>{i.item_name}</option>
                    ))}
                  </datalist>
                  <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e => handleFormChange("brand", e.target.value)} />
                  <div style={styles.toggleGroup}>
                    <button style={styles.toggleButton(form.type==="IN")} onClick={() => handleFormChange("type","IN")}>IN</button>
                    <button style={styles.toggleButton(form.type==="OUT")} onClick={() => handleFormChange("type","OUT")}>OUT</button>
                  </div>
                  <input style={styles.input} type="number" placeholder="Quantity" value={form.quantity} onChange={e => handleFormChange("quantity", e.target.value)} />
                  <input style={styles.input} type="number" placeholder="Price per unit" value={form.price} onChange={e => handleFormChange("price", e.target.value)} />
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                    <button style={styles.buttonPrimary} onClick={handleSubmit}>{form.id ? "Save Changes" : "Submit"}</button>
                    <button style={styles.buttonSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= CONFIRM MODAL ================= */}
        {confirmAction && (
          <div style={styles.modalOverlay} onClick={() => setConfirmAction(null)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <h3>Confirm Action</h3>
              <p>Are you sure you want to {confirmAction.type.includes("delete") ? "delete" : "restore"} this {confirmAction.type.includes("Tx") ? "transaction" : "item"}?</p>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                <button style={styles.buttonPrimary} onClick={async () => {
                  const { type, data } = confirmAction;
                  if(type==="deleteItem") {
                    await supabase.from("items").update({ deleted:true }).eq("id", data.id);
                    await supabase.from("inventory_transactions").update({ deleted:true }).eq("item_id", data.id);
                    setItems(prev => prev.map(i => i.id === data.id ? { ...i, deleted:true } : i));
                    setTransactions(prev => prev.map(t => t.item_id === data.id ? { ...t, deleted:true } : t));
                  }
                  else if(type==="permanentDeleteItem") {
                    await supabase.from("items").delete().eq("id", data.id);
                    await supabase.from("inventory_transactions").delete().eq("item_id", data.id);
                    setItems(prev => prev.filter(i => i.id !== data.id));
                    setTransactions(prev => prev.filter(t => t.item_id !== data.id));
                  }
                  else if(type==="restoreItem") {
                    await supabase.from("items").update({ deleted:false }).eq("id", data.id);
                    await supabase.from("inventory_transactions").update({ deleted:false }).eq("item_id", data.id);
                    setItems(prev => prev.map(i => i.id === data.id ? { ...i, deleted:false } : i));
                    setTransactions(prev => prev.map(t => t.item_id === data.id ? { ...t, deleted:false } : t));
                  }
                  else if(type==="deleteTx") {
                    await supabase.from("inventory_transactions").update({ deleted:true }).eq("id", data.id);
                    setTransactions(prev => prev.map(t => t.id === data.id ? { ...t, deleted:true } : t));
                  }
                  else if(type==="permanentDeleteTx") {
                    await supabase.from("inventory_transactions").delete().eq("id", data.id);
                    setTransactions(prev => prev.filter(t => t.id !== data.id));
                  }
                  else if(type==="restoreTx") {
                    await supabase.from("inventory_transactions").update({ deleted:false }).eq("id", data.id);
                    setTransactions(prev => prev.map(t => t.id === data.id ? { ...t, deleted:false } : t));
                  }

                  setConfirmAction(null);
                }}>Yes</button>
                <button style={styles.buttonSecondary} onClick={() => setConfirmAction(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
