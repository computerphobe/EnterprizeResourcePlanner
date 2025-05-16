import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DelivererDashboard = () => {
  // Stats for the boxes on top
  const stats = [
    { title: "Today's Deliveries", value: 14 },
    { title: 'Pending Pickups', value: 3 },
    { title: 'Confirmed Pickups', value: 11 },
    { title: 'Total Delivered', value: 87 },
  ];

  // Data for the wavy area chart below
  const data = [
    { name: 'Mon', Delivered: 10, Picked: 7 },
    { name: 'Tue', Delivered: 12, Picked: 8 },
    { name: 'Wed', Delivered: 14, Picked: 11 },
    { name: 'Thu', Delivered: 11, Picked: 9 },
    { name: 'Fri', Delivered: 17, Picked: 14 },
    { name: 'Sat', Delivered: 8, Picked: 6 },
    { name: 'Sun', Delivered: 6, Picked: 4 },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Deliverer Dashboard</h1>

      {/* Stat Boxes Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center hover:shadow-lg transition-shadow"
          >
            <span className="text-gray-500 font-semibold mb-2">{stat.title}</span>
            <span className="text-4xl font-extrabold text-indigo-600">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Wavy Area Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-700">
          Weekly Delivery Overview
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorPicked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
            <YAxis allowDecimals={false} tick={{ fill: '#6b7280' }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="Delivered"
              stroke="#6366F1"
              fillOpacity={1}
              fill="url(#colorDelivered)"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="Picked"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorPicked)"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DelivererDashboard;
