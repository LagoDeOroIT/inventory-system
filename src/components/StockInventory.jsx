import React from "react";

export default function StockInventory(props) {
  const {
    stockInventory,
    stockSearch,
    setStockSearch,
    totalInventoryValue,
    totalItems,
    lowStockItems,
    totalCategories,
    openCategories,
    toggleCategory,
    formatNumber,
    capitalizeWords,
    displayBrand,
    styles,
    openMenuId,
    setOpenMenuId,
    menuRefs,
    setForm,
    setModalType,
    setShowModal,
    setConfirmAction
  } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* SEARCH */}
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

      {/* TABLE CARD */}
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
        }}
      >
        <h2>Available Stocks</h2>

        {/* DASHBOARD */}
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

        {/* TABLE */}
        <div
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 8
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f3f4f6" }}>
              <tr>
                {["Qty", "Item Name", "Brand", "Price", "Total Value", "Actions"].map((th, idx) => (
                  <th key={idx} style={{ padding: 12, textAlign: "left" }}>
                    {th}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(() => {
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
                      <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                        No matching items
                      </td>
                    </tr>
                  );
                }

                return Object.entries(groupedStock).map(([category, items]) => {
                  const isOpen = openCategories[category];

                  const totalValue = items.reduce(
                    (sum, i) => sum + (i.stock * i.unit_price),
                    0
                  );

                  return (
                    <React.Fragment key={category}>
                      
                      {/* CATEGORY ROW */}
                      <tr
                        onClick={() => toggleCategory(category)}
                        style={{ background: "#f9fafb", cursor: "pointer" }}
                      >
                        <td colSpan={6} style={{ padding: 12 }}>
                          <b>{category}</b> ({items.length} items) — ₱
                          {totalValue.toLocaleString(undefined,{minimumFractionDigits:2})}
                        </td>
                      </tr>

                      {/* ITEMS */}
                      {isOpen && items.map(i => (
                        <tr key={i.id}>
                          <td style={{ padding: 10 }}>{formatNumber(i.stock)}</td>
                          <td style={{ padding: 10 }}>{capitalizeWords(i.item_name)}</td>
                          <td style={{ padding: 10 }}>{displayBrand(i.brand)}</td>
                          <td style={{ padding: 10 }}>
                            ₱{Number(i.unit_price || 0).toLocaleString(undefined,{minimumFractionDigits:2})}
                          </td>
                          <td style={{ padding: 10 }}>
                            ₱{Number(i.stock * Number(i.unit_price || 0)).toLocaleString(undefined,{minimumFractionDigits:2})}
                          </td>

                          <td style={{ padding: 10 }}>
                            <button
                              onClick={() => {
                                setForm(i);
                                setModalType("item");
                                setShowModal(true);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => {
                                setConfirmAction({ type: "deleteItem", data: i });
                              }}
                              style={{ marginLeft: 8, color: "red" }}
                            >
                              Delete
                            </button>
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
  );
}
