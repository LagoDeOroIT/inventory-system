import React, { useState } from "react";

export default function StockInventory(props) {
  const {
    items,
    selectedStockRoom,
    setSelectedStockRoom,
    stockRooms,
    formatNumber,
    capitalizeWords,
    displayBrand,
    styles,
  } = props;

  const [search, setSearch] = useState("");

  const filteredItems = (items || [])
    .filter((i) => {
      const q = search.toLowerCase();
      return (
        (i.item_name || "").toLowerCase().includes(q) ||
        (i.brand || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.item_name.localeCompare(b.item_name));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Stock Inventory</h2>

        <select
          value={selectedStockRoom?.id || ""}
          onChange={(e) => {
            const room = stockRooms.find(r => r.id === e.target.value);
            setSelectedStockRoom(room);
          }}
        >
          {stockRooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>

      {/* SEARCH */}
      <input
        style={styles.input}
        placeholder="Search items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f3f4f6" }}>
            <tr>
              <th style={{ padding: 10, textAlign: "left" }}>Item</th>
              <th style={{ padding: 10, textAlign: "left" }}>Brand</th>
              <th style={{ padding: 10 }}>Stock</th>
              <th style={{ padding: 10 }}>Price</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 16 }}>
                  No items found
                </td>
              </tr>
            ) : (
              filteredItems.map((i) => (
                <tr key={i.id}>
                  <td style={{ padding: 10 }}>
                    {capitalizeWords(i.item_name)}
                  </td>

                  <td style={{ padding: 10 }}>
                    {displayBrand(i.brand)}
                  </td>

                  <td style={{ padding: 10, textAlign: "center" }}>
                    {formatNumber(i.stock)}
                  </td>

                  <td style={{ padding: 10 }}>
                    ₱{Number(i.unit_price || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
