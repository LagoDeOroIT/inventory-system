import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import Draggable from "react-draggable";
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
  welcomeCard: {
    background: "#ffffff",
    padding: "60px 80px",
    borderRadius: 12,
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    maxWidth: 700
  },
  dropdown: {
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
  },
  dropdownItem: {
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
    borderBottom: "1px solid #f3f4f6"
  },
  welcomeInstruction: {
    fontSize: 14,
    color: "#888",
    marginTop: 10
  },
  stockRoomHeader: {
    background: "#f3f4f6",
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 16,
    fontWeight: 600,
    fontSize: 15
  },
  welcomeScreen: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%"
  },
  welcomeContainer:{
    background:"#ffffff",
    padding:"70px 90px",
    borderRadius:16,
    textAlign:"center",
    boxShadow:"0 20px 60px rgba(0,0,0,0.12)",
    maxWidth:750
  },
  welcomeDivider:{
    width:120,
    height:4,
    background:"#d97706",
    margin:"20px auto",
    borderRadius:2
  },
  welcomeLogo: {
    width: 220,
    marginBottom: 25
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.4,
    marginBottom: 10
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 5
  },
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
  },
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
    overflowY: "auto",   
    height: "100vh" 
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
  loginPage:{
    display:"flex",
    height:"100vh",
    width:"100%"
  },
  loginLeft:{
    flex:1,
    background:"#111827",
    color:"#fff",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"center",
    padding:"60px"
  },
  loginRight:{
    flex:1,
    background:"#f9fafb",
    display:"flex",
    justifyContent:"center",
    alignItems:"center"
  },
  loginCard:{
    width:380,
    background:"#fff",
    padding:"40px",
    borderRadius:12,
    boxShadow:"0 20px 40px rgba(0,0,0,0.1)"
  },
  loginTitle:{
    fontSize:24,
    fontWeight:700,
    marginBottom:10
  },
  loginSubtitle:{
    fontSize:14,
    color:"#6b7280",
    marginBottom:25
  },
  loginInput:{
    width:"100%",
    padding:12,
    borderRadius:6,
    border:"1px solid #d1d5db",
    marginBottom:14
  },
  loginButton:{
    width:"100%",
    padding:12,
    background:"#111827",
    color:"#fff",
    border:"none",
    borderRadius:6,
    fontWeight:600,
    cursor:"pointer"
  },
  brandTitle:{
    fontSize:36,
    fontWeight:700,
    marginBottom:10
  },
  brandSubtitle:{
    fontSize:16,
    opacity:0.8
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: "#111827" },
  buttonPrimary: { background: "#1f2937", color: "#fff", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
  buttonSecondary: { background: "#e5e7eb", color: "#374151", padding: "10px 16px", borderRadius: 6, border: "none", cursor: "pointer" },
  card: { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16 },
  thtd: { border: "1px solid #e5e7eb", padding: 8, textAlign: "left" },
  emptyRow: { textAlign: "center", padding: 12, color: "#6b7280" },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },
  modalCard: {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    minWidth: 320,
    maxWidth: 400,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    position: "relative",
    zIndex: 10000
  },
  notification: {
    position: "fixed",
    top: 20,
    right: 20,
    background: "#f59e0b",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: 8,
    fontWeight: 500,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 10000,
    animation: "fadeIn 0.3s ease"
  },   
  input: { width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #d1d5db" },
  toggleGroup: { display: "flex", gap: 12, marginBottom: 12 },
  toggleButton: (active, type) => ({
    flex: 1,
    padding: "8px 0",
    borderRadius: 6,
    border: active ? "none" : "1px solid #d1d5db",
    background: active
      ? type === "IN"
        ? "#16a34a"
        : "#dc2626"
      : "#fff",
    color: active ? "#fff" : "#374151",
    cursor: "pointer",
    fontWeight: 600,
  }),
  newOptionButton: { padding: "12px 0", marginBottom: 12, borderRadius: 8, border: "none", width: "100%", cursor: "pointer", fontWeight: 600, fontSize: 16 },
  };
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "";
    return Number(num).toLocaleString();
  };
