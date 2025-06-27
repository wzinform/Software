import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import './LoginRegister.css';

const API_BASE = 'http://localhost:5000/api';

interface FishPrice {
  name: string;
  prices: { date: string; price: number }[];
}

const fishColors: Record<string, string> = {
  '鲈鱼': '#4caf50',
  '草鱼': '#2196f3',
  '鲫鱼': '#ff9800',
};

export default function FishPriceChart() {
  const [fishData, setFishData] = useState<FishPrice[]>([]);

  useEffect(() => {
    axios.get(`${API_BASE}/fish-prices`)
      .then(res => setFishData(res.data))
      .catch(err => console.error('获取鱼价数据失败:', err));
  }, []);

  const mergedData = (): any[] => {
    const dateMap: Record<string, any> = {};
    fishData.forEach(fish => {
      fish.prices.forEach(entry => {
        if (!dateMap[entry.date]) dateMap[entry.date] = { date: entry.date };
        dateMap[entry.date][fish.name] = entry.price;
      });
    });
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  };

  const data = mergedData();

  return (
    <div
      className="form-container"
      style={{
        maxWidth: 1000,
        margin: '30px auto',
        padding: 24,
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        borderRadius: 16,
        backgroundColor: '#f7f8fa',
        display: 'flex',
        gap: 24,
      }}
    >
      {/* 左侧数据表 */}
      <div
        style={{
          flex: 1,
          maxHeight: 460,
          overflowY: 'auto',
          border: '1px solid #1a2539',
          borderRadius: 12,
          padding: 16,
          fontSize: 14,
          color: '#444',
          backgroundColor: '#ffffff',
        }}
      >
        <h3 style={{ marginBottom: 12, color: '#2c3e50' }}>鱼类价格数据</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #2c3e50' }}>
              <th style={{ padding: '6px 12px', textAlign: 'left' }}>日期</th>
              {fishData.map(fish => (
                <th
                  key={fish.name}
                  style={{
                    padding: '6px 12px',
                    textAlign: 'right',
                    color: fishColors[fish.name] || '#000',
                  }}
                >
                  {fish.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.date} style={{ borderBottom: '1px solid #1a2539' }}>
                <td style={{ padding: '6px 12px' }}>{row.date}</td>
                {fishData.map(fish => (
                  <td key={fish.name} style={{ padding: '6px 12px', textAlign: 'right' }}>
                    {row[fish.name] !== undefined ? row[fish.name].toFixed(2) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 右侧折线图 */}
      <div
        style={{
          flex: 1,
          height: 460,
          padding: 16,
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ marginBottom: 12, color: '#2c3e50' }}>鱼类价格趋势图</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 40, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" />
            <XAxis dataKey="date" tick={{ fontSize: 14, fill: '#555' }} />
            <YAxis tick={{ fontSize: 14, fill: '#555' }} unit=" 元" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#f9f9f9',
                borderRadius: 8,
                borderColor: '#ccc',
              }}
              itemStyle={{ color: '#333', fontWeight: 'bold' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: 10, fontSize: 15, fontWeight: 600 }}
            />
            {fishData.map(fish => (
              <Line
                key={fish.name}
                type="monotone"
                dataKey={fish.name}
                stroke={fishColors[fish.name] || '#8884d8'}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
