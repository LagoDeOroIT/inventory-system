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
  card: { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16 },
  thtd: { border: "1px solid #e5e7eb", padding: 8, textAlign: "left" },
  emptyRow: { textAlign: "center", padding: 12, color: "#6b7280" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
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
  const [form, setForm] = useState({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null });
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

  // ================= FORM HANDLER =================
  const handleFormChange = (key, value) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      if(key==="item_name") {
        const selectedItem = items.find(i => i.item_name === value && !i.deleted);
        if(selectedItem) {
          updated.item_id = selectedItem.id;
          updated.brand = selectedItem.brand;
          updated.price = selectedItem.unit_price;
        } else {
          updated.item_id = "";
          updated.brand = "";
          updated.price = "";
        }
      }
      return updated;
    });
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if(modalType==="transaction") {
      if(!form.item_id || !form.quantity || !form.date) return alert("Fill required fields");
      const existingItem = items.find(i => i.item_name === form.item_name && !i.deleted);
      if(existingItem && existingItem.brand !== form.brand){
        setConfirmAction({ type:"brandMismatch", data: { item_name: form.item_name, brand: form.brand } });
        return;
      }
      if(form.id){
        await supabase.from("inventory_transactions").update({
          date: form.date,
          item_id: form.item_id,
          brand: form.brand,
          type: form.type,
          quantity: Number(form.quantity),
          location: selectedStockRoom,
          unit_price: Number(form.price || items.find(i=>i.id===form.item_id)?.unit_price || 0)
        }).eq("id", form.id);
      } else {
        await supabase.from("inventory_transactions").insert([{
          date: form.date,
          item_id: form.item_id,
          brand: form.brand,
          type: form.type,
          quantity: Number(form.quantity),
          location: selectedStockRoom,
          unit_price: Number(form.price || items.find(i=>i.id===form.item_id)?.unit_price || 0)
        }]);
      }
      setForm({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null });
      loadData();
    } else if(modalType==="item") {
      if(!form.item_name || !form.brand || !form.price) return alert("Fill required fields");
      if(form.id){
        await supabase.from("items").update({
          item_name: form.item_name,
          brand: form.brand,
          unit_price: Number(form.price),
          location: selectedStockRoom
        }).eq("id", form.id);
      } else {
        const { data } = await supabase.from("items").insert([{ item_name: form.item_name, brand: form.brand, unit_price: Number(form.price), location: selectedStockRoom }]);
        if(data?.length && modalTypeBeforeItem==="transaction") {
          setForm(prev => ({ ...prev, item_id: data[0].id }));
          setModalType("transaction");
          setShowModal(true);
          return;
        }
      }
      setShowModal(false);
      setModalType("");
      setForm({ date:"", item_id:"", item_name:"", brand:"", type:"IN", quantity:"", price:"", id:null });
      loadData();
    }
  };

  // ================= NEW BUTTON =================
  const handleNewClick = () => {
    if(!selectedStockRoom){
      setModalType("stockRoomPrompt");
      setShowModal(true);
    } else {
      setModalType("newOption");
      setShowModal(true);
    }
  };

  // ================= EMPTY ROW COMPONENT =================
  const emptyRowComponent = (colSpan, text) => <tr><td colSpan={colSpan} style={styles.emptyRow}>{text}</td></tr>;

  // ================= AUTH SCREEN =================
  if(!session) return (
    <div style={{ padding:40, textAlign:"center" }}>
      {!session?.user ? (
        <>
          <h2>{isSignUp ? "Sign Up for Inventory" : "Inventory Login"}</h2>
          <input style={styles.input} placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
          <button style={{ ...styles.buttonPrimary, marginBottom:12 }} onClick={handleAuth}>{isSignUp ? "Sign Up" : "Login"}</button>
          <div>
            <button style={styles.buttonSecondary} onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>Welcome back, {session.user.email}!</h2>
          <button style={{ ...styles.buttonPrimary, marginTop:12 }} onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>Logout</button>
        </>
      )}
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
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap: 8, marginTop:16 }}>
          {session?.user?.email && (
            <div style={{ color:"#fff", marginBottom:8, fontSize:14, fontWeight:500 }}>Logged in as:<br />{session.user.email}</div>
          )}
          <button style={styles.buttonPrimary} onClick={handleNewClick}>+ New</button>
          <button style={{...styles.buttonSecondary, background:"#ef4444", color:"#fff"}} onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>Logout</button>
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
                {filteredTransactions.filter(t=>t.items?.item_name.toLowerCase().includes(inSearch.toLowerCase())).length===0 ?
                  emptyRowComponent(7, "No transaction data") :
                  filteredTransactions.filter(t=>t.items?.item_name.toLowerCase().includes(inSearch.toLowerCase())).map(t => (
                    <tr key={t.id}>
                      <td style={styles.thtd}>{t.date}</td>
                      <td style={styles.thtd}>{t.items?.item_name}</td>
                      <td style={styles.thtd}>{t.items?.brand}</td>
                      <td style={styles.thtd}>{t.type}</td>
                      <td style={styles.thtd}>{t.quantity}</td>
                      <td style={styles.thtd}>₱{(t.quantity * t.items?.unit_price).toFixed(2)}</td>
                      <td style={styles.thtd}>
                        <button style={{ ...styles.buttonSecondary, marginRight: 8 }} onClick={() => { setForm({ id: t.id, ...t, item_name: t.items?.item_name, brand: t.items?.brand, price: t.items?.unit_price }); setModalType("transaction"); setShowModal(true); }}>Edit</button>
                        <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={() => setConfirmAction({ type:"deleteTx", data:t })}>Delete</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* ================= DELETED TAB ================= */}
        {activeTab==="deleted" && (
          <div style={styles.card}>
            <h3>Deleted Items</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thtd}>Name</th>
                  <th style={styles.thtd}>Brand</th>
                  <th style={styles.thtd}>Price</th>
                  <th style={styles.thtd}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.length===0 ? emptyRowComponent(4,"No deleted items") :
                  deletedItems.map(i=>(
                    <tr key={i.id}>
                      <td style={styles.thtd}>{i.item_name}</td>
                      <td style={styles.thtd}>{i.brand}</td>
                      <td style={styles.thtd}>₱{i.unit_price.toFixed(2)}</td>
                      <td style={styles.thtd}>
                        <button style={styles.buttonPrimary} onClick={()=>setConfirmAction({ type:"restoreItem", data:i })}>Restore</button>
                      </td>
                    </tr>
                  ))
                }
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
                {deletedTransactions.length===0 ? emptyRowComponent(7,"No deleted transactions") :
                  deletedTransactions.map(t=>(
                    <tr key={t.id}>
                      <td style={styles.thtd}>{t.date}</td>
                      <td style={styles.thtd}>{t.items?.item_name}</td>
                      <td style={styles.thtd}>{t.items?.brand}</td>
                      <td style={styles.thtd}>{t.type}</td>
                      <td style={styles.thtd}>{t.quantity}</td>
                      <td style={styles.thtd}>₱{(t.quantity*t.items?.unit_price).toFixed(2)}</td>
                      <td style={styles.thtd}>
                        <button style={styles.buttonPrimary} onClick={()=>setConfirmAction({ type:"restoreTx", data:t })}>Restore</button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ================= CONFIRM MODAL ================= */}
      {confirmAction && (
        <>
          {/* Existing delete/restore confirmations */}
          {confirmAction.type !== "brandMismatch" && (
            <div style={styles.modalOverlay} onClick={() => setConfirmAction(null)}>
              <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
                <h3>Confirm Action</h3>
                <p>
                  Are you sure you want to {confirmAction.type.includes("delete") ? "delete" : "restore"} this {confirmAction.type.includes("Tx") ? "transaction" : "item"}?
                </p>
                <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                  <button style={styles.buttonPrimary} onClick={async () => {
                    const { type, data } = confirmAction;
                    // --- DELETE / RESTORE LOGIC ---
                    if(type==="deleteItem"){
                      await supabase.from("items").update({ deleted:true }).eq("id", data.id);
                      await supabase.from("inventory_transactions").update({ deleted:true }).eq("item_id", data.id);
                      setItems(prev=>prev.map(i=>i.id===data.id?{...i, deleted:true}:i));
                      setTransactions(prev=>prev.map(t=>t.item_id===data.id?{...t, deleted:true}:t));
                    } else if(type==="permanentDeleteItem"){
                      await supabase.from("items").delete().eq("id", data.id);
                      await supabase.from("inventory_transactions").delete().eq("item_id", data.id);
                      setItems(prev=>prev.filter(i=>i.id!==data.id));
                      setTransactions(prev=>prev.filter(t=>t.item_id!==data.id));
                    } else if(type==="restoreItem"){
                      await supabase.from("items").update({ deleted:false }).eq("id", data.id);
                      await supabase.from("inventory_transactions").update({ deleted:false }).eq("item_id", data.id);
                      setItems(prev=>prev.map(i=>i.id===data.id?{...i, deleted:false}:i));
                      setTransactions(prev=>prev.map(t=>t.item_id===data.id?{...t, deleted:false}:t));
                    } else if(type==="deleteTx"){
                      await supabase.from("inventory_transactions").update({ deleted:true }).eq("id", data.id);
                      setTransactions(prev=>prev.map(t=>t.id===data.id?{...t, deleted:true}:t));
                    } else if(type==="permanentDeleteTx"){
                      await supabase.from("inventory_transactions").delete().eq("id", data.id);
                      setTransactions(prev=>prev.filter(t=>t.id!==data.id));
                    } else if(type==="restoreTx"){
                      await supabase.from("inventory_transactions").update({ deleted:false }).eq("id", data.id);
                      setTransactions(prev=>prev.map(t=>t.id===data.id?{...t, deleted:false}:t));
                    }
                    setConfirmAction(null);
                  }}>Yes</button>
                  <button style={styles.buttonSecondary} onClick={()=>setConfirmAction(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Brand Mismatch Confirmation */}
          {confirmAction.type === "brandMismatch" && (
            <div style={styles.modalOverlay} onClick={() => setConfirmAction(null)}>
              <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
                <h3>Brand Mismatch</h3>
                <p>
                  The item "<b>{confirmAction.data.item_name}</b>" already exists with a different brand.
                  Do you want to create a new item with brand "<b>{confirmAction.data.brand}</b>"?
                </p>
                <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                  <button style={styles.buttonPrimary} onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      item_name: confirmAction.data.item_name,
                      brand: confirmAction.data.brand,
                      price: ""
                    }));
                    setModalTypeBeforeItem("transaction");
                    setModalType("item");
                    setShowModal(true);
                    setConfirmAction(null);
                  }}>Yes, create new item</button>
                  <button style={styles.buttonSecondary} onClick={()=>setConfirmAction(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= MODAL ================= */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            {modalType==="transaction" && (
  <>
    <h3>{form.id ? "Edit Transaction" : "New Transaction"}</h3>
    <input
      style={styles.input}
      type="date"
      value={form.date}
      onChange={e=>handleFormChange("date", e.target.value)}
    />

    {/* ================= ITEM SELECT DROPDOWN ================= */}
    <select
      style={styles.input}
      value={form.item_id || ""}
      onChange={e => {
        const selected = items.find(i => i.id === Number(e.target.value));
        if (selected) {
          setForm(prev => ({
            ...prev,
            item_id: selected.id,
            item_name: selected.item_name,
            brand: selected.brand,
            price: selected.unit_price
          }));
        } else {
          setForm(prev => ({
            ...prev,
            item_id: "",
            item_name: "",
            brand: "",
            price: ""
          }));
        }
      }}
    >
      <option value="">-- Select Item --</option>
      {items
        .filter(i => !i.deleted && (!selectedStockRoom || i.location === selectedStockRoom))
        .map(i => (
          <option key={i.id} value={i.id}>
            {i.item_name} ({i.brand})
          </option>
        ))
      }
    </select>

    {/* Fallback free text input for new item */}
    <input
      style={styles.input}
      placeholder="Or type new item name"
      value={form.item_name}
      onChange={e=>handleFormChange("item_name", e.target.value)}
    />

    <input
      style={styles.input}
      placeholder="Brand"
      value={form.brand}
      onChange={e=>handleFormChange("brand", e.target.value)}
    />
    <div style={styles.toggleGroup}>
      <button
        style={styles.toggleButton(form.type==="IN")}
        onClick={()=>handleFormChange("type","IN")}
      >IN</button>
      <button
        style={styles.toggleButton(form.type==="OUT")}
        onClick={()=>handleFormChange("type","OUT")}
      >OUT</button>
    </div>
    <input
      style={styles.input}
      placeholder="Quantity"
      type="number"
      value={form.quantity}
      onChange={e=>handleFormChange("quantity", e.target.value)}
    />
    <input
      style={styles.input}
      placeholder="Price"
      type="number"
      value={form.price}
      onChange={e=>handleFormChange("price", e.target.value)}
    />
  </>
)}
            {modalType==="item" && (
              <>
                <h3>{form.id ? "Edit Item" : "New Item"}</h3>
                <input style={styles.input} placeholder="Item Name" value={form.item_name} onChange={e=>handleFormChange("item_name", e.target.value)} />
                <input style={styles.input} placeholder="Brand" value={form.brand} onChange={e=>handleFormChange("brand", e.target.value)} />
                <input style={styles.input} placeholder="Price" type="number" value={form.price} onChange={e=>handleFormChange("price", e.target.value)} />
              </>
            )}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:12, marginTop:12 }}>
              <button style={styles.buttonPrimary} onClick={handleSubmit}>Submit</button>
              <button style={styles.buttonSecondary} onClick={()=>setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
