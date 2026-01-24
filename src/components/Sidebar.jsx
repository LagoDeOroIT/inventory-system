import { useState } from "react";
import { STOCK_ROOMS } from "../stockRooms";

export function Sidebar({ onSelect }) {
  const [openRoom, setOpenRoom] = useState(null);

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white p-4">
      <h2 className="text-xl font-bold mb-4">Stock Rooms</h2>

      <ul className="space-y-2">
        {STOCK_ROOMS.map((room) => (
          <li key={room.id}>
            <button
              onClick={() =>
                setOpenRoom(openRoom === room.id ? null : room.id)
              }
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700"
            >
              {room.name}
            </button>

            {openRoom === room.id && (
              <ul className="ml-4 mt-2 space-y-1 text-sm">
                {[
                  ["view-items", "View Items"],
                  ["add-item", "Add Item"],
                  ["transactions", "Stock Transactions"],
                  ["monthly-report", "Monthly Report"],
                ].map(([action, label]) => (
                  <li key={action}>
                    <button
                      onClick={() => onSelect(room, action)}
                      className="hover:text-blue-400"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
