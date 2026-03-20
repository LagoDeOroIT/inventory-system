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
    menuItemStyle,
    setForm,
    setModalType,
    setShowModal,
    setConfirmAction,
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

      {/* CARD */}
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
              ₱{totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
            overflowX: "hidden",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "#f3f4f6",
                zIndex: 1,
              }}
            >
              <tr>
                {["Qty", "Item Name", "Brand", "Price", "Total Value", "Actions"].map(
                  (th, idx) => (
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
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {(() => {
                const groupedStock = stockInventory
                  .filter(
                    (item) =>
                      (item.item_name || "")
                        .toLowerCase()
                        .includes(stockSearch.toLowerCase()) ||
                      (item.brand || "")
                        .toLowerCase()
                        .includes(stockSearch.toLowerCase())
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
                        onClick={(e) => {
                          if (e.target.tagName !== "BUTTON") {
                            toggleCategory(category);
                          }
                        }}
                      >
                        <td colSpan={6} style={{ padding: "12px 14px" }}>
                          <div style={styles.categoryContainer}>
                            <div style={styles.categoryLeft}>
                              <span style={{ color: "#6b7280" }}>
                                {isOpen ? "▾" : "▸"}
                              </span>

                              <span>
                                {category}
                              </span>
                            </div>

                            <div style={styles.categoryRight}>
                              <span>
                                {items.length} item{items.length !== 1 ? "s" : ""}
                              </span>
                              <span style={{ fontWeight: 600 }}>
                                ₱{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* ITEMS */}
                      {isOpen &&
                        items.map((i) => (
                          <tr key={i.id}>
                            <td style={styles.thtd}>{formatNumber(i.stock)}</td>
                            <td style={styles.thtd}>{capitalizeWords(i.item_name)}</td>
                            <td style={styles.thtd}>{displayBrand(i.brand)}</td>
                            <td style={styles.thtd}>
                              ₱{Number(i.unit_price || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td style={styles.thtd}>
                              ₱{Number(i.stock * Number(i.unit_price || 0)).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </td>

                            <td style={{ ...styles.thtd, position: "relative" }}>
                              <div
                                className="action-menu"
                                ref={(el) => (menuRefs.current["stock-" + i.id] = el)}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(
                                      openMenuId === "stock-" + i.id
                                        ? null
                                        : "stock-" + i.id
                                    );
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: 20,
                                    cursor: "pointer",
                                  }}
                                >
                                  ⋮
                                </button>

                                {openMenuId === "stock-" + i.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      position: "absolute",
                                      right: 0,
                                      top: 30,
                                      background: "#fff",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 8,
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                      zIndex: 10,
                                      minWidth: 120,
                                      display: "flex",
                                      flexDirection: "column",
                                    }}
                                  >
                                    <button
                                      style={menuItemStyle}
                                      onClick={() => {
                                        setForm({
                                          id: i.id,
                                          item_name: i.item_name || "",
                                          brand: i.brand || "",
                                          category: i.category || "",
                                          unit_price: i.unit_price || "",
                                          brandOptions: [i.brand],
                                        });
                                        setModalType("item");
                                        setShowModal(true);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      Edit
                                    </button>

                                    <button
                                      style={{ ...menuItemStyle, color: "#ef4444" }}
                                      onClick={() => {
                                        setConfirmAction({ type: "deleteItem", data: i });
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
  );
}
