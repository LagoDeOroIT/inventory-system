import React, { useEffect, useRef, useState } from "react";     
import { createClient } from "@supabase/supabase-js";

// ================= SUPABASE CONFIG =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "sb_publishable_Io95Lcjqq86G_9Lq9oPbxw_Ggkl1V4x";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= STYLES =================
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: 10 };
const thtd = { border: "1px solid #ccc", padding: 8, textAlign: "left" };
const editingRowStyle = { background: "#fff7ed" }; // highlight edited row

const emptyRow = (colSpan, text) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>{text}</td>
  </tr>
);

export default function App() {
  // ===== CONFIRM MODAL STATE =====
  const [confirm, setConfirm] = useState(null);
  const openConfirm = (message, onConfirm) => {
    setConfirm({ message, onConfirm });
  };
  const closeConfirm = () => setConfirm(null);
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [deletedTransactions, setDeletedTransactions] = useState([]);
  const [deletedSearch, setDeletedSearch] = useState("");
  const [inSearch, setInSearch] = useState("");
  const [inFilter, setInFilter] = useState("all");
  const [outSearch, setOutSearch] = useState("");
  const [outFilter, setOutFilter] = useState("all");

  // reset search when filter changes
  useEffect(() => {
    setInSearch("");
  }, [inFilter]);

  useEffect(() => {
    setOutSearch("");
  }, [outFilter]);

  // tabs
  const [activeTab, setActiveTab] = useState("stock");

  // ===== STOCK ROOMS =====
  const stockRooms = [
    "All Stock Rooms",
    "L1",
    "L2 Room 1",
    "L2 Room 2",
    "L2 Room 3",
    "L2 Room 4",
    "L3",
    "L5",
    "L6",
    "L7",
    "Maintenance Bodega 1",
    "Maintenance Bodega 2",
    "Maintenance Bodega 3",
    "SKI Stock Room",
    "Quarry Stock Room",
  ];

  const [selectedStockRoom, setSelectedStockRoom] = useState("All Stock Rooms");


  // form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const originalFormRef = useRef(null);
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

  // item search
  const [itemSearch, setItemSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  const filteredItemsForSearch = items.filter(i => {
    if (selectedStockRoom === "All Stock Rooms") return false;
    return (
      i.location === selectedStockRoom &&
      i.item_name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  });

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

    // NOTE: stock room filtering is applied at render level
    setDeletedTransactions(deletedTx || []);
  }

  useEffect(() => {
    if (session) loadData();

    // 🔒 CLOSE MODAL AFTER SAVE / UPDATE
    setShowForm(false);
  }, [session]);

  // ================= SAVE =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(k => String(originalFormRef.current[k] || "") !== String(form[k] || ""));
  }

  async function saveTransaction() {
  try {
    if (!form.quantity) return alert("Complete the form");

    const qty = Number(form.quantity);

    let item = items.find(i => i.id === Number(form.item_id));

    // CREATE ITEM IF NOT FOUND
    if (!item && itemSearch) {
      if (selectedStockRoom === "All Stock Rooms") {
        alert("Select a stock room to create a new item");
        return;
      }

      const { data: newItemData, error: itemErr } = await supabase
        .from("items")
        .insert([{ item_name: itemSearch, location: selectedStockRoom }])
        .select()
        .single();

      if (itemErr) throw itemErr;

      item = newItemData;
    }

    if (!item) return alert("Item not found");

    // GET CURRENT STOCK
    const { data: stockRow, error: stockErr } = await supabase
      .from("inventory")
      .select("id, stock")
      .eq("item_id", item.id)
      .eq("location", selectedStockRoom)
      .single();

    if (stockErr && stockErr.code !== "PGRST116") throw stockErr;

    let currentStock = stockRow?.stock || 0;

    // PREVENT NEGATIVE STOCK
    if (form.type === "OUT" && qty > currentStock) {
      alert("Cannot OUT more than available stock");
      return;
    }

    // CALCULATE NEW STOCK
    let newStock = currentStock;
    if (form.type === "IN") newStock += qty;
    if (form.type === "OUT") newStock -= qty;

    const payload = {
      location: selectedStockRoom === "All Stock Rooms" ? null : selectedStockRoom,
      date: form.date || new Date().toISOString().slice(0, 10),
      item_id: Number(item.id),
      type: form.type,
      quantity: qty,
      unit_price: Number(form.unit_price) || item.unit_price || 0,
      brand: form.brand || item.brand || null,
      unit: form.unit || null,
      volume_pack: form.volume_pack || null,
      deleted: false,
    };

    // SAVE TRANSACTION
    if (editingId) {
      const { error } = await supabase
        .from("inventory_transactions")
        .update(payload)
        .eq("id", editingId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("inventory_transactions")
        .insert([payload]);

      if (error) throw error;
    }

    // UPDATE INVENTORY STOCK
    if (stockRow) {
      const { error } = await supabase
        .from("inventory")
        .update({ stock: newStock })
        .eq("id", stockRow.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("inventory")
        .insert([{ 
          item_id: item.id,
          location: selectedStockRoom,
          stock: newStock,
          unit_price: payload.unit_price,
          brand: payload.brand,
          volume_pack: payload.volume_pack
        }]);

      if (error) throw error;
    }

    // UPDATE ITEM UNIT PRICE IF IN
    if (form.type === "IN" && form.unit_price) {
      await supabase
        .from("items")
        .update({ unit_price: Number(form.unit_price) })
        .eq("id", item.id);
    }

    // RESET FORM
    setForm({
      item_id: "",
      type: "IN",
      quantity: "",
      unit_price: "",
      date: "",
      brand: "",
      unit: "",
      volume_pack: ""
    });

    setItemSearch("");
    setEditingId(null);
    setShowForm(false);

    await loadData();

  } catch (err) {
    alert(err.message || "Transaction failed");
    console.error(err);
  }
}
