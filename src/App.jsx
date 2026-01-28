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
      .select("id, item_name, unit_price, brand, volume_pack, location");

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
  }, [session]);

  // ================= SAVE =================
  function isFormChanged() {
    if (!originalFormRef.current) return false;
    return Object.keys(originalFormRef.current).some(k => String(originalFormRef.current[k] || "") !== String(form[k] || ""));
  }

  async function saveTransaction() {
    if (!form.item_id || !form.quantity) return alert("Complete the form");
    const item = items.find(i => i.id === Number(form.item_id));
    if (!item) return alert("Item not found");

    if (form.type === "OUT") {
      const stockItem = stockInventory.find(i => i.id === item.id);
      if (stockItem && Number(form.quantity) > stockItem.stock) {
        alert("Cannot OUT more than available stock");
        return;
      }
    }

    const payload = {
    item_name: newItem.item_name,
    brand: newItem.brand,
    volume_pack: newItem.volume_pack,
    unit_price: Number(newItem.unit_price) || 0,
    location: selectedStockRoom,
  };dStockRoom,
  };

  const { error } = isEditingItem && editingItemId
    ? await supabase.from("items").update(payload).eq("id", editingItemId)
    : await supabase.from("items").insert([payload]);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  setNewItem({
          item_name: i.item_name,
          brand: i.brand || "",
          volume_pack: i.volume_pack || "",
          unit_price: i.unit_price,
        });m(i);
        setEditingItemId(i.id);
        setNewItem({
          item_name: i.item_name,
          brand: i.brand || "",
          unit_price: i.unit_price,
        });
        setShowAddItem(true);
      })}
    >✏️ Edit</button>
    <button
      onClick={() => openConfirm("Permanently delete this item? This cannot be undone.", async () => {
        await supabase.from("items").delete().eq("id", i.id);
        loadData();
      })}
    >🗑️ Delete</button>
  </td>
</tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
