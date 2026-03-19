import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import Draggable from "react-draggable";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://mkfhjklomofrvnnwwknh.supabase.co";
const supabaseKey = "YOUR_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= CONSTANTS (MOVED OUTSIDE COMPONENT) =================
const stockRooms = [
  "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L4","L5","L6","L7",
  "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
];

// ================= UTIL =================
const formatNumber = (num) => {
  if (num === null || num === undefined) return "";
  return Number(num).toLocaleString();
};

const normalize = (str) => (str || "").replace(/\s+/g, " ").trim().toLowerCase();

const capitalizeWords = (text) => {
  if (!text) return text;
  return text.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

// ================= APP =================
export default function App() {

  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedStockRoom, setSelectedStockRoom] = useState("");
  const [openCategories, setOpenCategories] = useState({});
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // ================= AUTH =================
  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    initAuth();

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  const loadData = useCallback(async () => {
    const { data: itemsData } = await supabase.from("items").select("*");
    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name, brand, unit_price, location, category)")
      .order("created_at", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session, loadData]);

  // ================= FILTERED DATA =================
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.deleted) return false;
      if (!selectedStockRoom) return true;

      const txLocation = normalize(t.location || t.items?.location);
      const selected = normalize(selectedStockRoom);

      return txLocation === selected;
    });
  }, [transactions, selectedStockRoom]);

  const stockMap = useMemo(() => {
    const acc = {};
    filteredTransactions.forEach(t => {
      const qty = Number(t.quantity) || 0;
      if (!acc[t.item_id]) acc[t.item_id] = 0;
      acc[t.item_id] += t.type === "IN" ? qty : -qty;
    });
    return acc;
  }, [filteredTransactions]);

  const stockInventory = useMemo(() => {
    return items
      .filter(i => !i.deleted)
      .filter(i => {
        if (!selectedStockRoom) return true;
        return normalize(i.location) === normalize(selectedStockRoom);
      })
      .map(i => ({
        ...i,
        stock: stockMap[i.id] || 0
      }));
  }, [items, selectedStockRoom, stockMap]);

  const totalInventoryValue = useMemo(() => {
    return stockInventory.reduce((sum, i) => sum + (i.stock * (i.unit_price || 0)), 0);
  }, [stockInventory]);

  // ================= HANDLERS (MEMOIZED) =================
  const handleAuth = useCallback(async () => {
    if (!authEmail || !authPassword) return alert("Enter email and password");

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword
    });

    if (error) alert(error.message);
  }, [authEmail, authPassword]);

  const handleFormChange = useCallback((key, value) => {
    setForm(prev => {
      let updatedValue = value;

      if (typeof value === "string" && key !== "type") {
        updatedValue = capitalizeWords(value.trimStart());
      }

      return { ...prev, [key]: updatedValue };
    });
  }, []);

  // ================= FORM =================
  const [form, setForm] = useState({
    date:"",
    item_name:"",
    brand:"",
    type:"IN",
    quantity:"",
    unit_price:"",
    id:null
  });

  const saveTransaction = useCallback(async () => {
    if (!form.item_name || !form.quantity) return alert("Fill required fields");

    const existingItem = items.find(
      i =>
        i.item_name === form.item_name &&
        i.brand === form.brand &&
        !i.deleted &&
        normalize(i.location) === normalize(selectedStockRoom)
    );

    if (!existingItem) return alert("Item not found");

    const txData = {
      date: form.date,
      created_at: new Date().toISOString(),
      item_id: existingItem.id,
      brand: form.brand,
      type: form.type,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price || existingItem.unit_price || 0),
      location: selectedStockRoom
    };

    if (form.id) {
      const { data } = await supabase
        .from("inventory_transactions")
        .update(txData)
        .eq("id", form.id)
        .select();

      setTransactions(prev =>
        prev.map(t => (t.id === data?.[0]?.id ? data[0] : t))
      );
    } else {
      const { data } = await supabase
        .from("inventory_transactions")
        .insert([txData])
        .select();

      setTransactions(prev => [data[0], ...prev]);
    }
  }, [form, items, selectedStockRoom]);

  // ================= AUTH SCREEN =================
  if (!session) {
    return (
      <div style={{ display: "flex", height: "100vh" }}>
        <div style={{ flex: 1, background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <h1>Lago De Oro</h1>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <h2>Login</h2>
            <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" />
            <button onClick={handleAuth}>Login</button>
          </div>
        </div>
      </div>
    );
  }

  // ================= MAIN UI =================
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: 220, background: "#111827", color: "#fff" }}>
        <h3>Stock Rooms</h3>
        <select onChange={e => setSelectedStockRoom(e.target.value)}>
          <option value="">All</option>
          {stockRooms.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, padding: 20 }}>
        <h2>Inventory Value: {formatNumber(totalInventoryValue)}</h2>
      </div>
    </div>
  );
}
  // ================= MAIN APP =================
  return (
    <div style={styles.container}>

      {/* NOTIFICATION */}
      {notification && (
        <div style={styles.notification}>
          ⚠ {notification}
        </div>
      )}
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
              onChange={e => {
                  const room = e.target.value;
                  setSelectedStockRoom(room === "" ? "" : room);
                }}
            >
              <option value="">Select Stock Room</option>
              {stockRooms
                .filter(r => userRooms.includes(r))
                .map(r => <option key={r} value={r}>{r}</option>)}
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
                onClick={async () => { 
              await supabase.auth.signOut();
                setSelectedStockRoom("");
                setSession(null);
                }}
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

          {!selectedStockRoom ? (
            <div style={styles.welcomeScreen}>
          
              <div style={styles.welcomeContainer}>
          
                <img
                  src="/logo.jpg"
                  alt="Lago de Oro"
                  style={styles.welcomeLogo}
                />
          
                <h1 style={styles.welcomeTitle}>
                  LAGO DE ORO NORTHERN LIGHTS AGRI-AQUATIC
                  <br/>
                  AND RESORTS DEVELOPMENT INC.
                  <br/>
                  INVENTORY SYSTEM
                </h1>
          
                <div style={styles.welcomeDivider}></div>
          
                <p style={styles.welcomeSubtitle}>
                  Inventory Management Portal
                </p>
          
                <p style={styles.welcomeInstruction}>
                  Please select a Stock Room from the left panel to begin
                </p>
          
              </div>
          
            </div>
          
          ) : (
          
          <>
            {selectedStockRoom && (
            <div style={styles.stockRoomHeader}>
              Stock Room: {selectedStockRoom}
            </div>
          )}
      
  {/* STOCK INVENTORY TAB WITH SEARCH */}
{activeTab === "stock" && (
  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
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
        overflowY: "auto",
        scrollBehavior: "smooth"
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
        <div style={styles.dashboardValue}>{formatNumber(totalItems)}</div>
        </div>
        
        <div style={styles.dashboardCard}>
        <div style={styles.dashboardTitle}>Low Stock Items</div>
        <div style={styles.dashboardValue}>{formatNumber(lowStockItems)}</div>
        </div>
        
        <div style={styles.dashboardCard}>
        <div style={styles.dashboardTitle}>Categories</div>
        <div style={styles.dashboardValue}>{formatNumber(totalCategories)}</div>
        </div>
        
        </div>
      <div
        style={{
          maxHeight: "400px",   // 🔥 controls table height
          overflowY: "auto",
          overflowX: "hidden",
          border: "1px solid #e5e7eb",
          borderRadius: 8
        }}
      >
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
                      
                      <span>
                          {category}
                        
                          {(() => {
                            const lowStockCount = items.filter(i => i.stock <= 5).length;
                        
                            if (lowStockCount === 0) return null;
                        
                            return (
                              <span
                                style={{
                                  marginLeft:8,
                                  background:"#fee2e2",
                                  color:"#b91c1c",
                                  fontSize:11,
                                  padding:"2px 6px",
                                  borderRadius:6,
                                  fontWeight:600
                                }}
                              >
                                ⚠ {lowStockCount} Low Stock
                              </span>
                            );
                          })()}
                        </span>
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
                        <td style={styles.thtd}>{formatNumber(i.stock)}</td>
                        <td style={styles.thtd}>{capitalizeWords(i.item_name)}</td>
                        <td style={styles.thtd}>{displayBrand(i.brand)}</td>
                        <td style={styles.thtd}>₱{Number(i.unit_price || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                        <td style={styles.thtd}>₱{Number(i.stock * Number(i.unit_price || 0)).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                        <td style={{ ...styles.thtd, position:"relative" }}>

                        <div
                            className="action-menu"
                            ref={(el) => (menuRefs.current["stock-" + i.id] = el)}
                          >
                        
                        <button
                          onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === "stock-"+i.id ? null : "stock-"+i.id);
                            }}
                          style={{
                            background:"none",
                            border:"none",
                            fontSize:20,
                            cursor:"pointer"
                          }}
                        >
                        ⋮
                        </button>
                        
                        {openMenuId === "stock-"+i.id && (
                        <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position:"absolute",
                        right:0,
                        top:30,
                        background:"#fff",
                        border:"1px solid #e5e7eb",
                        borderRadius:8,
                        boxShadow:"0 4px 12px rgba(0,0,0,0.1)",
                        zIndex:10,
                        minWidth:120,
                        display:"flex",
                        flexDirection:"column"
                        }}>
                        
                        <button
                        style={menuItemStyle}
                        onClick={()=>{
                        setForm({
                          id: i.id,
                          item_name: i.item_name || "",
                          brand: i.brand || "",
                          category: i.category || "",
                          unit_price: i.unit_price || "",
                          brandOptions:[i.brand],
                        });
                        setModalType("item");
                        setShowModal(true);
                        setOpenMenuId(null);
                        }}
                        >
                        Edit
                        </button>
                        
                        <button
                        style={{...menuItemStyle,color:"#ef4444"}}
                        onClick={()=>{
                        setConfirmAction({ type:"deleteItem", data:i });
                        setOpenMenuId(null);
                        }}
                        >
                        Delete
                        </button>
                        
                        </div>
                        )}
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
  </div>
)}

{/* TRANSACTIONS TAB */}
  {activeTab === "transactions" && (
    <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        width: "100%",
        alignItems: "stretch"
    }}>
    {/* ================= IN TRANSACTIONS ================= */}
     <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "520px"
      }}>
      <h2>IN Transactions</h2>
      <input
        style={{ ...styles.input, marginBottom: 10 }}
        placeholder="Search IN transactions..."
        value={inSearch}
        onChange={(e) => setInSearch(e.target.value)}
      />
      <div style={{
          flex: 1,
          overflowY: "auto",
          marginTop: 10
        }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
            <tr>
              <th style={{width:"90px"}}>Date</th>
              <th style={{width:"160px"}}>Item</th>
              <th style={{width:"90px"}}>Brand</th>
              <th style={{width:"60px"}}>Qty</th>
              <th style={{width:"100px"}}>Total Price</th>
              <th style={{ width: "120px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
              {(() => {
                const filteredIn = inTransactions
                  .filter(item =>
                    (item.items?.item_name || "").toLowerCase().includes(inSearch.toLowerCase()) ||
                    (item.items?.brand || "").toLowerCase().includes(inSearch.toLowerCase())
                  )
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
                if (filteredIn.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>
                        No transactions found
                      </td>
                    </tr>
                  );
                }
            
                return filteredIn.map((i) => (
                  <tr key={i.id}>
                    <td>{i.date}</td>
                    <td style={{maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                      {capitalizeWords(i.items?.item_name)}
                    </td>
                    <td>{displayBrand(i.items?.brand)}</td>
                    <td>{formatNumber(i.quantity)}</td>
                    <td>₱{Number(i.quantity * (i.unit_price || i.items?.unit_price || 0)).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
            
                    <td style={{ padding:"12px 10px", position:"relative", textAlign:"center" }}>

                      <div className="action-menu"
                        ref={(el) => (menuRefs.current["in-" + i.id] = el)}
                      >
                      <button
                      onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === "in-"+i.id ? null : "in-"+i.id);
                        }}
                      style={{
                      background:"none",
                      border:"none",
                      fontSize:20,
                      cursor:"pointer"
                      }}
                      >
                      ⋮
                      </button>
                      
                      {openMenuId === "in-"+i.id && (
                      <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position:"absolute",
                      right:0,
                      top:28,
                      background:"#fff",
                      border:"1px solid #e5e7eb",
                      borderRadius:8,
                      boxShadow:"0 4px 12px rgba(0,0,0,0.1)",
                      zIndex:50,
                      minWidth:120,
                      display:"flex",
                      flexDirection:"column"
                      }}>
                      
                      <button
                      style={menuItemStyle}
                      onClick={()=>{
                      setForm({
                      id:i.id,
                      item_id:i.item_id,
                      date:i.date,
                      item_name:i.items?.item_name,
                      brand:i.items?.brand,
                      type:i.type,
                      quantity:i.quantity,
                      unit_price:i.unit_price || i.items?.unit_price,
                      brandOptions:[i.items?.brand],
                      });
                      setModalType("transaction");
                      setShowModal(true);
                      setOpenMenuId(null);
                      }}
                      >
                      Edit
                      </button>
                      
                      <button
                      style={{...menuItemStyle,color:"#ef4444"}}
                      onClick={()=>{
                      setConfirmAction({ type:"deleteTx", data:i });
                      setOpenMenuId(null);
                      }}
                      >
                      Delete
                      </button>
                      
                      </div>
                      )}
                      </div>
                      </td>
                  </tr>
                ));
              })()}
            </tbody>
        </table>
      </div>
    </div>

    {/* ================= OUT TRANSACTIONS ================= */}
   <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "520px"
      }}>
      <h2>OUT Transactions</h2>
      <input
        style={{ ...styles.input, marginBottom: 10 }}
        placeholder="Search OUT transactions..."
        value={outSearch}
        onChange={(e) => setOutSearch(e.target.value)}
      />
      <div style={{
          flex: 1,
          overflowY: "auto",
          marginTop: 10
        }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "#f3f4f6", zIndex: 1 }}>
             <tr>
              <th style={{width:"90px"}}>Date</th>
              <th style={{width:"160px"}}>Item</th>
              <th style={{width:"90px"}}>Brand</th>
              <th style={{width:"60px"}}>Qty</th>
              <th style={{width:"100px"}}>Total Price</th>
              <th style={{ width: "120px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filteredOut = outTransactions
                .filter(item =>
                  (item.items?.item_name || "").toLowerCase().includes(outSearch.toLowerCase()) ||
                  (item.items?.brand || "").toLowerCase().includes(outSearch.toLowerCase())
                )
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
              if (filteredOut.length === 0) {
                return (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>
                      No transactions found
                    </td>
                  </tr>
                );
              }
          
              return filteredOut.map((i) => (
                <tr key={i.id}>
                  <td>{i.date}</td>
                  <td style={{maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                    {capitalizeWords(i.items?.item_name)}
                  </td>
                  <td>{displayBrand(i.items?.brand)}</td>
                  <td>{formatNumber(i.quantity)}</td>
                  <td>₱{Number(i.quantity * (i.unit_price || i.items?.unit_price || 0)).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
          
                  <td style={{ padding:"12px 10px", position:"relative", textAlign:"center" }}>

                  <div className="action-menu"
                    ref={(el) => (menuRefs.current["out-" + i.id] = el)}
                    >
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === "out-"+i.id ? null : "out-"+i.id);
                    }}
                    style={{
                    background:"none",
                    border:"none",
                    fontSize:20,
                    cursor:"pointer"
                    }}
                    >
                    ⋮
                    </button>
                    
                    {openMenuId === "out-"+i.id && (
                    <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position:"absolute",
                    right:0,
                    top:28,
                    background:"#fff",
                    border:"1px solid #e5e7eb",
                    borderRadius:8,
                    boxShadow:"0 4px 12px rgba(0,0,0,0.1)",
                    zIndex:50,
                    minWidth:120,
                    display:"flex",
                    flexDirection:"column"
                    }}>
                    
                    <button
                    style={menuItemStyle}
                    onClick={()=>{
                    setForm({
                    id:i.id,
                    item_id:i.item_id,
                    date:i.date,
                    item_name:i.items?.item_name,
                    brand:i.items?.brand,
                    type:i.type,
                    quantity:i.quantity,
                    unit_price:i.unit_price || i.items?.unit_price,
                    brandOptions:[i.items?.brand],
                    });
                    setModalType("transaction");
                    setShowModal(true);
                    setOpenMenuId(null);
                    }}
                    >
                    Edit
                    </button>
                    
                    <button
                    style={{...menuItemStyle,color:"#ef4444"}}
                    onClick={()=>{
                    setConfirmAction({ type:"deleteTx", data:i });
                    setOpenMenuId(null);
                    }}
                    >
                    Delete
                    </button>
                    
                    </div>
                    )}
                    </div>

                    </td>
                </tr>
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
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                    width: "100%",
                    maxWidth: "100%",
                    overflow: "hidden"
                  }}>  
                {/* ================= DELETED INVENTORY ================= */}
                <div style={{
                  background: "#fff",
                  padding: 20,
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  height: "520px",
                }}>
                <h2>Deleted Inventory</h2>
                
                <input
                  style={{ ...styles.input, marginBottom: 10 }}
                  placeholder="Search deleted items..."
                  value={deletedItemSearch}
                  onChange={(e) => setDeletedItemSearch(e.target.value)}
                />
                
                <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
                
                <table style={{
                  width:"100%",
                  borderCollapse:"collapse"
                }}>
                
                <thead style={{ position:"sticky", top:0, background:"#f3f4f6", zIndex:1 }}>
                <tr>
                
                <th style={{
                minWidth:"160px",
                padding:"12px 10px",
                textAlign:"left",
                fontWeight:600,
                borderBottom:"1px solid #e5e7eb"
                }}>
                Item Name
                </th>
                
                <th style={{
                minWidth:"120px",
                padding:"12px 10px",
                textAlign:"left",
                fontWeight:600,
                borderBottom:"1px solid #e5e7eb"
                }}>
                Brand
                </th>
                
                <th style={{
                minWidth:"100px",
                padding:"12px 10px",
                textAlign:"left",
                fontWeight:600,
                borderBottom:"1px solid #e5e7eb"
                }}>
                Price
                </th>
                
                <th style={{
                minWidth:"80px",
                padding:"12px 10px",
                textAlign:"center",
                fontWeight:600,
                borderBottom:"1px solid #e5e7eb"
                }}>
                Actions
                </th>
                
                </tr>
                </thead>
                
                <tbody>
                {(() => {
                
                const filteredDeleted = deletedItems
                  .filter(
                    (item) =>
                      (item.item_name || "").toLowerCase().includes(deletedItemSearch.toLowerCase()) ||
                      (item.brand || "").toLowerCase().includes(deletedItemSearch.toLowerCase())
                  )
                  .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
                
                if (filteredDeleted.length === 0) {
                return (
                <tr>
                <td colSpan={4} style={{ padding:16,textAlign:"center",color:"#9ca3af" }}>
                No deleted items
                </td>
                </tr>
                );
                }
                
                return filteredDeleted.map((i) => (
                <tr key={i.id}>
                
                <td style={{
                  padding:"12px 10px",
                  borderBottom:"1px solid #f1f5f9",
                  maxWidth:160,
                  overflow:"hidden",
                  textOverflow:"ellipsis",
                  whiteSpace:"nowrap"
                }}>
                {capitalizeWords(i.item_name)}
                </td>
                
                <td style={{
                  padding:"12px 10px",
                  borderBottom:"1px solid #f1f5f9",
                  maxWidth:160,
                  overflow:"hidden",
                  textOverflow:"ellipsis",
                  whiteSpace:"nowrap"
                }}>
                {capitalizeWords(i.brand)}
                </td>
                
                <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                ₱{Number(i.unit_price || 0).toLocaleString(undefined,{minimumFractionDigits:2})}
                </td>
                
                <td style={{
                padding:"12px 10px",
                borderBottom:"1px solid #f1f5f9",
                position:"relative",
                textAlign:"center"
                }}>
                  <div className="action-menu"
                    ref={(el) => (menuRefs.current["delitem-" + i.id] = el)}
                    >
                  <button
                  onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === "delitem-"+i.id ? null : "delitem-"+i.id);
                    }}
                  style={{
                  background:"none",
                  border:"none",
                  fontSize:20,
                  cursor:"pointer",
                  padding:"4px 8px",
                  borderRadius:6
                  }}
                  >
                  ⋮
                  </button>
                  
                  {openMenuId === "delitem-"+i.id && (
                  <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position:"absolute",
                  right:0,
                  top:30,
                  background:"#fff",
                  border:"1px solid #e5e7eb",
                  borderRadius:8,
                  boxShadow:"0 4px 12px rgba(0,0,0,0.1)",
                  zIndex:10,
                  minWidth:120,
                  display:"flex",
                  flexDirection:"column"
                  }}>
                  
                  <button
                  style={menuItemStyle}
                  onClick={()=>{
                  setConfirmAction({ type:"restoreItem", data:i });
                  setOpenMenuId(null);
                  }}
                  >
                  Restore
                  </button>
                  
                  <button
                  style={{...menuItemStyle,color:"#ef4444"}}
                  onClick={()=>{
                  setConfirmAction({ type:"permanentDeleteItem", data:i });
                  setOpenMenuId(null);
                  }}
                  >
                  Delete
                  </button>
                  
                  </div>
                  )}
                  </div>

                  </td>
                
                </tr>
                ));
                })()}
                </tbody>
                
                </table>
                </div>
                </div>
                
                
                {/* ================= DELETED TRANSACTIONS ================= */}
                <div style={{
                background: "#fff",
                padding: 20,
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                height: "520px",
                }}>
                
                <h2>Deleted Transactions</h2>
                
                <input
                style={{ ...styles.input, marginBottom: 10 }}
                placeholder="Search deleted transactions..."
                value={deletedTxSearch}
                onChange={(e) => setDeletedTxSearch(e.target.value)}
                />
                
                <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
                
                <table style={{
                  width:"100%",
                  borderCollapse:"collapse"
                }}>
                
                <thead style={{ position:"sticky", top:0, background:"#f3f4f6", zIndex:1 }}>
                <tr>
                <th style={{width:"90px"}}>Date</th>
                <th style={{width:"160px"}}>Item</th>
                <th style={{width:"90px"}}>Brand</th>
                <th style={{width:"80px"}}>Type</th>
                <th style={{width:"70px"}}>Qty</th>
                <th style={{width:"120px"}}>Total Price</th>
                <th style={{width:"80px", textAlign:"center"}}>Actions</th>
                </tr>
                </thead>
                
                <tbody>
                {(() => {
                
                const filteredDeletedTx = deletedTransactions
                  .filter(
                    (t) =>
                      (t.items?.item_name || "").toLowerCase().includes(deletedTxSearch.toLowerCase()) ||
                      (t.items?.brand || "").toLowerCase().includes(deletedTxSearch.toLowerCase())
                  )
                  .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
                
                if (filteredDeletedTx.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} style={{ padding:16,textAlign:"center",color:"#9ca3af" }}>
                        No deleted transactions
                      </td>
                    </tr>
                  );
                }
                
                return filteredDeletedTx.map((i) => (
                <tr key={i.id}>
                
                <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                {i.date}
                </td>
                
                <td style={{
                  padding:"12px 10px",
                  borderBottom:"1px solid #f1f5f9",
                  maxWidth:160,
                  overflow:"hidden",
                  textOverflow:"ellipsis",
                  whiteSpace:"nowrap"
                }}>
                {capitalizeWords(i.items?.item_name)}
                </td>
                
               <td style={{
                  padding:"12px 10px",
                  borderBottom:"1px solid #f1f5f9",
                  maxWidth:160,
                  overflow:"hidden",
                  textOverflow:"ellipsis",
                  whiteSpace:"nowrap"
                }}>
                {displayBrand(i.items?.brand)}
                </td>
                
                <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                {i.type}
                </td>
                
                <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                {formatNumber(i.quantity)}
                </td>
                
                <td style={{ padding:"12px 10px", borderBottom:"1px solid #f1f5f9" }}>
                ₱{Number(i.quantity * (i.unit_price || i.items?.unit_price || 0)).toLocaleString(undefined,{minimumFractionDigits:2})}
                </td>
                
                <td style={{
                  padding:"12px 10px",
                  borderBottom:"1px solid #f1f5f9",
                  position:"relative",
                  textAlign:"center"
                  }}>
                  <div className="action-menu"
                    ref={(el) => (menuRefs.current["deltx-" + i.id] = el)}
                  >
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === "deltx-"+i.id ? null : "deltx-"+i.id);
                  }}
                  style={{
                  background:"none",
                  border:"none",
                  fontSize:20,
                  cursor:"pointer",
                  padding:"4px 8px",
                  borderRadius:6
                  }}
                  >
                  ⋮
                  </button>
                  
                  {openMenuId === "deltx-"+i.id && (
                  <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position:"absolute",
                  right:0,
                  top:30,
                  background:"#fff",
                  border:"1px solid #e5e7eb",
                  borderRadius:8,
                  boxShadow:"0 4px 12px rgba(0,0,0,0.1)",
                  zIndex:10,
                  minWidth:120,
                  display:"flex",
                  flexDirection:"column"
                  }}>
                  
                  <button
                  style={menuItemStyle}
                  onClick={()=>{
                  setConfirmAction({ type:"restoreTx", data:i });
                  setOpenMenuId(null);
                  }}
                  >
                  Restore
                  </button>
                  
                  <button
                  style={{...menuItemStyle,color:"#ef4444"}}
                  onClick={()=>{
                  setConfirmAction({ type:"permanentDeleteTx", data:i });
                  setOpenMenuId(null);
                  }}
                  >
                  Delete
                  </button>
                  
                  </div>
                  )}
                  </div>

                  </td>
                
                </tr>
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
  <div style={{ flex: 1, overflowY: "auto" }}>
    <div id="reportSection">
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
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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

          <button
            style={styles.buttonPrimary}
            onClick={() => window.print()}
          >
            🖨 Print Report
          </button>

          <button
            style={{ ...styles.buttonPrimary, background: "#16a34a" }}
            onClick={exportMonthlyReport}
          >
            📊 Export Excel
          </button>
        </div>

        {/* KPI SUMMARY */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16
        }}>
          <div style={{ ...styles.card, borderLeft: "6px solid #10b981" }}>
            <h4>Total IN</h4>
            <p>{formatNumber(monthlySummary?.totalInQty || 0)} units</p>
            <strong>
              ₱{Number(monthlySummary?.totalInValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div style={{ ...styles.card, borderLeft: "6px solid #ef4444" }}>
            <h4>Total OUT</h4>
            <p>{formatNumber(monthlySummary?.totalOutQty || 0)} units</p>
            <strong>
              ₱{Number(monthlySummary?.totalOutValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div style={{
            ...styles.card,
            background: netValue >= 0 ? "#ecfdf5" : "#fef2f2",
            borderLeft: `6px solid ${netValue >= 0 ? "#10b981" : "#ef4444"}`
          }}>
            <h4>Net Movement</h4>
            <strong style={{ fontSize: 18 }}>
              ₱{Number(netValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              {monthlyTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>
                    No transactions for this month
                  </td>
                </tr>
              ) : (
                Object.values(
                  monthlyTransactions.reduce((acc, t) => {
                    const key = `${t.items?.item_name}-${t.items?.brand}`;
                    const price = Number(t.unit_price || t.items?.unit_price || 0);
                    const qty = Number(t.quantity || 0);
                    const value = qty * price;

                    if (!acc[key]) {
                      acc[key] = { item: t.items?.item_name, brand: t.items?.brand, inQty: 0, outQty: 0, inValue: 0, outValue: 0 };
                    }

                    if (t.type === "IN") {
                      acc[key].inQty += qty;
                      acc[key].inValue += value;
                    } else {
                      acc[key].outQty += qty;
                      acc[key].outValue += value;
                    }

                    return acc;
                  }, {})
                ).map((row, idx) => {
                  const netQty = row.inQty - row.outQty;
                  const netValue = row.inValue - row.outValue;
                  return (
                    <tr key={idx}>
                      <td style={styles.thtd}>{capitalizeWords(row.item)}</td>
                      <td style={styles.thtd}>{displayBrand(row.brand)}</td>
                      <td style={styles.thtd}>{formatNumber(row.inQty)}</td>
                      <td style={styles.thtd}>{formatNumber(row.outQty)}</td>
                      <td style={styles.thtd}>{formatNumber(netQty)}</td>
                      <td style={styles.thtd}>
                        ₱{Number(netValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
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
                : monthlyTransactions
                  .filter(t => !selectedStockRoom || t.items?.location === selectedStockRoom)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(t => (
                      <tr key={t.id}>
                        <td style={styles.thtd}>{t.date}</td>
                        <td style={styles.thtd}>{capitalizeWords(t.items?.item_name)}</td>
                        <td style={styles.thtd}>{displayBrand(t.items?.brand)}</td>
                        <td style={styles.thtd}>{t.type}</td>
                        <td style={styles.thtd}>{formatNumber(t.quantity)}</td>
                        <td style={styles.thtd}>
                          ₱{Number((t.quantity || 0) * (t.unit_price || t.items?.unit_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>

      </div> 
    </div> 
  </div> 
)}

               {/* ================= MODAL ================= */}
        {showModal && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <Draggable handle=".modalHeader" bounds="parent">
              <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              {/* NEW OPTION MODAL */}
              {modalType === "newOption" && (
                <>
                  <div className="modalHeader" style={{ cursor: "move", marginBottom: 10 }}>
                    <h3>What do you want to add?</h3>
                  </div>
                  <button style={{ ...styles.newOptionButton, background:"#1f2937", color:"#fff" }} onClick={openNewItemModal}>Add New Item</button>
                  <button style={{ ...styles.newOptionButton, background:"#e5e7eb", color:"#374151" }} onClick={openNewTransactionModal}>Add New Transaction</button>
                  <button style={styles.buttonSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                </>
              )}

              {/* ADD ITEM MODAL */}
              {modalType === "item" && (
                <>
                  <div className="modalHeader" style={{ cursor: "move", marginBottom: 10 }}>
                    <h3>{form.id ? "Edit Item" : "New Item"}</h3>
                  </div>
                    <div style={{ position: "relative" }}>
                      <input
                        style={styles.input}
                        placeholder="Item Name"
                        value={form.item_name}
                        onChange={e => {
                          const value = e.target.value;
                          handleFormChange("item_name", value);
                    
                          const matches = items
                            .filter(i =>
                              i.location === selectedStockRoom &&
                              !i.deleted &&
                              i.item_name.toLowerCase().includes(value.toLowerCase())
                            )
                            .map(i => i.item_name);
                    
                          setItemOptions([...new Set(matches)]);
                        }}
                        onFocus={() => {
                          const allItems = items
                            .filter(i => i.location === selectedStockRoom && !i.deleted)
                            .map(i => i.item_name);
                    
                          setItemOptions([...new Set(allItems)]);
                        }}
                        onBlur={() => {
                          setTimeout(() => setItemOptions([]), 150);
                        }}
                      />
                    
                      {/* FLOATING SELECTOR */}
                      {itemOptions.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            border: "1px solid #d1d5db",
                            borderRadius: 10,
                            marginTop: 4,
                            background: "#ffffff",
                            boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                            maxHeight: 160,
                            overflowY: "auto",
                            zIndex: 1000
                          }}
                        >
                          {itemOptions.map((name, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "10px 14px",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 500,
                                color: "#374151",
                                borderBottom:
                                  idx !== itemOptions.length - 1
                                    ? "1px solid #f3f4f6"
                                    : "none"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#eef2ff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#ffffff";
                              }}
                              onClick={() => {
                                handleFormChange("item_name", name);
                                setItemOptions([]);
                              }}
                            >
                              {capitalizeWords(name)}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                  <div style={{ position: "relative" }}>
                    {/* BRAND INPUT */}
                    <input
                      style={styles.input}
                      placeholder="Brand"
                      value={form.brand}
                      onChange={e => {
                        const value = e.target.value;
                        handleFormChange("brand", value);
                  
                        const matches = items
                          .filter(i =>
                            i.location === selectedStockRoom &&
                            !i.deleted &&
                            i.item_name === form.item_name &&
                            i.brand &&
                            i.brand.toLowerCase().includes(value.toLowerCase())
                          )
                          .map(i => i.brand);
                  
                        setBrandOptions([...new Set(matches)]);
                      }}
                      onFocus={() => {
                        const allBrands = items
                          .filter(i =>
                            i.location === selectedStockRoom &&
                            !i.deleted &&
                            i.item_name === form.item_name
                          )
                          .map(i => i.brand);
                  
                        setBrandOptions([...new Set(allBrands)]);
                      }}
                      onBlur={() => setTimeout(() => setBrandOptions([]), 150)}
                    />
                  
                    {/* BRAND DROPDOWN */}
                    {brandOptions.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          border: "1px solid #d1d5db",
                          borderRadius: 10,
                          marginTop: 4,
                          background: "#ffffff",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                          maxHeight: 160,
                          overflowY: "auto",
                          zIndex: 1000
                        }}
                      >
                        {brandOptions.map((b, idx) => (
                          <div
                            key={idx}
                            style={styles.dropdownItem}
                            onClick={() => {
                              handleFormChange("brand", b);
                              setBrandOptions([]);
                            }}
                          >
                            {capitalizeWords(b)}
                          </div>
                        ))}
                      </div>
                    )}
                  
                  </div>

                  <div style={{ position: "relative" }}>
                    <input
                      style={styles.input}
                      placeholder="Category"
                      value={form.category || ""}
                      onChange={e => {
                        const value = e.target.value;
                        handleFormChange("category", value);
                    
                        const matches = items
                          .filter(i =>
                            i.location === selectedStockRoom &&
                            !i.deleted &&
                            i.category &&
                            i.category.toLowerCase().includes(value.toLowerCase())
                          )
                          .map(i => i.category);
                    
                        setCategoryOptions([...new Set(matches)]);
                      }}
                      onFocus={() => {
                        const allCategories = items
                          .filter(i => i.location === selectedStockRoom && !i.deleted)
                          .map(i => i.category)
                          .filter(Boolean);
                    
                        setCategoryOptions([...new Set(allCategories)]);
                      }}
                      onBlur={() => setTimeout(() => setCategoryOptions([]), 150)}
                    />
                    
                    {categoryOptions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        marginTop: 4,
                        background: "#ffffff",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                        maxHeight: 160,
                        overflowY: "auto",
                        zIndex: 1000
                      }}
                    >
                        {categoryOptions.map((cat, idx) => (
                          <div
                            key={idx}
                            style={styles.dropdownItem}
                            onClick={() => {
                              handleFormChange("category", cat);
                              setCategoryOptions([]);
                            }}
                          >
                            {capitalizeWords(cat)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    </div>
                                    
                  <input 
                    style={styles.input}
                    type="number"
                    placeholder="Price"
                    value={form.unit_price}
                    onChange={e => handleFormChange("unit_price", e.target.value)}
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
                  <div className="modalHeader" style={{ cursor: "move", marginBottom: 10 }}>
                    <h3>{form.id ? "Edit Transaction" : "New Transaction"}</h3>
                  </div>

                  <input style={styles.input} type="date" value={form.date} onChange={e => handleFormChange("date", e.target.value)} />

                  <select
                      style={styles.input}
                      value={form.item_name}
                      onChange={e => {
                        const newItem = e.target.value;
                    
                        setForm(prev => ({
                          ...prev,
                          item_name: newItem,
                          brand: "",
                          item_id: null
                        }));
                      }}
                    >
                <option value="">Select Item</option>
                {[
                  ...new Set(
                    items
                      .filter(i => i.location === selectedStockRoom && !i.deleted)
                      .map(i => i.item_name)
                  )
                ].map(itemName => (
                  <option key={itemName} value={itemName}>
                    {capitalizeWords(itemName)}
                  </option>
                ))}
              </select>

                  {/* 🔹 BRAND SELECTOR (Stock-Room Aware) */}
                  <select
                      style={styles.input}
                      value={form.brand}
                      onChange={e => {
                        const selectedBrand = e.target.value;
                    
                        const selectedItem = items.find(
                          i =>
                            i.item_name === form.item_name &&
                            i.brand === selectedBrand &&
                            i.location === selectedStockRoom &&
                            !i.deleted
                        );
                    
                        setForm(prev => ({
                          ...prev,
                          brand: selectedBrand,
                          item_id: selectedItem?.id || null
                        }));
                      }}
                      disabled={!form.item_name}
                    >
                    <option value="">Select Brand</option>
                    {items
                      .filter(i => i.item_name === form.item_name && i.location === selectedStockRoom && !i.deleted)
                      .map(i => i.brand)
                      .filter((brand, index, self) => self.indexOf(brand) === index) // unique brands
                      .map(brand => (
                        <option key={brand} value={brand}>
                          {capitalizeWords(brand)}
                        </option>
                      ))}
                  </select>

                 <div style={styles.toggleGroup}>

                    <button
                      type="button"
                      style={styles.toggleButton(form.type === "IN", "IN")}
                      onClick={() => handleFormChange("type","IN")}
                    >
                      IN
                    </button>
                  
                    <button
                      type="button"
                      style={styles.toggleButton(form.type === "OUT", "OUT")}
                      onClick={() => handleFormChange("type","OUT")}
                    >
                      OUT
                    </button>
                  
                  </div>

                  <input
                      style={styles.input}
                      type="number"
                      min="1"
                      placeholder="Quantity"
                      value={form.quantity}
                      onChange={e => handleFormChange("quantity", e.target.value)}
                    />
                  <input style={styles.input} type="number" placeholder="Price per unit" value={form.unit_price} onChange={e => handleFormChange("unit_price", e.target.value)} />

                  <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                    <button style={styles.buttonPrimary} onClick={handleSubmit}>{form.id ? "Save Changes" : "Submit"}</button>
                    <button style={styles.buttonSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </>
              )}

            </div>
          </Draggable>
        </div>
       )}

        {/* ================= CONFIRM MODAL ================= */}
{confirmAction && (
  <div style={styles.modalOverlay}>

   <Draggable handle=".modalHeader" bounds="parent">
      <div style={styles.modalCard}>
    
      <div className="modalHeader" style={{ cursor: "move", marginBottom: 10 }}>
        <h3>Confirm Action</h3>
      </div>
    
      <p>
        Are you sure you want to{" "}
        <b>
          {confirmAction.type === "deleteItem" && `delete item "${confirmAction?.data?.item_name}"?`}
          {confirmAction.type === "restoreItem" && "restore this item?"}
          {confirmAction.type === "permanentDeleteItem" && `permanently delete item "${confirmAction?.data?.item_name}"?`}
          {confirmAction.type === "deleteTx" && `delete transaction on "${confirmAction?.data?.date}"?`}
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
                await supabase.from("items").update({ 
                  deleted: true,
                  deleted_at: new Date().toISOString() // ✅ add this
                }).eq("id", data.id);
              
                await supabase.from("inventory_transactions").update({ 
                  deleted: true,
                  deleted_at: new Date().toISOString() // optional but consistent
                }).eq("item_id", data.id);
              }

              else if (type === "restoreItem") {
                await supabase.from("items").update({ 
                  deleted: false,
                  deleted_at: null
                }).eq("id", data.id);
              
                await supabase.from("inventory_transactions").update({ 
                  deleted: false,
                  deleted_at: null
                }).eq("item_id", data.id);
              }

              else if (type === "permanentDeleteItem") {
                await supabase.from("inventory_transactions").delete().eq("item_id", data.id);
                await supabase.from("items").delete().eq("id", data.id);
              }

             else if (type === "deleteTx") {
                const result = await supabase
                  .from("inventory_transactions")
                  .update({ 
                    deleted: true,
                    deleted_at: new Date().toISOString() // ✅ add this
                  })
                  .eq("id", data.id);
              
                if (result.error) throw result.error;
              }

              else if (type === "restoreTx") {
                  const result = await supabase
                    .from("inventory_transactions")
                    .update({ 
                      deleted: false,
                      deleted_at: null
                    })
                    .eq("id", data.id);
                
                  if (result.error) throw result.error;
                }

              else if (type === "permanentDeleteTx") {
                const result = await supabase
                  .from("inventory_transactions")
                  .delete()
                  .eq("id", data.id);
              
                if (result.error) throw result.error;
              }

              await loadData();

            } catch (error) {
              console.error(error);
              alert(error.message);
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
   </Draggable>
 </div>
)}
    
          <style>
          {`
          @media print {
          
            body * {
              visibility: hidden;
            }
          
            #reportSection, #reportSection * {
              visibility: visible;
            }
          
            #reportSection {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          
          }
          `}
         </style>

      </>
      )}
    </div>
  </div>
    );
    }
