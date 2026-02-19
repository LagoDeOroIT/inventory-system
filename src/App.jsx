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

// ================= APP COMPONENT =================
export default function App() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("");
  const [inSearch, setInSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalTypeBeforeItem, setModalTypeBeforeItem] = useState("");
  const [form, setForm] = useState({ date:"", item_id:"", item_name:"", brand:"", brandOptions:[], type:"IN", quantity:"", price:"", id: null });
  const [confirmAction, setConfirmAction] = useState(null);
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
  const loadData = async () => {
    const { data: itemsData } = await supabase.from("items").select("*");
    const itemsWithDeleted = (itemsData || []).map(i => ({ ...i, deleted: i.deleted ?? false }));

    const { data: tx } = await supabase.from("inventory_transactions")
      .select("*, items(item_name, brand, unit_price, location)")
      .order("date", { ascending: false });
    const transactionsWithDeleted = (tx || []).map(t => ({ ...t, deleted: t.deleted ?? false }));

    setItems(itemsWithDeleted);
    setTransactions(transactionsWithDeleted);
  };

  useEffect(() => { if(session) loadData(); }, [session]);

  // ================= FILTERS =================
  const filteredTransactions = transactions
    .filter(t => !t.deleted)
    .filter(t => !selectedStockRoom || t.items?.location === selectedStockRoom);

  const stockInventory = items
    .filter(i => !i.deleted)
    .filter(i => !selectedStockRoom || i.location === selectedStockRoom)
    .map(i => {
      const related = transactions.filter(t => t.item_id === i.id && !t.deleted);
      const stock = related.reduce(
        (sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)),
        0
      );
      return { id: i.id, item_name: i.item_name, brand: i.brand, unit_price: i.unit_price, stock, location: i.location };
    });

  const deletedItems = items.filter(i => i.deleted).filter(i => !selectedStockRoom || i.location === selectedStockRoom);
  const deletedTransactions = transactions.filter(t => t.deleted).filter(t => !selectedStockRoom || t.items?.location === selectedStockRoom);

  // ================= FORM HANDLER =================
  const handleFormChange = (key, value) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      if (key === "item_name") {
        const relatedItems = items.filter(i => i.item_name === value && !i.deleted && i.location === selectedStockRoom);
        if (relatedItems.length > 0) {
          updated.item_id = relatedItems[0].id;
          updated.brand = relatedItems[0].brand;
          updated.price = relatedItems[0].unit_price;
          updated.brandOptions = [...new Set(relatedItems.map(i => i.brand))];
        } else {
          updated.item_id = "";
          updated.brand = "";
          updated.price = "";
          updated.brandOptions = [];
        }
      }
      return updated;
    });
  };

  const openNewItemModal = () => {
    setForm({ date:"", item_id:"", item_name:"", brand:"", brandOptions:[], type:"IN", quantity:"", price:"", id:null });
    setModalType("item");
    setShowModal(true);
  };

  const openNewTransactionModal = () => {
    setForm({ date:"", item_id:"", item_name:"", brand:"", brandOptions:[], type:"IN", quantity:"", price:"", id:null });
    setModalType("transaction");
    setShowModal(true);
  };

  const handleNewClick = () => {
    if(!selectedStockRoom) {
      setModalType("stockRoomPrompt");
      setShowModal(true);
    } else {
      setModalType("newOption");
      setShowModal(true);
    }
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if(modalType === "transaction") {
      if(!form.item_name || !form.quantity || !form.date) return alert("Fill required fields");
      const existingItem = items.find(i => i.item_name === form.item_name && i.brand === form.brand && !i.deleted && i.location === selectedStockRoom);
      if(!existingItem) {
        setModalTypeBeforeItem("transaction");
        setModalType("item");
        setShowModal(true);
        return;
      }
      const txData = {
        date: form.date,
        item_id: existingItem.id,
        brand: form.brand || existingItem.brand,
        type: form.type,
        quantity: Number(form.quantity),
        location: selectedStockRoom,
        unit_price: Number(form.price || existingItem.unit_price || 0)
      };
      if(form.id) await supabase.from("inventory_transactions").update(txData).eq("id", form.id);
      else await supabase.from("inventory_transactions").insert([txData]);

      // 🔹 auto-refresh immediately
      loadData();

      setForm({ date:"", item_id:"", item_name:"", brand:"", brandOptions:[], type:"IN", quantity:"", price:"", id:null });
      setShowModal(false);
      setModalType("");
    } else if(modalType === "item") {
      if(!form.item_name || !form.brand || !form.price) return alert("Fill required fields");
      const itemData = { item_name: form.item_name, brand: form.brand, unit_price: Number(form.price), location: selectedStockRoom };
      if(form.id) await supabase.from("items").update(itemData).eq("id", form.id);
      else {
        const { data } = await supabase.from("items").insert([itemData]);
        if(data?.length && modalTypeBeforeItem === "transaction") {
          setForm(prev => ({ ...prev, item_id: data[0].id }));
          setModalType("transaction");
          setShowModal(true);
          setModalTypeBeforeItem("");
          return;
        }
      }

      // 🔹 auto-refresh immediately
      loadData();

      setForm({ date:"", item_id:"", item_name:"", brand:"", brandOptions:[], type:"IN", quantity:"", price:"", id:null });
      setShowModal(false);
      setModalType("");
    }
  };

  // ================= EMPTY ROW =================
  const emptyRowComponent = (colSpan, text) => <tr><td colSpan={colSpan} style={styles.emptyRow}>{text}</td></tr>;

  // ================= AUTH SCREEN =================
  if(!session) return (
    <div style={{ padding:40, textAlign:"center" }}>
      {!session?.user ? (
        <>
          <h2>{isSignUp ? "Sign Up for Inventory" : "Inventory Login"}</h2>
          <input style={styles.input} placeholder="Email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
          <input style={styles.input} type="password" placeholder="Password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} />
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
      {/* SIDEBAR */}
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
          {session?.user?.email && <div style={{ color:"#fff", marginBottom:8, fontSize:14, fontWeight:500 }}>Logged in as:<br />{session.user.email}</div>}
          <button style={styles.buttonPrimary} onClick={() => alert("New Item/Transaction modal logic")}>+ New</button>
          <button style={{...styles.buttonSecondary, background:"#ef4444", color:"#fff"}} onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>Logout</button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={styles.main}>
        {activeTab==="stock" && (
          <div style={styles.card}>
            <div style={styles.stickyTitle}>📦 Stock Inventory</div>
            <div style={styles.stickyCategory}>Category: {currentCategory || (stockInventory[0]?.category || "Uncategorized")}</div>
            <div style={styles.tableContainer} ref={tableContainerRef} onScroll={handleScroll}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.stickyHeader}>
                    <th>Item Name</th>
                    <th>Brand</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockInventory.length === 0 ? emptyRowComponent(6,"No stock data") :
                    stockInventory.map(i => (
                      <tr key={i.id} data-category={i.category}>
                        <td style={styles.thtd}>{i.item_name}</td>
                        <td style={styles.thtd}>{i.brand}</td>
                        <td style={styles.thtd}>{i.quantity || 0}</td>
                        <td style={styles.thtd}>₱{i.unit_price.toFixed(2)}</td>
                        <td style={styles.thtd}>{i.stock}</td>
                        <td style={styles.thtd}>
                          <button style={{ ...styles.buttonSecondary, marginRight: 8 }} onClick={() => alert("Edit logic")}>Edit</button>
                          <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={() => alert("Delete logic")}>Delete</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRANSACTION TABLE */}
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
                      <button
                        style={{ ...styles.buttonSecondary, marginRight: 8 }}
                        onClick={() => { 
                          const relatedBrands = items
                            .filter(i => i.item_name === t.items?.item_name && i.location === selectedStockRoom)
                            .map(i => i.brand);

                          setForm({
                            id: t.id,
                            date: t.date,
                            item_id: t.item_id,
                            item_name: t.items?.item_name || "",
                            brand: t.brand,
                            brandOptions: [...new Set(relatedBrands)],
                            type: t.type,
                            quantity: t.quantity,
                            price: t.unit_price || t.items?.unit_price || 0
                          }); 
                          setModalType("transaction"); 
                          setShowModal(true); 
                        }}
                      >
                        Edit
                      </button>
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

               {/* ================= MODAL ================= */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              
              {/* NEW OPTION MODAL */}
              {modalType === "newOption" && (
                <>
                  <h3>What do you want to add?</h3>
                  <button style={{ ...styles.newOptionButton, background:"#1f2937", color:"#fff" }} onClick={openNewItemModal}>Add New Item</button>
                  <button style={{ ...styles.newOptionButton, background:"#e5e7eb", color:"#374151" }} onClick={openNewTransactionModal}>Add New Transaction</button>
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

                  {/* 🔹 BRAND SELECTOR (Stock-Room Aware) */}
                  <input
                    style={styles.input}
                    list="brand-list-item"
                    placeholder="Brand"
                    value={form.brand}
                    onChange={e => handleFormChange("brand", e.target.value)}
                  />
                  <datalist id="brand-list-item">
                    {items
                      .filter(i => i.item_name === form.item_name && i.location === selectedStockRoom)
                      .map(i => <option key={i.id} value={i.brand}>{i.brand}</option>)
                    }
                  </datalist>

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
                    {items.filter(i => i.location === selectedStockRoom).map(i => <option key={i.id} value={i.item_name}>{i.item_name}</option>)}
                  </datalist>

                  {/* 🔹 BRAND SELECTOR (Stock-Room Aware) */}
                  <input
                    style={styles.input}
                    list="brand-list-tx"
                    placeholder="Brand"
                    value={form.brand}
                    onChange={e => handleFormChange("brand", e.target.value)}
                  />
                  <datalist id="brand-list-tx">
                    {items
                      .filter(i => i.item_name === form.item_name && i.location === selectedStockRoom)
                      .map(i => <option key={i.id} value={i.brand}>{i.brand}</option>)
                    }
                  </datalist>

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
                    loadData();
                  }
                  else if(type==="permanentDeleteItem") {
                    await supabase.from("items").delete().eq("id", data.id);
                    await supabase.from("inventory_transactions").delete().eq("item_id", data.id);
                    loadData();
                  }
                  else if(type==="restoreItem") {
                    await supabase.from("items").update({ deleted:false }).eq("id", data.id);
                    await supabase.from("inventory_transactions").update({ deleted:false }).eq("item_id", data.id);
                    loadData();
                  }
                  else if(type==="deleteTx") {
                    await supabase.from("inventory_transactions").update({ deleted:true }).eq("id", data.id);
                    loadData();
                  }
                  else if(type==="permanentDeleteTx") {
                    await supabase.from("inventory_transactions").delete().eq("id", data.id);
                    loadData();
                  }
                  else if(type==="restoreTx") {
                    await supabase.from("inventory_transactions").update({ deleted:false }).eq("id", data.id);
                    loadData(); // ✅ refresh stock immediately
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
