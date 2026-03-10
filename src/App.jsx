import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://mkfhjklomofrvnnwwknh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZmhqa2xvbW9mcnZubnd3a25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMTczNzAsImV4cCI6MjA4ODU5MzM3MH0.6Q8p9ms8mnf2daONf7HTP3jGZD_bQuNQrv6cpy0ZUts";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const styles = {

  container:{},
  sidebar:{},
  main:{},

  thtd:{
    padding:"10px"
  },

  buttonSecondary:{
    padding:"6px 12px"
  },

  categoryRow:{
    background:"#f8fafc",
    cursor:"pointer"
  },

  categoryContainer:{
    display:"flex",
    justifyContent:"space-between"
  },

  categoryLeft:{
    display:"flex",
    gap:10
  },

  categoryRight:{
    display:"flex",
    gap:20
  },

  // ⭐ ADD HERE
  dashboard:{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
    gap:20,
    marginBottom:20
  },

  dashboardCard:{
    background:"#fff",
    border:"1px solid #e5e7eb",
    borderRadius:10,
    padding:"18px",
    boxShadow:"0 2px 6px rgba(0,0,0,0.05)"
  },

  dashboardTitle:{
    fontSize:13,
    color:"#6b7280",
    marginBottom:6
  },

  dashboardValue:{
    fontSize:22,
    fontWeight:700,
    color:"#111827"
  }
  container: { 
    display: "flex", 
    fontFamily: "Inter, Arial, sans-serif", 
    height: "100vh",    // full viewport height
    background: "#f3f4f6", 
    overflow: "hidden"  // prevent body scroll, scroll only in main
  },
  sidebar: {
    width: 220,
    background: "#111827",
    color: "#fff",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100vh",     // full viewport height
    position: "sticky",  // keep it fixed
    top: 0
  },  
  sidebarHeader: { fontSize: 20, fontWeight: 700, marginBottom: 24 },
  sidebarSelect: { marginBottom: 24, padding: 8, borderRadius: 6, border: "none", width: "100%" },
  sidebarTabs: { display: "flex", flexDirection: "column", gap: 12 },
  tabButton: (active) => ({ padding: 10, borderRadius: 6, background: active ? "#1f2937" : "transparent", border: "none", color: "#fff", cursor: "pointer", textAlign: "left" }),
  main: { 
    flex: 1, 
    padding: 24, 
    overflowY: "auto",    // allows scrolling of right side
    height: "100vh"       // fills vertical space
  },  
  categoryRow:{
  background:"#f8fafc",
  borderTop:"1px solid #e5e7eb",
  borderBottom:"1px solid #e5e7eb",
  cursor:"pointer"
},

categoryContainer:{
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  fontWeight:600
},

categoryLeft:{
  display:"flex",
  alignItems:"center",
  gap:10,
  fontSize:15
},

