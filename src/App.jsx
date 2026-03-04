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
    "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L4","L5","L6","L7",
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
  // ================= MONTHLY REPORT STATE =================
const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
const [reportYear, setReportYear] = useState(new Date().getFullYear());

// ================= MONTHLY REPORT LOGIC =================
const monthlyTransactions = filteredTransactions.filter(t => {
  if (!t.date) return false;
  const txDate = new Date(t.date);
  return (
    txDate.getMonth() + 1 === Number(reportMonth) &&
    txDate.getFullYear() === Number(reportYear)
  );
});

const monthlySummary = monthlyTransactions.reduce((acc, t) => {
  const total =
    (Number(t.quantity) || 0) *
    (Number(t.unit_price) || Number(t.items?.unit_price) || 0);

  if (t.type === "IN") {
    acc.totalInQty += Number(t.quantity) || 0;
    acc.totalInValue += total;
  } else {
    acc.totalOutQty += Number(t.quantity) || 0;
    acc.totalOutValue += total;
  }

  return acc;
}, {
  totalInQty: 0,
  totalOutQty: 0,
  totalInValue: 0,
  totalOutValue: 0
});

const netValue =
  monthlySummary.totalInValue - monthlySummary.totalOutValue;
  // ================= FORM HANDLER =================
  const handleFormChange = (key, value) => {
  setForm(prev => {
    const updated = { ...prev, [key]: value };

    if (key === "item_name") {
      // Reset brand when changing item
      updated.brand = "";

      // Optional: if only one brand exists, pre-select it
      const relatedBrands = items
        .filter(i => i.item_name === value && i.location === selectedStockRoom && !i.deleted)
        .map(i => i.brand);
      if (relatedBrands.length === 1) updated.brand = relatedBrands[0];
    }

    if (key === "brand") {
      // Optional: auto-fill price based on selected item + brand
      const selectedItem = items.find(
        i => i.item_name === prev.item_name && i.brand === value && i.location === selectedStockRoom
      );
      if (selectedItem) updated.price = selectedItem.unit_price;
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
  setConfirmAction({
    type: "createItemConfirm",
    data: { ...form }
  });
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
      setForm({ date:"", item_id:"", item_name:"", brand:"", brandOptions:[], type:"IN", quantity:"", price:"", id:null });
      setShowModal(false);
      setModalType("");
      loadData();
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
      setForm({ date:"", item_id:"", item_name:"", brand:"", brandOptions:[], type:"IN", quantity:"", price:"", id:null });
      setShowModal(false);
      setModalType("");
      loadData();
    }
  };

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
          <button style={styles.buttonPrimary} onClick={handleNewClick}>+ New</button>
          <button style={{...styles.buttonSecondary, background:"#ef4444", color:"#fff"}} onClick={async () => { await supabase.auth.signOut(); setSession(null); }}>Logout</button>
        </div>
      </div>

      {/* ================= MAIN AREA ================= */}
<div style={styles.main}>
  {/* ================= STOCK TAB ================= */}
  {activeTab === "stock" && (
    <div
      style={{
        flex: 1,
        background: "#ffffff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        maxHeight: 600,
        overflowY: "auto"
      }}
    >
      <h2>Available Stocks</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderSpacing: 0,
        }}
      >
        <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
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
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ ...styles.buttonSecondary }}
                      onClick={() => {
                        setForm({
                          id: i.id,
                          item_name: i.item_name,
                          brand: i.brand,
                          price: i.unit_price,
                          brandOptions: [i.brand],
                        });
                        setModalType("item");
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }}
                      onClick={() => setConfirmAction({ type:"deleteItem", data:i })}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )}

  {/* ================= TRANSACTIONS TAB ================= */}
  {activeTab === "transactions" && (
    <div
      style={{
        flex: 1,
        background: "#ffffff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        maxHeight: 600,
        overflowY: "auto"
      }}
    >
      <h2>Transactions</h2>
      <input style={styles.input} placeholder="Search..." value={inSearch} onChange={e => setInSearch(e.target.value)} />
      <table style={{ width: "100%", borderCollapse: "collapse", borderSpacing: 0 }}>
        <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
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
          {filteredTransactions.filter(t => t.items?.item_name.toLowerCase().includes(inSearch.toLowerCase())).length === 0
            ? emptyRowComponent(7, "No transactions")
            : filteredTransactions.filter(t => t.items?.item_name.toLowerCase().includes(inSearch.toLowerCase())).map(t => (
              <tr key={t.id}>
                <td style={styles.thtd}>{t.date}</td>
                <td style={styles.thtd}>{t.items?.item_name}</td>
                <td style={styles.thtd}>{t.items?.brand}</td>
                <td style={styles.thtd}>{t.type}</td>
                <td style={styles.thtd}>{t.quantity}</td>
                <td style={styles.thtd}>₱{((t.quantity || 0) * (t.unit_price || t.items?.unit_price || 0)).toFixed(2)}</td>
                <td style={styles.thtd}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ ...styles.buttonSecondary }}
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
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )}

  {/* ================= DELETED HISTORY TAB ================= */}
  {activeTab === "deleted" && (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      {/* Deleted Inventory */}
      <div
        style={{
          flex: 1,
          background: "#ffffff",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          maxHeight: 600,
          overflowY: "auto"
        }}
      >
        <h2>Deleted Inventory</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", borderSpacing: 0 }}>
          <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
            <tr>
              <th style={styles.thtd}>Item Name</th>
              <th style={styles.thtd}>Brand</th>
              <th style={styles.thtd}>Price</th>
              <th style={styles.thtd}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deletedItems.length === 0 ? emptyRowComponent(4, "No deleted items") :
              deletedItems.map(i => (
                <tr key={i.id}>
                  <td style={styles.thtd}>{i.item_name}</td>
                  <td style={styles.thtd}>{i.brand}</td>
                  <td style={styles.thtd}>₱{i.unit_price.toFixed(2)}</td>
                  <td style={styles.thtd}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ ...styles.buttonSecondary, background:"#34d399", color:"#fff" }} onClick={() => setConfirmAction({ type:"restoreItem", data:i })}>Restore</button>
                      <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={() => setConfirmAction({ type:"permanentDeleteItem", data:i })}>Delete Permanently</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Deleted Transactions */}
      <div
        style={{
          flex: 1,
          background: "#ffffff",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          maxHeight: 600,
          overflowY: "auto"
        }}
      >
        <h2>Deleted Transactions</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", borderSpacing: 0 }}>
          <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
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
            {deletedTransactions.length === 0 ? emptyRowComponent(7, "No deleted transactions") :
              deletedTransactions.map(t => (
                <tr key={t.id}>
                  <td style={styles.thtd}>{t.date}</td>
                  <td style={styles.thtd}>{t.items?.item_name}</td>
                  <td style={styles.thtd}>{t.items?.brand}</td>
                  <td style={styles.thtd}>{t.type}</td>
                  <td style={styles.thtd}>{t.quantity}</td>
                  <td style={styles.thtd}>₱{((t.quantity || 0) * (t.unit_price || t.items?.unit_price || 0)).toFixed(2)}</td>
                  <td style={styles.thtd}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ ...styles.buttonSecondary, background:"#34d399", color:"#fff" }} onClick={() => setConfirmAction({ type:"restoreTx", data:t })}>Restore</button>
                      <button style={{ ...styles.buttonSecondary, background:"#f87171", color:"#fff" }} onClick={() => setConfirmAction({ type:"permanentDeleteTx", data:t })}>Delete Permanently</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
</div>

        {/* ================= PROFESSIONAL MONTHLY REPORT ================= */}
{activeTab === "report" && (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

    {/* HEADER */}
    <div style={{
      background: "#111827",
      color: "#fff",
      padding: 20,
      borderRadius: 10
    }}>
      <h2 style={{ margin: 0 }}>Lago De Oro Inventory Monthly Report</h2>
      <p style={{ margin: "4px 0 0 0", opacity: 0.8 }}>
        {new Date(0, reportMonth - 1).toLocaleString("default", { month: "long" })} {reportYear}
        {selectedStockRoom && ` — ${selectedStockRoom}`}
      </p>
    </div>

    {/* FILTERS */}
    <div style={{ display: "flex", gap: 12 }}>
      <select
        style={styles.input}
        value={reportMonth}
        onChange={e => setReportMonth(Number(e.target.value))}
      >
        {[...Array(12)].map((_, i) => (
          <option key={i+1} value={i+1}>
            {new Date(0, i).toLocaleString("default", { month: "long" })}
          </option>
        ))}
      </select>

      <input
        style={styles.input}
        type="number"
        value={reportYear}
        onChange={e => setReportYear(Number(e.target.value))}
      />
    </div>

    {/* KPI SUMMARY */}
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 16
    }}>
      <div style={{ ...styles.card, borderLeft: "6px solid #10b981" }}>
        <h4>Total IN</h4>
        <p>{monthlySummary.totalInQty} units</p>
        <strong>₱{monthlySummary.totalInValue.toFixed(2)}</strong>
      </div>

      <div style={{ ...styles.card, borderLeft: "6px solid #ef4444" }}>
        <h4>Total OUT</h4>
        <p>{monthlySummary.totalOutQty} units</p>
        <strong>₱{monthlySummary.totalOutValue.toFixed(2)}</strong>
      </div>

      <div style={{
        ...styles.card,
        background: netValue >= 0 ? "#ecfdf5" : "#fef2f2",
        borderLeft: `6px solid ${netValue >= 0 ? "#10b981" : "#ef4444"}`
      }}>
        <h4>Net Movement</h4>
        <strong style={{ fontSize: 18 }}>
          ₱{netValue.toFixed(2)}
        </strong>
      </div>
    </div>

    {/* PER ITEM SUMMARY */}
    <div style={styles.card}>
      <h3>Per Item Summary</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.thtd}>Item</th>
            <th style={styles.thtd}>Brand</th>
            <th style={styles.thtd}>Total IN</th>
            <th style={styles.thtd}>Total OUT</th>
            <th style={styles.thtd}>Net Qty</th>
            <th style={styles.thtd}>Net Value</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const grouped = {};

            monthlyTransactions.forEach(t => {
              const key = `${t.items?.item_name}-${t.items?.brand}`;
              if (!grouped[key]) {
                grouped[key] = {
                  item: t.items?.item_name,
                  brand: t.items?.brand,
                  inQty: 0,
                  outQty: 0,
                  inVal: 0,
                  outVal: 0
                };
              }

              const total = (t.quantity || 0) *
                (t.unit_price || t.items?.unit_price || 0);

              if (t.type === "IN") {
                grouped[key].inQty += Number(t.quantity);
                grouped[key].inVal += total;
              } else {
                grouped[key].outQty += Number(t.quantity);
                grouped[key].outVal += total;
              }
            });

            const rows = Object.values(grouped);

            if (rows.length === 0)
              return emptyRowComponent(6, "No data for this month");

            return rows.map((r, index) => {
              const netQty = r.inQty - r.outQty;
              const netVal = r.inVal - r.outVal;

              return (
                <tr key={index}>
                  <td style={styles.thtd}>{r.item}</td>
                  <td style={styles.thtd}>{r.brand}</td>
                  <td style={styles.thtd}>{r.inQty}</td>
                  <td style={styles.thtd}>{r.outQty}</td>
                  <td style={styles.thtd}>{netQty}</td>
                  <td style={styles.thtd}>₱{netVal.toFixed(2)}</td>
                </tr>
              );
            });
          })()}
        </tbody>
      </table>
    </div>

    {/* DETAILED TRANSACTIONS */}
    <div style={styles.card}>
      <h3>Detailed Transactions</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.thtd}>Date</th>
            <th style={styles.thtd}>Item</th>
            <th style={styles.thtd}>Brand</th>
            <th style={styles.thtd}>Type</th>
            <th style={styles.thtd}>Qty</th>
            <th style={styles.thtd}>Total</th>
          </tr>
        </thead>
        <tbody>
          {monthlyTransactions.length === 0
            ? emptyRowComponent(6, "No transactions")
            : monthlyTransactions.map(t => (
                <tr key={t.id}>
                  <td style={styles.thtd}>{t.date}</td>
                  <td style={styles.thtd}>{t.items?.item_name}</td>
                  <td style={styles.thtd}>{t.items?.brand}</td>
                  <td style={styles.thtd}>{t.type}</td>
                  <td style={styles.thtd}>{t.quantity}</td>
                  <td style={styles.thtd}>
                    ₱{((t.quantity || 0) *
                      (t.unit_price || t.items?.unit_price || 0)
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>

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

                  <select
  style={styles.input}
  value={form.item_name}
  onChange={e => handleFormChange("item_name", e.target.value)}
>
  <option value="">Select Item</option>
  {[
    ...new Set(
      items
        .filter(i => i.location === selectedStockRoom && !i.deleted)
        .map(i => i.item_name)
    )
  ].map(itemName => (
    <option key={itemName} value={itemName}>{itemName}</option>
  ))}
</select>

                  {/* 🔹 BRAND SELECTOR (Stock-Room Aware) */}
                  <select
  style={styles.input}
  value={form.brand}
  onChange={e => handleFormChange("brand", e.target.value)}
  disabled={!form.item_name} // disabled until an item is selected
>
  <option value="">Select Brand</option>
  {items
    .filter(i => i.item_name === form.item_name && i.location === selectedStockRoom && !i.deleted)
    .map(i => i.brand)
    .filter((brand, index, self) => self.indexOf(brand) === index) // unique brands
    .map(brand => (
      <option key={brand} value={brand}>{brand}</option>
    ))}
</select>

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
<p>
  {confirmAction.type === "createItemConfirm"
    ? "This item does not exist. Do you want to create a new item?"
    : `Are you sure you want to ${confirmAction.type.includes("delete") ? "delete" : "restore"} this ${confirmAction.type.includes("Tx") ? "transaction" : "item"}?`
  }
</p>              <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
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
                  else if(type === "createItemConfirm") {
                  setModalTypeBeforeItem("transaction");
                  setModalType("item");
                  setShowModal(true);
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
