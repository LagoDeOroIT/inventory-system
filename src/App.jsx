import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// ================= SUPABASE =================
const supabaseUrl = "https://pmhpydbsysxjikghxjib.supabase.co";
const supabaseKey = "YOUR_PUBLIC_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

// ================= LOCATIONS =================
const LOCATIONS = ["Warehouse A", "Warehouse B", "Maintenance", "Office Stock"];

// ================= STYLES =================
const styles = {
  container:{display:"flex",minHeight:"100vh",fontFamily:"Inter",background:"#f3f4f6"},
  sidebar:{width:220,background:"#111827",color:"#fff",padding:16},
  main:{flex:1,padding:20},
  button:{padding:10,border:"none",borderRadius:6,cursor:"pointer",marginBottom:8,width:"100%"},
  primary:{background:"#2563eb",color:"#fff"},
  danger:{background:"#ef4444",color:"#fff"},
  input:{width:"100%",padding:8,marginBottom:8,borderRadius:6,border:"1px solid #ccc"},
  table:{width:"100%",borderCollapse:"collapse"},
  td:{border:"1px solid #ddd",padding:6},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",justifyContent:"center",alignItems:"center"},
  modalCard:{background:"#fff",padding:20,borderRadius:8,width:480}
};

export default function App() {
  const [session,setSession]=useState(null);
  const [items,setItems]=useState([]);
  const [transactions,setTransactions]=useState([]);
  const [tab,setTab]=useState("dashboard");
  const [location,setLocation]=useState("");
  const [showModal,setShowModal]=useState(false);
  const [modalType,setModalType]=useState("");
  const [editTx,setEditTx]=useState(null);

  const [form,setForm]=useState({
    date:"",
    item_name:"",
    brand:"",
    brandOptions:[],
    typingNewBrand:false,
    type:"IN",
    quantity:"",
    price:"",
    location:"",
    id:null
  });

  // ================= AUTH =================
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:listener}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  // ================= LOAD DATA =================
  const loadData=async()=>{
    const {data:itemsData}=await supabase.from("items").select("*");
    const {data:tx}=await supabase.from("inventory_transactions").select("*, items(*)");
    setItems(itemsData||[]);
    setTransactions(tx||[]);
  };
  useEffect(()=>{if(session) loadData();},[session]);

  // ================= FORM CHANGE =================
  const handleFormChange=(key,value)=>{
    setForm(prev=>{
      let updated={...prev,[key]:value};

      if(key==="item_name"){
        const related=items.filter(i=>i.item_name===value && !i.deleted);
        updated.brandOptions=[...new Set(related.map(i=>i.brand))];
        updated.brand="";
        updated.price="";
        updated.typingNewBrand=false;
      }

      if(key==="brand"){
        const match=items.find(i=>i.item_name===prev.item_name && i.brand===value);
        if(match) updated.price=match.unit_price;
      }

      return updated;
    });
  };

  // ================= SUBMIT ITEM =================
  const saveItem=async()=>{
    if(!form.item_name||!form.brand||!form.price||!form.location) return alert("Fill all");

    const exists=items.find(i=>i.item_name===form.item_name && i.brand===form.brand && i.location===form.location && !i.deleted);
    if(exists) return alert("Item already exists in this location");

    await supabase.from("items").insert({
      item_name:form.item_name,
      brand:form.brand,
      unit_price:Number(form.price),
      location:form.location
    });

    alert("Item added");
    setShowModal(false);
    loadData();
  };

  // ================= SUBMIT TRANSACTION =================
  const saveTransaction=async()=>{
    if(!form.item_name||!form.brand||!form.quantity||!form.location) return alert("Fill required");

    const item=items.find(i=>i.item_name===form.item_name && i.brand===form.brand && i.location===form.location);
    if(!item) return alert("Item not found in location");

    const data={
      date:form.date,
      item_id:item.id,
      type:form.type,
      quantity:Number(form.quantity),
      unit_price:Number(form.price),
      location:form.location,
      deleted:false
    };

    if(editTx){
      await supabase.from("inventory_transactions").update(data).eq("id",editTx.id);
      setEditTx(null);
    } else {
      await supabase.from("inventory_transactions").insert(data);
    }

    alert("Saved");
    setShowModal(false);
    loadData();
  };

  // ================= STOCK ENGINE =================
  const stockEngine=()=>{
    const stock={};
    transactions.filter(t=>!t.deleted).forEach(t=>{
      const item=items.find(i=>i.id===t.item_id);
      if(!item) return;
      const key=item.item_name+" | "+item.brand+" | "+t.location;
      if(!stock[key]) stock[key]=0;
      stock[key]+=t.type==="IN"?t.quantity:-t.quantity;
    });
    return stock;
  };

  // ================= MONTHLY REPORT =================
  const monthlyReport=()=>{
    const r={};
    transactions.filter(t=>!t.deleted).forEach(t=>{
      const m=t.date?.slice(0,7);
      if(!r[m]) r[m]={in:0,out:0};
      if(t.type==="IN") r[m].in+=t.quantity;
      else r[m].out+=t.quantity;
    });
    return Object.entries(r).map(([m,d])=>({month:m,IN:d.in,OUT:d.out,NET:d.in-d.out}));
  };

  // ================= DASHBOARD CHART =================
  const chartData=monthlyReport();

  if(!session) return <div style={{padding:40}}>Login required</div>;

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h3>Inventory ERP</h3>
        <select style={styles.input} value={location} onChange={e=>setLocation(e.target.value)}>
          <option value="">All Locations</option>
          {LOCATIONS.map(l=><option key={l}>{l}</option>)}
        </select>

        <button style={styles.button} onClick={()=>setTab("dashboard")}>📊 Dashboard</button>
        <button style={styles.button} onClick={()=>setTab("stock")}>📦 Stock</button>
        <button style={styles.button} onClick={()=>setTab("transactions")}>📄 Transactions</button>
        <button style={styles.button} onClick={()=>setTab("deleted")}>🗑️ Deleted History</button>

        <hr/>
        <button style={{...styles.button,...styles.primary}} onClick={()=>{setModalType("item");setShowModal(true);}}>+ Add Item</button>
        <button style={{...styles.button,...styles.primary}} onClick={()=>{setModalType("transaction");setShowModal(true);}}>+ Add Transaction</button>
      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* DASHBOARD */}
        {tab==="dashboard" && (
          <>
            <h2>Monthly Stock Movement</h2>
            <LineChart width={700} height={300} data={chartData}>
              <CartesianGrid stroke="#ccc"/>
              <XAxis dataKey="month"/>
              <YAxis/>
              <Tooltip/>
              <Line type="monotone" dataKey="IN" stroke="#22c55e"/>
              <Line type="monotone" dataKey="OUT" stroke="#ef4444"/>
              <Line type="monotone" dataKey="NET" stroke="#2563eb"/>
            </LineChart>
          </>
        )}

        {/* STOCK TAB */}
        {tab==="stock" && (
          <>
            <h2>Per Location Stock</h2>
            <table style={styles.table}>
              <tbody>
                {Object.entries(stockEngine()).map(([k,v])=>{
                  if(location && !k.includes(location)) return null;
                  return <tr key={k}><td style={styles.td}>{k}</td><td style={styles.td}>{v}</td></tr>;
                })}
              </tbody>
            </table>
          </>
        )}

        {/* TRANSACTIONS TAB */}
        {tab==="transactions" && (
          <>
            <h2>Transactions</h2>
            <table style={styles.table}>
              <tbody>
                {transactions.filter(t=>!t.deleted).map(t=>(
                  <tr key={t.id}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.items?.item_name}</td>
                    <td style={styles.td}>{t.items?.brand}</td>
                    <td style={styles.td}>{t.location}</td>
                    <td style={styles.td}>{t.type}</td>
                    <td style={styles.td}>{t.quantity}</td>
                    <td style={styles.td}>
                      <button onClick={()=>{
                        setEditTx(t);
                        setForm({...t, item_name:t.items.item_name, brand:t.items.brand});
                        setModalType("transaction");
                        setShowModal(true);
                      }}>Edit</button>
                      <button onClick={async()=>{
                        await supabase.from("inventory_transactions").update({deleted:true}).eq("id",t.id);
                        loadData();
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* DELETED HISTORY */}
        {tab==="deleted" && (
          <>
            <h2>Deleted Transactions</h2>
            <table style={styles.table}>
              <tbody>
                {transactions.filter(t=>t.deleted).map(t=>(
                  <tr key={t.id}>
                    <td style={styles.td}>{t.items?.item_name}</td>
                    <td style={styles.td}>{t.quantity}</td>
                    <td style={styles.td}>
                      <button onClick={async()=>{
                        await supabase.from("inventory_transactions").update({deleted:false}).eq("id",t.id);
                        loadData();
                      }}>Restore</button>
                      <button onClick={async()=>{
                        await supabase.from("inventory_transactions").delete().eq("id",t.id);
                        loadData();
                      }}>Permanent Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={styles.modal} onClick={()=>setShowModal(false)}>
          <div style={styles.modalCard} onClick={e=>e.stopPropagation()}>

            {/* ADD ITEM */}
            {modalType==="item" && (
              <>
                <h3>Add Item</h3>
                <input style={styles.input} placeholder="Item Name" onChange={e=>handleFormChange("item_name",e.target.value)} />
                <input style={styles.input} placeholder="Brand" onChange={e=>handleFormChange("brand",e.target.value)} />
                <input style={styles.input} type="number" placeholder="Price" onChange={e=>handleFormChange("price",e.target.value)} />
                <select style={styles.input} onChange={e=>handleFormChange("location",e.target.value)}>
                  <option>Select Location</option>
                  {LOCATIONS.map(l=><option key={l}>{l}</option>)}
                </select>
                <button style={styles.primary} onClick={saveItem}>Save</button>
              </>
            )}

            {/* ADD / EDIT TRANSACTION */}
            {modalType==="transaction" && (
              <>
                <h3>{editTx ? "Edit Transaction" : "New Transaction"}</h3>
                <input style={styles.input} type="date" onChange={e=>handleFormChange("date",e.target.value)} />
                <input style={styles.input} placeholder="Item Name" onChange={e=>handleFormChange("item_name",e.target.value)} />
                <input style={styles.input} placeholder="Brand" onChange={e=>handleFormChange("brand",e.target.value)} />
                <select style={styles.input} onChange={e=>handleFormChange("type",e.target.value)}>
                  <option>IN</option>
                  <option>OUT</option>
                </select>
                <input style={styles.input} type="number" placeholder="Qty" onChange={e=>handleFormChange("quantity",e.target.value)} />
                <input style={styles.input} type="number" placeholder="Price" onChange={e=>handleFormChange("price",e.target.value)} />
                <select style={styles.input} onChange={e=>handleFormChange("location",e.target.value)}>
                  <option>Select Location</option>
                  {LOCATIONS.map(l=><option key={l}>{l}</option>)}
                </select>
                <button style={styles.primary} onClick={saveTransaction}>Save</button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