categoryRight:{
  display:"flex",
  gap:20,
  fontSize:13,
  color:"#6b7280",
  fontWeight:500
},
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
  const [outSearch, setOutSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [openCategories, setOpenCategories] = useState({});
  const toggleCategory = (category) => {
      setOpenCategories(prev => ({
        ...prev,
        [category]: !prev[category]
      }));
    };
  const [deletedItemSearch, setDeletedItemSearch] = useState("");
  const [deletedTxSearch, setDeletedTxSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalTypeBeforeItem, setModalTypeBeforeItem] = useState("");
  const [form, setForm] = useState({
    date:"",
    item_id:"",
    item_name:"",
    brand:"",
    category:"",
    brandOptions:[],
    type:"IN",
    quantity:"",
    price:"",
    id:null
  });  
  const categories = [
  ...new Set(items.map(i => i.category).filter(Boolean))
    ];
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
      
        const itemsWithDeleted = (itemsData || []).map(i => ({
          ...i,
          deleted: i.deleted ?? false
        }));
      
        const { data: tx } = await supabase
          .from("inventory_transactions")
          .select("*, items(item_name, brand, unit_price, location, category)")
          .order("date", { ascending: false });
      
        const transactionsWithDeleted = (tx || []).map(t => ({
          ...t,
          deleted: t.deleted ?? false
        }));
      
        setItems(itemsWithDeleted);
        setTransactions(transactionsWithDeleted);
      
        // ✅ Initialize categories as CLOSED
        const closed = {};

        itemsWithDeleted.forEach(i => {
          const cat = i.category || "Uncategorized";
        
          if (!(cat in closed)) {
            closed[cat] = false;
          }
        });
        
        setOpenCategories(closed);
      };
  // ================= FILTERS =================
  const filteredTransactions = transactions
    .filter(t => !t.deleted)
    .filter(t => !selectedStockRoom || t.location === selectedStockRoom);  
  
  const stockMap = filteredTransactions.reduce((acc, t) => {
        const qty = Number(t.quantity) || 0;
      
        if (!acc[t.item_id]) acc[t.item_id] = 0;
      
        acc[t.item_id] += t.type === "IN" ? qty : -qty;
      
        return acc;
      }, {});
  const inTransactions = filteredTransactions.filter(t => t.type === "IN");
  const outTransactions = filteredTransactions.filter(t => t.type === "OUT");

  const stockInventory = items
    .filter(i => !i.deleted)
    .filter(i => !selectedStockRoom || i.location === selectedStockRoom)
    .map(i => {
      const stock = stockMap[i.id] || 0;
      return { 
            id: i.id,
            item_name: i.item_name,
            brand: i.brand,
            category: i.category,
            unit_price: i.unit_price,
            stock,
            location: i.location
          };
    });

  const deletedItems = items.filter(i => i.deleted).filter(i => !selectedStockRoom || i.location === selectedStockRoom);
  const deletedTransactions = transactions.filter(t => t.deleted).filter(t => !selectedStockRoom || t.items?.location === selectedStockRoom);
  const filteredDeletedItems = deletedItems.filter(i =>
  i.item_name.toLowerCase().includes(deletedItemSearch.toLowerCase()) ||
  i.brand.toLowerCase().includes(deletedItemSearch.toLowerCase())
);