// ================= APP COMPONENT =================
export default function App() {
  const [session, setSession] = useState(null);
  const [notification, setNotification] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [userRooms, setUserRooms] = useState([]);
  const loadUserProfile = async (userId) => {
    console.log("LOAD PROFILE FOR USER:", userId);
  const { data, error } = await supabase
    .from("profiles")
    .select("stock_rooms, role")
    .eq("id", userId)
    .single();
    console.log("PROFILE RESULT:", data);
  if (error) {
    console.error("Profile error:", error);
    return;
  }
  if (data.role === "admin") {
    setUserRooms(stockRooms);
  } else {
    setUserRooms(data.stock_rooms || []);
  }
  };
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("");
  const [brandOptions, setBrandOptions] = useState([]);
  const [inSearch, setInSearch] = useState("");
  const [outSearch, setOutSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [openCategories, setOpenCategories] = useState({});
    useEffect(() => {
    const savedCategories = localStorage.getItem("openCategories");
      if (savedCategories) {
        setOpenCategories(JSON.parse(savedCategories));
      }
  }, []);
  const toggleCategory = (category) => {
    setOpenCategories(prev => {
      const updated = {
        ...prev,
        [category]: !prev[category]
      };
        localStorage.setItem("openCategories", JSON.stringify(updated));
        return updated;
      });
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
    unit_price:"",
    id:null
  });
  const categories = [
  ...new Set(items.map(i => i.category).filter(Boolean))
    ];
  // ================= DASHBOARD DATA =================
  const [confirmAction, setConfirmAction] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuItemStyle = {
      padding:"8px 12px",
      textAlign:"left",
      background:"none",
      border:"none",
      cursor:"pointer",
      borderBottom:"1px solid #f1f5f9"
    };
  const menuRefs = useRef({});
  useEffect(() => {
  const handleClickOutside = (event) => {

    const isInsideMenu = Object.values(menuRefs.current).some(
      (ref) => ref && ref.contains(event.target)
    );

    if (!isInsideMenu) {
      setOpenMenuId(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);  
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const stockRooms = [
    "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4","L3","L4","L5","L6","L7",
    "Maintenance Bodega 1","Maintenance Bodega 2","Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];
  // ================= AUTH =================
   useEffect(() => {
  
    const initAuth = async () => {
  
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
  
      if (data.session) {
        setSelectedStockRoom("");
        loadUserProfile(data.session.user.id);
      }
  
    };
  
    initAuth();
  
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
  
      setSession(s);
  
      if (s) {
        loadUserProfile(s.user.id);
      }
  
    });
  
    return () => data.subscription.unsubscribe();
  
  }, []);
  
  useEffect(() => {
    if (session) {
      loadUserProfile(session.user.id);   // ← load assigned rooms
      loadData();
    }
  }, [session]);
        const handleAuth = async () => {
      
        if (!authEmail || !authPassword) {
          alert("Enter email and password");
          return;
        }
      
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
      
        if (error) {
          alert(error.message);
        }
      
      };
  // ================= LOAD DATA =================
        const loadData = async () => {
        const { data: itemsData } = await supabase
        .from("items")
        .select("*")
        .order("item_name", { ascending: true });
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
      
        // Category state
        const opened = {};
        itemsWithDeleted.forEach(i => {
          const cat = i.category || "Uncategorized";
          if (!(cat in opened)) opened[cat] = true;
        });
      
        const savedCategories = localStorage.getItem("openCategories");
        if (!savedCategories) setOpenCategories(opened);
      };
  // ================= FILTERS =================
    const filteredTransactions = transactions
      .filter(t => !t.deleted)
      .filter(t => {
        if (!selectedStockRoom) return true;
    
        const txLocation = (t.location || t.items?.location || "")
          .trim()
          .toLowerCase();
    
        const selected = selectedStockRoom
          .trim()
          .toLowerCase();
    
        return txLocation === selected;
      });
    
    const stockMap = filteredTransactions.reduce((acc, t) => {
      const qty = Number(t.quantity) || 0;
    
      if (!acc[t.item_id]) acc[t.item_id] = 0;
    
      acc[t.item_id] += t.type === "IN" ? qty : -qty;
    
      return acc;
    }, {});

  const inTransactions = filteredTransactions.filter(t => t.type === "IN");
  const outTransactions = filteredTransactions.filter(
      t => (t.type || "").toUpperCase() === "OUT"
    );
  const stockInventory = items
        .filter(i => !i.deleted)
        .filter(i => {
         if (!selectedStockRoom) return true;

            const selected = selectedStockRoom.replace(/\s+/g," ").trim().toLowerCase();
            const itemLocation = (i.location || "")
              .replace(/\s+/g," ")
              .trim()
              .toLowerCase();
            
            return itemLocation === selected;
          })
      .map(i => {
   const stock = stockMap[i.id] || 0;
        return {
          id: i.id,
          item_name: i.item_name,
          brand: i.brand,
          category: i.category,
          unit_price: i.unit_price,
          stock: stock,
          location: i.location
        };
      });
    const totalTransactions = filteredTransactions.length;
    const totalCategories = new Set(
      stockInventory.map(i => i.category || "Uncategorized")
    ).size;
    const totalItems = stockInventory.length;
    const totalInventoryValue = stockInventory.reduce(
    (sum, i) => sum + (i.stock * (i.unit_price || 0)),
    0
  );
    const lowStockItems = stockInventory.filter(i => i.stock <= 5).length;
    const deletedItems = items.filter(i => i.deleted).filter(i => !selectedStockRoom || i.location === selectedStockRoom || !i.location);
    const deletedTransactions = transactions.filter(t => t.deleted).filter(t => !selectedStockRoom || t.items?.location === selectedStockRoom);
    const filteredDeletedItems = deletedItems.filter(i =>
    (i.item_name || "").toLowerCase().includes(deletedItemSearch.toLowerCase()) ||
    (i.brand || "").toLowerCase().includes(deletedItemSearch.toLowerCase())
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
    
      const price = Number(t.unit_price || t.items?.unit_price || 0);
      const qty = Number(t.quantity || 0);
      const total = price * qty;
    
      if (t.type === "IN") {
        acc.totalInQty += qty;
        acc.totalInValue += total;
      } else {
        acc.totalOutQty += qty;
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
      (monthlySummary?.totalInValue || 0) -
      (monthlySummary?.totalOutValue || 0);
  // ================= EXPORT EXCEL =================
    const exportMonthlyReport = () => {
      
        if (monthlyTransactions.length === 0) {
          alert("No data to export.");
          return;
        }
      
        const rows = [];
      
        // ================= REPORT HEADER =================
        rows.push(["Lago De Oro Inventory Monthly Report"]);
        rows.push([
          `${new Date(0, reportMonth - 1).toLocaleString("default",{month:"long"})} ${reportYear}`
        ]);
        rows.push([]);
      
        // ================= KPI SUMMARY =================
        rows.push(["SUMMARY"]);
        rows.push(["Total IN Quantity", monthlySummary?.totalInQty || 0]);
        rows.push(["Total IN Value", monthlySummary.totalInValue]);
        rows.push(["Total OUT Quantity", monthlySummary.totalOutQty]);
        rows.push(["Total OUT Value", (monthlySummary?.totalOutValue || 0)]);
        rows.push(["Net Movement Value", netValue]);
        rows.push([]);
      
        // ================= PER ITEM SUMMARY =================
        rows.push(["PER ITEM SUMMARY"]);
        rows.push(["Item","Brand","Total IN","Total OUT","Net Qty","Net Value"]);
      
        const perItem = Object.values(
          monthlyTransactions.reduce((acc,t)=>{
      
            const key = `${t.items?.item_name}-${t.items?.brand}`;
            const price = Number(t.unit_price || t.items?.unit_price || 0);
            const qty = Number(t.quantity || 0);
      
            if(!acc[key]){
              acc[key] = {
                item:t.items?.item_name,
                brand:t.items?.brand,
                inQty:0,
                outQty:0,
                price
              };
            }
      
            if(t.type === "IN") acc[key].inQty += qty;
            else acc[key].outQty += qty;
      
            return acc;
      
          },{})
        );
      
        perItem.forEach(row=>{
          const netQty = row.inQty - row.outQty;
          const value = netQty * row.price;
      
          rows.push([
            row.item,
            row.brand,
            row.inQty,
            row.outQty,
            netQty,
            value
          ]);
        });
      
        rows.push([]);
      
        // ================= DETAILED TRANSACTIONS =================
        rows.push(["DETAILED TRANSACTIONS"]);
        rows.push(["Date","Item","Brand","Type","Qty","Total"]);
      
        monthlyTransactions.forEach(t=>{
      
          const price = Number(t.unit_price || t.items?.unit_price || 0);
      
          rows.push([
            t.date,
            t.items?.item_name,
            t.items?.brand,
            t.type,
            t.quantity,
            t.quantity * price
          ]);
      
        });
      
        // ================= CREATE EXCEL =================
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
      
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
      
        XLSX.writeFile(
          workbook,
          `inventory_report_${reportYear}_${reportMonth}.xlsx`
        );
      };
  // ================= CAPITALIZE WORDS =================
  const displayBrand = (brand) => {
  if (!brand || brand.trim() === "") return "No Brand";
  return capitalizeWords(brand);
  };
  const capitalizeWords = (text) => {
  if (!text) return text;

  return text
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

        // ================= FORM HANDLER =================  
const handleFormChange = (key, value) => {

  // AUTO CAPITALIZE TEXT INPUTS
  if (typeof value === "string" && key !== "type") {
      value = capitalizeWords(value.trimStart());
    }

  // Update brand suggestions when typing item name
  if (key === "item_name") {

    const relatedBrands = items
      .filter(i =>
        i.item_name &&
        i.item_name.toLowerCase().includes(value.toLowerCase()) &&
        !i.deleted
      )
      .map(i => i.brand)
      .filter(Boolean);

    const uniqueBrands = [...new Set(relatedBrands)];

    setBrandOptions(uniqueBrands);
  }

  setForm(prev => {
    const updated = { ...prev, [key]: value };

    // Reset brand when item name changes
    if (key === "item_name") {

      updated.brand = "";

      const exactMatchBrands = items
        .filter(i =>
          i.item_name &&
          i.item_name.toLowerCase() === value.toLowerCase() &&
          !i.deleted
        )
        .map(i => i.brand);

      if (exactMatchBrands.length === 1) {
        updated.brand = exactMatchBrands[0];
      }
    }

    // Auto-fill price when brand is selected
    if (key === "brand") {

      const selectedItem = items.find(
        i =>
          i.item_name &&
          i.item_name.toLowerCase() === prev.item_name?.toLowerCase() &&
          i.brand === value &&
          !i.deleted
      );

      if (selectedItem) {
        updated.price = selectedItem.unit_price;
      }

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
      
        if (!selectedStockRoom) {
          setNotification("Please select a Stock Room first.");
          
          setTimeout(() => {
            setNotification("");
          }, 3000);
      
          return;
        }
      
        setModalType("newOption");
        setShowModal(true);
      };
      const handleSubmit = async () => {

          if (modalType === "item" || modalType === "transaction") {
            await saveTransaction();
          }
    
    };
      // ================= SUBMIT =================
   const saveTransaction = async () => {
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
if (form.type === "OUT") {
  const currentStock = stockMap[existingItem.id] || 0;
  const requestedQty = Number(form.quantity) || 0;

  if (requestedQty > currentStock) {
    alert(`Not enough stock.\n\nAvailable: ${currentStock}`);
    return;
  }
}
      const txData = {
        date: form.date,
        item_id: existingItem.id,
        brand: form.brand || existingItem.brand || "No Brand",
        type: form.type,
        quantity: Number(form.quantity),
        unit_price: Number(form.price || existingItem.unit_price || 0),
        location: form.location || selectedStockRoom  // ✅ add this line
      };
      if(form.id) await supabase.from("inventory_transactions").update(txData).eq("id", form.id);
      else await supabase.from("inventory_transactions").insert([txData]);
      setForm({   date:"",   item_id:"",   item_name:"",   brand:"",   category:"",   type:"IN",   quantity:"",   unit_price:"",   id:null });
      setShowModal(false);
      setModalType("");
      loadData();
    } else if(modalType === "item") {
      if(!form.item_name || !form.unit_price) return alert("Fill required fields");
      const itemData = { 
          item_name: form.item_name, 
          brand: form.brand || "No Brand",
          category: form.category,
          unit_price: Number(form.unit_price),
          location: form.location || selectedStockRoom
        };
      if(form.id) await supabase.from("items").update(itemData).eq("id", form.id);
      else {
          const { data, error } = await supabase
            .from("items")
            .insert([itemData])
            .select();
        
          if (error) {
            console.error(error);
            alert(error.message);
            return;
          }
        
          if (data?.length && modalTypeBeforeItem === "transaction") {
            setForm(prev => ({ ...prev, item_id: data[0].id }));
            setModalType("transaction");
            setShowModal(true);
            setModalTypeBeforeItem("");
            return;
          }
        
        }
      setForm({   date:"",   item_id:"",   item_name:"",   brand:"",   category:"",   type:"IN",   quantity:"",   unit_price:"",   id:null });
      setShowModal(false);
      setModalType("");
      loadData();
    }
  };
  const emptyRowComponent = (colSpan, text) => <tr><td colSpan={colSpan} style={styles.emptyRow}>{text}</td></tr>;
  // ================= AUTH SCREEN =================
      if(!session) return (
      
        <div style={styles.loginPage}>
      
          {/* LEFT SIDE BRAND PANEL */}
          <div style={styles.loginLeft}>

            <div style={{
              background:"#ffffff",
              padding:"10px 18px",
              borderRadius:12,
              marginBottom:25,
              boxShadow:"0 6px 18px rgba(0,0,0,0.25)"
            }}>
              <img 
                src="/logo.jpg"
                alt="Lago De Oro"
                style={{width:110, display:"block"}}
              />
            </div>

            <div style={{
              fontSize:40,
              fontWeight:800,
              letterSpacing:1,
              marginBottom:6
            }}>
              Lago De Oro
            </div>
      
            <div style={{
              fontSize:15,
              opacity:0.85,
              letterSpacing:1,
              textTransform:"uppercase"
            }}>
              Inventory Management System
            </div>
      
          </div>
      
          {/* RIGHT SIDE LOGIN FORM */}
          <div style={styles.loginRight}>
      
            <div style={styles.loginCard}>
      
              <div style={styles.loginTitle}>
                Login
              </div>
      
              <div style={styles.loginSubtitle}>
                Authorized Personnel Only
              </div>
      
              <input
                style={styles.loginInput}
                placeholder="Email"
                value={authEmail}
                onChange={e=>setAuthEmail(e.target.value)}
              />
      
              <input
                style={styles.loginInput}
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={e=>setAuthPassword(e.target.value)}
              />
      
              <button style={styles.loginButton} onClick={handleAuth}>
                Login
              </button>
      
            </div>
      
          </div>
      
        </div>
      
      );
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
        height: "auto"
      }}>
      <h2>IN Transactions</h2>
      <input
        style={{ ...styles.input, marginBottom: 10 }}
        placeholder="Search IN transactions..."
        value={inSearch}
        onChange={(e) => setInSearch(e.target.value)}
      />
      <div style={{
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
                const filteredIn = inTransactions.filter(
                  (item) =>
                    (item.items?.item_name || "").toLowerCase().includes(inSearch.toLowerCase()) ||
                    (item.items?.brand || "").toLowerCase().includes(inSearch.toLowerCase())
                );
            
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
        height: "auto"
      }}>
      <h2>OUT Transactions</h2>
      <input
        style={{ ...styles.input, marginBottom: 10 }}
        placeholder="Search OUT transactions..."
        value={outSearch}
        onChange={(e) => setOutSearch(e.target.value)}
      />
      <div style={{
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
              const filteredOut = outTransactions.filter(
                (item) =>
                  (item.items?.item_name || "").toLowerCase().includes(outSearch.toLowerCase()) ||
                  (item.items?.brand || "").toLowerCase().includes(outSearch.toLowerCase())
              );
          
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
                
                const filteredDeleted = deletedItems.filter(
                (item) =>
                (item.item_name || "").toLowerCase().includes(deletedItemSearch.toLowerCase()) ||
                (item.brand || "").toLowerCase().includes(deletedItemSearch.toLowerCase())
                );
                
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
                
                const filteredDeleted = deletedTransactions.filter(
                (t) =>
                (t.items?.item_name || "").toLowerCase().includes(deletedTxSearch.toLowerCase()) ||
                (t.items?.brand || "").toLowerCase().includes(deletedTxSearch.toLowerCase())
                );
                
                if (filteredDeleted.length === 0) {
                return (
                <tr>
                <td colSpan={7} style={{ padding:16,textAlign:"center",color:"#9ca3af" }}>
                No deleted transactions
                </td>
                </tr>
                );
                }
                
                return filteredDeleted.map((i) => (
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
      <div style={{ display: "flex", gap: 12, alignItems:"center" }}>
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
        style={{ ...styles.buttonPrimary, background:"#16a34a" }}
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
        <strong>₱{Number(monthlySummary?.totalInValue || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</strong>
      </div>

      <div style={{ ...styles.card, borderLeft: "6px solid #ef4444" }}>
        <h4>Total OUT</h4>
        <p>{formatNumber(monthlySummary?.totalOutQty || 0)} units</p>
        <strong>₱{Number(monthlySummary?.totalOutValue || 0).toLocaleString(undefined,{minimumFractionDigits:2})}</strong>
      </div>

      <div style={{
        ...styles.card,
        background: netValue >= 0 ? "#ecfdf5" : "#fef2f2",
        borderLeft: `6px solid ${netValue >= 0 ? "#10b981" : "#ef4444"}`
      }}>
        <h4>Net Movement</h4>
        <strong style={{ fontSize: 18 }}>
          ₱{Number(netValue).toLocaleString(undefined,{minimumFractionDigits:2})}
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
        
            return Object.values(
                monthlyTransactions.reduce((acc, t) => {
              
                  const key = `${t.items?.item_name}-${t.items?.brand}`;
                  const price = Number(t.unit_price || t.items?.unit_price || 0);
                  const qty = Number(t.quantity || 0);
                  const value = qty * price;
              
                  if (!acc[key]) {
                    acc[key] = {
                      item: t.items?.item_name,
                      brand: t.items?.brand,
                      inQty: 0,
                      outQty: 0,
                      inValue: 0,
                      outValue: 0
                    };
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
              )
              .map((row, idx) => {
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
                    ₱{Number(netValue).toLocaleString(undefined,{minimumFractionDigits:2})}
                  </td>
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
            : monthlyTransactions
                .filter(t => !selectedStockRoom || t.items?.location === selectedStockRoom)
                .map(t => (
                <tr key={t.id}>
                  <td style={styles.thtd}>{t.date}</td>
                  <td style={styles.thtd}>{capitalizeWords(t.items?.item_name)}</td>
                  <td style={styles.thtd}>{displayBrand(t.items?.brand)}</td>
                  <td style={styles.thtd}>{t.type}</td>
                  <td style={styles.thtd}>{formatNumber(t.quantity)}</td>
                  <td style={styles.thtd}>
                   ₱{Number((t.quantity || 0) *
                      (t.unit_price || t.items?.unit_price || 0)
                    ).toLocaleString(undefined,{minimumFractionDigits:2})}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
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
                const result = await supabase
                  .from("inventory_transactions")
                  .update({ deleted: true })
                  .eq("id", data.id);
              
                if (result.error) throw result.error;
              }

              else if (type === "restoreTx") {
                const result = await supabase
                  .from("inventory_transactions")
                  .update({ deleted: false })
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
