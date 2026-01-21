import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function StockDashboard() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: itemsData } = await supabase
      .from("items")
      .select("id, item_name, unit_price, brand");

    const { data: txData } = await supabase
      .from("inventory_transactions")
      .select("item_id, type, quantity")
      .eq("deleted", false);

    setItems(itemsData || []);
    setTransactions(txData || []);
  }

  const stockByItem = useMemo(() => {
    const map = {};

    items.forEach(i => {
      map[i.id] = {
        ...i,
        stock: 0,
        value: 0
      };
    });

    transactions.forEach(t => {
      if (!map[t.item_id]) return;
      const qty = t.type === "IN" ? t.quantity : -t.quantity;
      map[t.item_id].stock += qty;
      map[t.item_id].value = map[t.item_id].stock * map[t.item_id].unit_price;
    });

    return Object.values(map);
  }, [items, transactions]);

  const totalStockValue = stockByItem.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">📊 Stock Inventory Dashboard</h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Stock Value</p>
            <p className="text-2xl font-bold">₱{totalStockValue.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Low Stock Items</p>
            <p className="text-2xl font-bold">
              {stockByItem.filter(i => i.stock <= 5).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* STOCK TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead className="bg-muted">
            <tr>
              <th className="border p-2 text-left">Item</th>
              <th className="border p-2 text-left">Brand</th>
              <th className="border p-2 text-right">Stock</th>
              <th className="border p-2 text-right">Unit Price</th>
              <th className="border p-2 text-right">Stock Value</th>
            </tr>
          </thead>
          <tbody>
            {stockByItem.map(i => (
              <tr key={i.id} className={i.stock <= 5 ? "bg-red-50" : ""}>
                <td className="border p-2">{i.item_name}</td>
                <td className="border p-2">{i.brand}</td>
                <td className="border p-2 text-right font-semibold">{i.stock}</td>
                <td className="border p-2 text-right">₱{i.unit_price.toFixed(2)}</td>
                <td className="border p-2 text-right">₱{i.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