const filteredDeletedTransactions = deletedTransactions.filter(t =>
  t.items?.item_name?.toLowerCase().includes(deletedTxSearch.toLowerCase()) ||
  t.items?.brand?.toLowerCase().includes(deletedTxSearch.toLowerCase())
);
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
    Number(t.unit_price ?? t.items?.unit_price ?? 0);

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
  setForm({ 
    date:"", 
    item_id:"", 
    item_name:"", 
    brand:"", 
    brandOptions:[], 
    type:"IN", 
    quantity:"", 
    price:"", 
    id:null,
    location: selectedStockRoom  // ✅ add this
  });
  setModalType("item");
  setShowModal(true);
};

  const openNewTransactionModal = () => {
  setForm({ 
    date:"", 
    item_id:"", 
    item_name:"", 
    brand:"", 
    brandOptions:[], 
    type:"IN", 
    quantity:"", 
    price:"", 
    id:null,
    location: selectedStockRoom // ✅ add this
  });
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
      /* 🚨 PREVENT NEGATIVE STOCK */
if (form.type === "OUT") {

  const currentStock = stockMap[existingItem.id] || 0;

  if (Number(form.quantity) > currentStock) {
    alert("Not enough stock.");
    return;
  }
}

      const txData = {
        date: form.date,
        item_id: existingItem.id,
        brand: form.brand || existingItem.brand,
        type: form.type,
        quantity: Number(form.quantity),
        unit_price: Number(form.price || existingItem.unit_price || 0),
        location: form.location || selectedStockRoom  // ✅ add this line
      };
      if(form.id) await supabase.from("inventory_transactions").update(txData).eq("id", form.id);
      else await supabase.from("inventory_transactions").insert([txData]);
      setForm({ date:"", item_id:"", item_name:"", brand:"", brandOptions:[], type:"IN", quantity:"", price:"", id:null });
      setShowModal(false);
      setModalType("");
      loadData();
    } else if(modalType === "item") {
      if(!form.item_name || !form.brand || !form.price) return alert("Fill required fields");
      const itemData = { 
          item_name: form.item_name, 
          brand: form.brand,
          category: form.category,
          unit_price: Number(form.price),
          location: form.location || selectedStockRoom
        };
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
        <div style={{
          ...styles.sidebar,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          justifyContent: "space-between",
          padding: "16px 12px",       // smaller horizontal padding on narrow screens
          boxSizing: "border-box",
          width: "220px",             // fixed default width
          minWidth: "180px",          // ensures it doesn't shrink too much
          maxWidth: "250px",          // prevents it from being too wide on large screens
        }}>
          {/* Top Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={styles.sidebarHeader}>Lago De Oro</div>
            
            <select
              style={{ ...styles.sidebarSelect, width: "100%" }}
              value={selectedStockRoom}
              onChange={e => setSelectedStockRoom(e.target.value)}
            >
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
        
          {/* Bottom Section */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            paddingBottom: 16,
            textAlign: "center"
          }}>
            {session?.user?.email && (
              <div style={{
                color: "#f9fafb",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 8,
                lineHeight: 1.3,
                wordBreak: "break-word"
              }}>
                Logged in as<br />
                <span style={{ fontWeight: 700 }}>{session.user.email}</span>
              </div>
            )}
          
            {/* + New Button */}
              <button
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",    // friendly blue background
                  color: "#ffffff",         // white text
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  transition: "background 0.2s, transform 0.1s"
                }}
                onClick={handleNewClick}
                onMouseEnter={e => { 
                  e.currentTarget.style.background = "#1d4ed8";  // slightly darker on hover
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.background = "#2563eb";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                + New
              </button>
              
              {/* Logout Button */}
              <button
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  background: "#ef4444",   // friendly red
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  transition: "background 0.2s, transform 0.1s"
                }}
                onClick={async () => { await supabase.auth.signOut(); setSession(null); }}
                onMouseEnter={e => { 
                  e.currentTarget.style.background = "#dc2626"; // darker red on hover
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.background = "#ef4444";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Logout
              </button>
          </div>
        </div>

      {/* MAIN AREA */}
      <div style={styles.main}>
        {/* STOCK INVENTORY TAB WITH SEARCH */}
{activeTab === "stock" && (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {/* Search Bar */}
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <input
        type="text"
        placeholder="Search by Item Name or Brand..."
        value={stockSearch}
        onChange={(e) => setStockSearch(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          width: 300,
          fontSize: 14,
          outline: "none",
        }}
      />
    </div>

    {/* Table Card */}
    <div
      style={{
        flex: 1,
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        overflowX: "auto",
      }}
    >
      <h2>Available Stocks</h2>

        <div style={styles.dashboard}>
        
        <div style={styles.dashboardCard}>
        <div style={styles.dashboardTitle}>Total Inventory Value</div>
        <div style={styles.dashboardValue}>
        ₱{totalInventoryValue.toLocaleString(undefined,{minimumFractionDigits:2})}
        </div>
        </div>
        
        <div style={styles.dashboardCard}>
        <div style={styles.dashboardTitle}>Total Items</div>
        <div style={styles.dashboardValue}>{totalItems}</div>
        </div>
        
        <div style={styles.dashboardCard}>
        <div style={styles.dashboardTitle}>Low Stock Items</div>
        <div style={styles.dashboardValue}>{lowStockItems}</div>
        </div>
        
        <div style={styles.dashboardCard}>
        <div style={styles.dashboardTitle}>Categories</div>
        <div style={styles.dashboardValue}>{totalCategories}</div>
        </div>
        
        </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
          <tr>
            {["Qty", "Item Name", "Brand", "Price", "Total Value", "Actions"].map((th, idx) => (
              <th
                key={idx}
                style={{
                  padding: "12px 10px",
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: 600,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {th}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
            {(() => {
              // Group stock by category
              const groupedStock = stockInventory
                .filter(
                  (item) =>
                    (item.item_name || "").toLowerCase().includes(stockSearch.toLowerCase()) ||
                    (item.brand || "").toLowerCase().includes(stockSearch.toLowerCase())
                )
                .reduce((acc, item) => {
                  const cat = item.category || "Uncategorized";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {});
          
              if (Object.keys(groupedStock).length === 0) {
                return (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>
                      No matching items
                    </td>
                  </tr>
                );
              }
          
              return Object.entries(groupedStock).map(([category, items]) => {

                const isOpen = openCategories[category] === true;
              
                const totalValue = items.reduce(
                  (sum, i) => sum + (i.stock * i.unit_price),
                  0
                );
              
                return (
                  <React.Fragment key={category}>
              
                    {/* CATEGORY HEADER */}
                    <tr
                      style={styles.categoryRow}
                      onClick={(e)=>{
                          if(e.target.tagName !== "BUTTON"){
                            toggleCategory(category);
                          }
                        }}
                      >
                      <td colSpan={6} style={{padding:"12px 14px"}}>
                      
                      <div style={styles.categoryContainer}>
                      
                      <div style={styles.categoryLeft}>
                      <span style={{color:"#6b7280"}}>
                      {isOpen ? "▾" : "▸"}
                      </span>
                      
                      <span>{category}</span>
                      </div>
                      
                      <div style={styles.categoryRight}>
                      <span>
                      {items.length} item{items.length !== 1 ? "s" : ""}
                      </span>
                      
                      <span style={{fontWeight:600,color:"#111827"}}>
                      ₱{totalValue.toLocaleString(undefined,{minimumFractionDigits:2})}
                      </span>
                      </div>
                      
                      </div>
                      
                      </td>
                      </tr>
              
                    {/* ITEMS */}
                    {isOpen && items.map(i => (
                      <tr
                          key={i.id}
                          style={{
                            background: i.stock <= 5 ? "#fee2e2" : "transparent"
                          }}
                        >
                        <td style={styles.thtd}>{i.stock}</td>
                        <td style={styles.thtd}>{i.item_name}</td>
                        <td style={styles.thtd}>{i.brand}</td>
                        <td style={styles.thtd}>₱{Number(i.unit_price || 0).toFixed(2)}</td>
                        <td style={styles.thtd}>₱{(i.stock * Number(i.unit_price || 0)).toFixed(2)}</td>
                        <td style={styles.thtd}>
                          <div style={{ display:"flex", gap:10 }}>
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
                    ))}
              
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
      </table>
    </div>
  </div>
)}

{/* TRANSACTIONS TAB */}
{activeTab === "transactions" && (
  <div style={{
    display: "flex",
    gap: 20,
    alignItems: "stretch", // ensures equal height
  }}>
    {/* ================= IN TRANSACTIONS ================= */}
    <div style={{
      flex: 1,
      background: "#fff",
      padding: 20,
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      maxHeight: "600px", // scrollable height
    }}>
      <h2>IN Transactions</h2>
      <input
        style={{ ...styles.input, marginBottom: 10 }}
        placeholder="Search IN transactions..."
        value={inSearch}
        onChange={(e) => setInSearch(e.target.value)}
      />
      <div style={{ overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
            <tr>
              {["Date", "Item", "Brand", "Category", "Qty", "Total Price", "Actions"].map((th, idx) => (
                <th key={idx} style={{ padding: "12px 10px", textAlign: "left", fontSize: 14, fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const stockInventory = items.filter(i => !i.deleted);
                  // DASHBOARD DATA
              const totalItems = stockInventory.length;
              
              const totalCategories = new Set(
                stockInventory.map(i => i.category || "Uncategorized")
              ).size;
              
              const lowStockItems = stockInventory.filter(i => i.stock <= 5).length;
              
              const totalInventoryValue = stockInventory.reduce(
                (sum, i) => sum + (i.stock * Number(i.unit_price || 0)),
                0
              );
              const filteredIn = inTransactions.filter(
                (item) =>
                  (item.items?.item_name || "").toLowerCase().includes(inSearch.toLowerCase()) ||
                  (item.items?.brand || "").toLowerCase().includes(inSearch.toLowerCase())
              );
          
              if (filteredIn.length === 0) {
                return (
                  <tr>
                    <td colSpan={7} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>
                      No matching items
                    </td>
                  </tr>
                );
              }
          
              // Group by category
              const groupedIn = filteredIn.reduce((acc, item) => {
                const cat = item.items?.category || "Uncategorized";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
              }, {});
          
              return Object.entries(groupedIn).map(([category, items]) => (
                <React.Fragment key={category}>
                  <tr>
                    <td colSpan={7} style={{ background: "#f3f4f6", fontWeight: 600, padding: "10px 12px" }}>
                      {category}
                    </td>
                  </tr>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.date}</td>
                      <td>{i.items?.item_name}</td>
                      <td>{i.items?.brand}</td>
                      <td>{i.items?.category}</td>
                      <td>{i.quantity}</td>
                      <td>₱{(i.quantity * (i.unit_price || i.items?.unit_price)).toFixed(2)}</td>
                     <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            style={{ ...styles.buttonSecondary }}
                            onClick={() => {
                              setForm({
                                id: i.id,
                                item_id: i.item_id,
                                date: i.date,
                                item_name: i.items?.item_name,
                                brand: i.items?.brand,
                                type: i.type,
                                quantity: i.quantity,
                                price: i.unit_price || i.items?.unit_price,
                                brandOptions: [i.items?.brand],
                              });
                              setModalType("transaction");
                              setShowModal(true);
                            }}
                          >
                            Edit
                          </button>
                      
                          <button
                            style={{ ...styles.buttonSecondary, background: "#f87171", color: "#fff" }}
                            onClick={() => setConfirmAction({ type: "deleteTx", data: i })}
                          >
                            Delete
                          </button>
                      
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>

    {/* ================= OUT TRANSACTIONS ================= */}
    <div style={{
      flex: 1,
      background: "#fff",
      padding: 20,
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      maxHeight: "600px", // scrollable height
    }}>
      <h2>OUT Transactions</h2>
      <input
        style={{ ...styles.input, marginBottom: 10 }}
        placeholder="Search OUT transactions..."
        value={outSearch}
        onChange={(e) => setOutSearch(e.target.value)}
      />
      <div style={{ overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
            <tr>
              {["Date", "Item", "Brand", "Category", "Qty", "Total Price", "Actions"].map((th, idx) => (
                <th key={idx} style={{ padding: "12px 10px", textAlign: "left", fontSize: 14, fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
              {(() => {
                    const filteredOut = outTransactions.filter(
                      (item) =>
                        (item.items?.item_name || "").toLowerCase().includes(outSearch.toLowerCase()) ||
                        (item.items?.brand || "").toLowerCase().includes(outSearch.toLowerCase())
                    );
            
                if (filteredOut.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>
                        No matching items
                      </td>
                    </tr>
                  );
                }
            
                // Group by category
                const groupedOut = filteredOut.reduce((acc, item) => {
                  const cat = item.items?.category || "Uncategorized";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {});
            
                return Object.entries(groupedOut).map(([category, items]) => (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <tr>
                      <td colSpan={7} style={{ background: "#f3f4f6", fontWeight: 600, padding: "10px 12px" }}>
                        {category}
                      </td>
                    </tr>
                    {/* Items under the category */}
                    {items.map((i) => (
                      <tr key={i.id}>
                      <td>{i.date}</td>
                      <td>{i.items?.item_name}</td>
                      <td>{i.items?.brand}</td>
                      <td>{i.items?.category}</td>
                      <td>{i.quantity}</td>
                      <td>₱{(i.quantity * (i.unit_price || i.items?.unit_price)).toFixed(2)}</td>
                        <td style={{ padding: "12px 10px", borderBottom: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", gap: 10 }}>
                            <button
                              style={{ ...styles.buttonSecondary }}
                              onClick={() => {
                                setForm({
                                    id: i.id,
                                    item_id: i.item_id,
                                    date: i.date,
                                    item_name: i.items?.item_name,
                                    brand: i.items?.brand,
                                    type: i.type,
                                    quantity: i.quantity,
                                    price: i.unit_price || i.items?.unit_price,
                                    brandOptions: [i.items?.brand],
                                  });
                                setModalType("transaction");
                                setShowModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              style={{ ...styles.buttonSecondary, background: "#f87171", color: "#fff" }}
                              onClick={() => setConfirmAction({ type: "deleteTx", data: i })}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ));
              })()}
          </tbody>
        </table>
      </div>
    </div>

  </div>
)}

        {/* ================= DELETED HISTORY TAB ================= */}
       {activeTab==="deleted" && (
  <div style={{
    display: "flex",
    gap: 20,
    alignItems: "stretch", // ensures equal height
  }}>

    {/* ================= DELETED INVENTORY ================= */}
    <div style={{
      flex: 1,
      background: "#fff",
      padding: 20,
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      maxHeight: "600px",          // max height for scroll
    }}>
      <h2>Deleted Inventory</h2>
      <input
        style={{ ...styles.input, marginBottom: 10 }}
        placeholder="Search deleted items..."
        value={deletedItemSearch}
        onChange={(e) => setDeletedItemSearch(e.target.value)}
      />
      <div style={{ overflowY: "auto", flex: 1 }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
        }}>
          <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
            <tr>
              {["Item Name", "Brand", "Price", "Actions"].map((th, idx) => (
                <th key={idx} style={{
                  padding: "12px 10px",
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: 600,
                  borderBottom: "1px solid #e5e7eb"
                }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
              {(() => {
               const filteredDeleted = deletedItems.filter(
                  (item) =>
                    (item.item_name || "").toLowerCase().includes(deletedItemSearch.toLowerCase()) ||
                    (item.brand || "").toLowerCase().includes(deletedItemSearch.toLowerCase())
                );
            
                if (filteredDeleted.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>
                        No deleted items
                      </td>
                    </tr>
                  );
                }
            
                // Group by category
                const groupedDeleted = filteredDeleted.reduce((acc, item) => {
                  const cat = item.category || "Uncategorized";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {});
            
                return Object.entries(groupedDeleted).map(([category, items]) => (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <tr>
                      <td colSpan={4} style={{ background: "#f3f4f6", fontWeight: 600, padding: "10px 12px" }}>
                        {category}
                      </td>
                    </tr>
                    {/* Items under the category */}
                    {items.map((i) => (
                      <tr key={i.id}>
                        <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>{i.item_name}</td>
                        
                        <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>{i.brand}</td>
                        
                        <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                        ₱{Number(i.unit_price || 0).toFixed(2)}
                        </td>
                        
                        <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                        <div style={{ display:"flex", gap:8 }}>
                          
                          <button
                            style={{
                              padding:"6px 10px",
                              borderRadius:6,
                              border:"none",
                              background:"#10b981",
                              color:"#fff",
                              cursor:"pointer",
                              fontSize:13
                            }}
                            onClick={() => setConfirmAction({ type:"restoreItem", data:i })}
                          >
                            Restore
                          </button>
                      
                          <button
                            style={{
                              padding:"6px 10px",
                              borderRadius:6,
                              border:"none",
                              background:"#ef4444",
                              color:"#fff",
                              cursor:"pointer",
                              fontSize:13
                            }}
                            onClick={() => setConfirmAction({ type:"permanentDeleteItem", data:i })}
                          >
                            Delete
                          </button>
                      
                        </div>
                      </td>
                        </tr>
                    ))}
                  </React.Fragment>
                ));
              })()}
            </tbody>
        </table>
      </div>
    </div>

    {/* ================= DELETED TRANSACTIONS ================= */}
    <div style={{
      flex: 1,
      background: "#fff",
      padding: 20,
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      maxHeight: "600px",          // max height for scroll
    }}>
      <h2>Deleted Transactions</h2>
      <input
        style={{ ...styles.input, marginBottom: 10 }}
        placeholder="Search deleted transactions..."
        value={deletedTxSearch}
        onChange={(e) => setDeletedTxSearch(e.target.value)}
      />
      <div style={{ overflowY: "auto", flex: 1 }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
        }}>
          <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
            <tr>
              {["Date", "Item", "Brand", "Type", "Qty", "Total Price", "Actions"].map((th, idx) => (
                <th key={idx} style={{
                  padding: "12px 10px",
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: 600,
                  borderBottom: "1px solid #e5e7eb"
                }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
              {(() => {
                  const filteredDeleted = deletedTransactions.filter(
                    (t) =>
                      (t.items?.item_name || "").toLowerCase().includes(deletedTxSearch.toLowerCase()) ||
                      (t.items?.brand || "").toLowerCase().includes(deletedTxSearch.toLowerCase())
                  );
            
                if (filteredDeleted.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>
                        No deleted items
                      </td>
                    </tr>
                  );
                }
            
                // Group by category
                const groupedDeleted = filteredDeleted.reduce((acc, item) => {
                  const cat = item.items?.category || "Uncategorized";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {});
            
                return Object.entries(groupedDeleted).map(([category, items]) => (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <tr>
                      <td colSpan={7} style={{ background: "#f3f4f6", fontWeight: 600, padding: "10px 12px" }}>
                        {category}
                      </td>
                    </tr>
                    {/* Items under the category */}
                    {items.map((i) => (
                      <tr key={i.id}>
                      <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>{i.date}</td>
                      
                      <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                      {i.items?.item_name}
                      </td>
                      
                      <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                      {i.items?.brand}
                      </td>
                      
                      <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                      {i.type}
                      </td>
                      
                      <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                      {i.quantity}
                      </td>
                      
                      <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                      ₱{(i.quantity * (i.unit_price || i.items?.unit_price)).toFixed(2)}
                      </td>
                      
                      <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                      <div style={{ display:"flex", gap:8 }}>

                        <button
                          style={{
                            padding:"6px 10px",
                            borderRadius:6,
                            border:"none",
                            background:"#10b981",
                            color:"#fff",
                            cursor:"pointer",
                            fontSize:13
                          }}
                          onClick={() => setConfirmAction({ type:"restoreTx", data:i })}
                        >
                          Restore
                        </button>
                      
                        <button
                          style={{
                            padding:"6px 10px",
                            borderRadius:6,
                            border:"none",
                            background:"#ef4444",
                            color:"#fff",
                            cursor:"pointer",
                            fontSize:13
                          }}
                          onClick={() => setConfirmAction({ type:"permanentDeleteTx", data:i })}
                        >
                          Delete
                        </button>
                      
                      </div>
                      </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ));
              })()}
            </tbody>
        </table>
      </div>
    </div>

  </div>
)}

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
              if (monthlyTransactions.length === 0) {
                return (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>
                      No transactions for this month
                    </td>
                  </tr>
                );
              }
          
              // Group by category
              const groupedMonthly = monthlyTransactions.reduce((acc, t) => {
                const cat = t.items?.category || "Uncategorized";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(t);
                return acc;
              }, {});
          
              return Object.entries(groupedMonthly).map(([category, items]) => (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr style={{ background: "#f3f4f6" }}>
                    <td colSpan={6} style={{ padding: 12, fontWeight: 600 }}>
                      {category}
                    </td>
                  </tr>
          
                  {/* Items in this category */}
                 {Object.values(
                  items.reduce((acc, t) => {
                    const key = `${t.items?.item_name}-${t.items?.brand}`;
                    const price = Number(t.unit_price || t.items?.unit_price || 0);
                    const qty = Number(t.quantity || 0);
                
                    if (!acc[key]) {
                      acc[key] = {
                        item: t.items?.item_name,
                        brand: t.items?.brand,
                        inQty: 0,
                        outQty: 0,
                        price
                      };
                    }
                
                    if (t.type === "IN") acc[key].inQty += qty;
                    else acc[key].outQty += qty;
                
                    return acc;
                  }, {})
                ).map((row, idx) => {
                  const netQty = row.inQty - row.outQty;
                  const netValue = netQty * row.price;
                
                  return (
                    <tr key={idx}>
                      <td style={styles.thtd}>{row.item}</td>
                      <td style={styles.thtd}>{row.brand}</td>
                      <td style={styles.thtd}>{row.inQty}</td>
                      <td style={styles.thtd}>{row.outQty}</td>
                      <td style={styles.thtd}>{netQty}</td>
                      <td style={styles.thtd}>₱{netValue.toFixed(2)}</td>
                    </tr>
                  );
                })}
                </React.Fragment>
              ));
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
                  <input 
                    style={styles.input} 
                    placeholder="Item Name" 
                    value={form.item_name} 
                    onChange={e => handleFormChange("item_name", e.target.value)}
                  />
                  <input 
                    style={styles.input} 
                    placeholder="Brand" 
                    value={form.brand} 
                    onChange={e => handleFormChange("brand", e.target.value)} 
                  />

                  <input
                    list="category-list"
                    style={styles.input}
                    placeholder="Select or type category"
                    value={form.category}
                    onChange={e => handleFormChange("category", e.target.value)}
                  />
                  
                  <datalist id="category-list">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  
                  <input 
                    style={styles.input} 
                    placeholder="Price" 
                    value={form.price} 
                    onChange={e => handleFormChange("price", e.target.value)} 
                  />
                  <button style={styles.buttonPrimary} onClick={handleSubmit}>
                    {form.id ? "Update" : "Create"}
                  </button>
                  <button style={styles.buttonSecondary} onClick={() => setShowModal(false)}>Cancel</button>
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
  <div style={styles.modalOverlay}>
    <div style={styles.modalCard}>
      <h3>Confirm Action</h3>

      <p>
        Are you sure you want to{" "}
        <b>
          {confirmAction.type === "deleteItem" && "delete this item?"}
          {confirmAction.type === "restoreItem" && "restore this item?"}
          {confirmAction.type === "permanentDeleteItem" && "permanently delete this item?"}
          {confirmAction.type === "deleteTx" && "delete this transaction?"}
          {confirmAction.type === "restoreTx" && "restore this transaction?"}
          {confirmAction.type === "permanentDeleteTx" && "permanently delete this transaction?"}
        </b>
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          style={styles.buttonPrimary}
          onClick={async () => {
            const { type, data } = confirmAction;

            try {

              if (type === "deleteItem") {
                await supabase.from("items").update({ deleted: true }).eq("id", data.id);
                await supabase.from("inventory_transactions").update({ deleted: true }).eq("item_id", data.id);
              }

              else if (type === "restoreItem") {
                await supabase.from("items").update({ deleted: false }).eq("id", data.id);
                await supabase.from("inventory_transactions").update({ deleted: false }).eq("item_id", data.id);
              }

              else if (type === "permanentDeleteItem") {
                await supabase.from("inventory_transactions").delete().eq("item_id", data.id);
                await supabase.from("items").delete().eq("id", data.id);
              }

              else if (type === "deleteTx") {
                await supabase.from("inventory_transactions").update({ deleted: true }).eq("id", data.id);
              }

              else if (type === "restoreTx") {
                await supabase.from("inventory_transactions").update({ deleted: false }).eq("id", data.id);
              }

              else if (type === "permanentDeleteTx") {
                await supabase.from("inventory_transactions").delete().eq("id", data.id);
              }

              await loadData();

            } catch (error) {
              console.error(error);
              alert("Something went wrong.");
            }

            setConfirmAction(null);
          }}
        >
          Confirm
        </button>

        <button
          style={styles.buttonSecondary}
          onClick={() => setConfirmAction(null)}
        >
          Cancel
        </button>
        </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
