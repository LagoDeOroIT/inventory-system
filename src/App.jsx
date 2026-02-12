import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  // ================= STATE =================
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("stock");
  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");
  const [confirm, setConfirm] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    item_id: "",
    type: "IN",
    quantity: "",
    unit_price: "",
    date: "",
    brand: "",
    unit: "",
    volume_pack: "",
  });
  const originalFormRef = useRef(null);

  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  const [inSearch, setInSearch] = useState("");
  const [inFilter, setInFilter] = useState("all");
  const [outSearch, setOutSearch] = useState("");
  const [outFilter, setOutFilter] = useState("all");
  const [deletedSearch, setDeletedSearch] = useState("");

  const stockRooms = [
    "All Stock Rooms", "L1","L2 Room 1","L2 Room 2","L2 Room 3","L2 Room 4",
    "L3","L5","L6","L7","Maintenance Bodega 1","Maintenance Bodega 2",
    "Maintenance Bodega 3","SKI Stock Room","Quarry Stock Room"
  ];

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ================= LOAD DATA =================
  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price, brand, location");

    const { data: tx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", false)
      .order("date", { ascending: false });

    const { data: deletedTx } = await supabase
      .from("inventory_transactions")
      .select("*, items(item_name)")
      .eq("deleted", true)
      .order("deleted_at", { ascending: false });

    setItems(itemsData || []);
    setTransactions(tx || []);
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => {
    if (session) loadData();
    setShowForm(false);
  }, [session]);

  // ================= CONFIRM MODAL =================
  const openConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });
  const closeConfirm = () => setConfirm(null);

  // ================= HELPER =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(
      k => String(originalFormRef.current[k] || "") !== String(form[k] || "")
    );
  }

  // ================= STOCK INVENTORY =================
  const stockInventory = items
    .filter(i => selectedStockRoom === "All Stock Rooms" || i.location === selectedStockRoom)
    .map(i => {
      const related = transactions.filter(t => t.item_id === i.id);
      const stock = related.reduce((sum, t) => sum + (t.type === "IN" ? Number(t.quantity) : -Number(t.quantity)), 0);
      const latestTx = related.slice().sort((a,b)=> new Date(b.created_at) - new Date(a.created_at))[0];
      return { id: i.id, item_name: i.item_name, brand: latestTx?.brand||i.brand||"—", volume_pack: latestTx?.volume_pack||"—", unit_price: Number(latestTx?.unit_price??i.unit_price??0), stock, location: i.location };
    });

  // ================= FILTERED TRANSACTIONS =================
  const filteredTransactions = transactions.filter(t =>
    selectedStockRoom === "All Stock Rooms" ? true : t.location === selectedStockRoom
  );

  const monthlyTotals = filteredTransactions.reduce((acc,t)=>{
    if(!t.date) return acc;
    const month = t.date.slice(0,7);
    acc[month] = acc[month]||{IN:0,OUT:0};
    acc[month][t.type]+=t.quantity*t.unit_price;
    return acc;
  }, {});

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handler = e => searchRef.current && !searchRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ================= AUTH UI =================
  if(!session) return (
    <div className="p-20 text-center">
      <h2 className="text-2xl mb-4 font-semibold">Inventory Login</h2>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        onClick={()=>supabase.auth.signInWithOAuth({provider:"google"})}
      >
        Login with Google
      </button>
    </div>
  );

  // ================= RENDER =================
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📦 Lago De Oro Inventory System</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Stock Room</label>
          <select
            value={selectedStockRoom}
            onChange={e=>setSelectedStockRoom(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {stockRooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-2 mb-6">
        {["stock","transactions","deleted","report"].map(tab=>(
          <button
            key={tab}
            onClick={()=>{
              if(editingId && isFormChanged()){
                openConfirm("Discard unsaved changes?", ()=>{ setEditingId(null); originalFormRef.current=null; setActiveTab(tab); });
              } else { setEditingId(null); originalFormRef.current=null; setActiveTab(tab); }
            }}
            className={`px-4 py-2 rounded-full font-medium ${activeTab===tab?"bg-gray-900 text-white":"bg-gray-200 text-gray-700"}`}
          >
            {tab==="stock"?"📦 Stock":tab==="transactions"?"📄 Transactions":tab==="deleted"?"🗑️ Deleted":"📊 Report"}
          </button>
        ))}
      </div>

      {/* ===== CONFIRM MODAL ===== */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80 text-center">
            <h3 className="text-lg font-semibold mb-2">Confirm Action</h3>
            <p className="mb-4 text-gray-600">{confirm.message}</p>
            <div className="flex gap-2">
              <button onClick={()=>{confirm.onConfirm(); closeConfirm();}} className="flex-1 bg-gray-900 text-white py-2 rounded hover:bg-gray-800">Confirm</button>
              <button onClick={closeConfirm} className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STOCK TAB ================= */}
      {activeTab==="stock" && (
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Stock Inventory</h2>
            <span className="text-sm text-gray-500">Total: {stockInventory.length} | Low: {stockInventory.filter(i=>i.stock<=5).length}</span>
          </div>
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Item</th>
                <th className="px-2 py-1 text-left">Brand</th>
                <th className="px-2 py-1 text-left">Volume</th>
                <th className="px-2 py-1 text-left">Stock</th>
                <th className="px-2 py-1 text-left">Unit Price</th>
                <th className="px-2 py-1 text-left">Total</th>
                <th className="px-2 py-1 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockInventory.length===0 && (
                <tr><td colSpan={7} className="text-center py-2 text-gray-500">No stock data</td></tr>
              )}
              {stockInventory.map(i=>(
                <tr key={i.id} className={i.stock<=5?"bg-red-50 hover:bg-red-100":"hover:bg-gray-50"}>
                  <td className="px-2 py-1">{i.item_name}</td>
                  <td className="px-2 py-1">{i.brand}</td>
                  <td className="px-2 py-1">{i.volume_pack}</td>
                  <td className="px-2 py-1">{i.stock}</td>
                  <td className="px-2 py-1">₱{i.unit_price.toFixed(2)}</td>
                  <td className="px-2 py-1">₱{(i.unit_price*i.stock).toFixed(2)}</td>
                  <td className="px-2 py-1 flex gap-1">
                    <button className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
                    <button className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TRANSACTIONS TAB ================= */}
      {activeTab==="transactions" && (
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Transactions</h2>
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-left">Item</th>
                <th className="px-2 py-1 text-left">Brand</th>
                <th className="px-2 py-1 text-left">Quantity</th>
                <th className="px-2 py-1 text-left">Unit Price</th>
                <th className="px-2 py-1 text-left">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length===0 && (
                <tr><td colSpan={7} className="text-center py-2 text-gray-500">No transactions</td></tr>
              )}
              {filteredTransactions.map(t=>(
                <tr key={t.id} className={t.type==="OUT"?"bg-red-50 hover:bg-red-100":"hover:bg-gray-50"}>
                  <td className="px-2 py-1">{t.date}</td>
                  <td className="px-2 py-1">{t.type}</td>
                  <td className="px-2 py-1">{t.items.item_name}</td>
                  <td className="px-2 py-1">{t.brand}</td>
                  <td className="px-2 py-1">{t.quantity}</td>
                  <td className="px-2 py-1">₱{t.unit_price.toFixed(2)}</td>
                  <td className="px-2 py-1">₱{(t.unit_price*t.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DELETED TAB ================= */}
      {activeTab==="deleted" && (
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Deleted Transactions</h2>
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Deleted At</th>
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-left">Item</th>
                <th className="px-2 py-1 text-left">Brand</th>
                <th className="px-2 py-1 text-left">Quantity</th>
                <th className="px-2 py-1 text-left">Unit Price</th>
                <th className="px-2 py-1 text-left">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deletedTransactions.length===0 && (
                <tr><td colSpan={7} className="text-center py-2 text-gray-500">No deleted transactions</td></tr>
              )}
              {deletedTransactions.map(t=>(
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1">{t.deleted_at}</td>
                  <td className="px-2 py-1">{t.type}</td>
                  <td className="px-2 py-1">{t.items.item_name}</td>
                  <td className="px-2 py-1">{t.brand}</td>
                  <td className="px-2 py-1">{t.quantity}</td>
                  <td className="px-2 py-1">₱{t.unit_price.toFixed(2)}</td>
                  <td className="px-2 py-1">₱{(t.unit_price*t.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= REPORT TAB ================= */}
      {activeTab==="report" && (
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Monthly Report</h2>
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Month</th>
                <th className="px-2 py-1 text-left">Total IN</th>
                <th className="px-2 py-1 text-left">Total OUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.keys(monthlyTotals).length===0 && (
                <tr><td colSpan={3} className="text-center py-2 text-gray-500">No data</td></tr>
              )}
              {Object.entries(monthlyTotals).map(([month, val])=>(
                <tr key={month} className="hover:bg-gray-50">
                  <td className="px-2 py-1">{month}</td>
                  <td className="px-2 py-1">₱{val.IN.toFixed(2)}</td>
                  <td className="px-2 py-1">₱{val.OUT.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
