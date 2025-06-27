import React, { useState, useEffect } from 'react';
import { Select, Card, Spin, Space } from 'antd';
//import { Bar } from '@ant-design/charts';
//  import { Pie } from '@ant-design/plots';  // 新版可能需单独导入
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const pieColors = ['#9b77a7','#726390','#4d4e76','#64ffda', '#5b698c','#008f9f','#c58cbc'];
const stageConfigs = [
  { key: 'avg_length1', label: 'Stage 1 Avg Length', color: '#5470C6' },
  { key: 'avg_length2', label: 'Stage 2 Avg Length', color: '#91CC75' },
  { key: 'avg_length3', label: 'Stage 3 Avg Length', color: '#EE6666' },
];

//#e0f7fa 浅蓝
//1a2539 深蓝
//#64ffda 青绿色
interface Location {
  location_id: number;
  lat: number;
  lng: number;
  length: number;
  width: number;
  height: number;
}

// 在stageConfigs下方新增重量配置
const weightConfig = {
  key: 'avg_weight',
  label: 'Average Weight',
  color: '#FFA500' // 橙色
};

// 在FishStats接口中新增weight_distribution
interface FishStats {
  location_info: Location;
  fish_count: number;
  species_ratio: Array<{ type: string; value: number }>;
  length_distribution: Array<{
    species: string;
    avg_length1: number;
    avg_length2: number;
    avg_length3: number;
  }>;
  weight_distribution: Array<{
    species: string;
    avg_weight: number;
  }>;
}

export default function UnderwaterSystem(){
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [fishStats, setFishStats] = useState<FishStats | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentUserId = 2;  

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:5000/api/user-locations?user_id=${currentUserId}`)
      .then(res => {
        setUserLocations(res.data.data || []);
      })
      .catch(err => {
        console.error('获取网箱列表失败', err);
        setUserLocations([]);
      })
      .finally(() => setLoading(false));
  }, [currentUserId]);

  useEffect(() => {
    if (selectedLocationId) {
      setLoading(true);
      axios.get(`http://localhost:5000/api/location-fish-stats?location_id=${selectedLocationId}`)
        .then(res => {
          const data = res.data.data;
          if (data) {
            // 确保各字段存在且不为undefined
            setFishStats({
              location_info: data.location_info || {
                location_id: 0, lat: 0, lng: 0, length: 0, width: 0, height: 0,
              },
              fish_count: data.fish_count || 0,
              species_ratio: data.species_ratio || [],
              length_distribution: data.length_distribution || [],
              weight_distribution: data.weight_distribution || [],
            });
          } else {
            // 如果接口没返回数据，重置为空结构
            setFishStats(null);
          }
        })
        .catch(err => {
          console.error('获取鱼类统计数据失败', err);
          setFishStats(null);
        })
        .finally(() => setLoading(false));
    } else {
      // 未选择时清空数据
      setFishStats(null);
    }
  }, [selectedLocationId]);

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      background: '#1a2539', // 调整为Login同款浅蓝背景
      minHeight: '100vh'
    }}>

      {/* 网箱选择 */}
      <Space style={{ marginBottom: '24px', width: '100%' }}>
        <Select
          placeholder="choose your cage"
          style={{ 
            width: 300,
            borderColor: '#2a3a5a', // 深色边框
            color: '#64ffda', // 青绿色文字
            backgroundColor: '#e0f7fa' 
          }}
          options={userLocations.map(loc => ({
            value: loc.location_id,
            label: `cage${loc.location_id}`
          }))}
          onChange={setSelectedLocationId}
          loading={loading}
          value={selectedLocationId}
          allowClear
        />
      </Space>

      {/* 网箱信息展示 */}
      {fishStats?.location_info && (
        <Card 
          title="cage main information" 
          style={{ marginBottom: '24px', borderColor: '#2a3a5a' }}
          headStyle={{ 
            background: '#0a1a2f', // 深蓝标题背景
            color: '#64ffda', // 青绿色标题
            borderBottom: '2px solid #2a3a5a',
            fontSize: '1.2rem'
          }}
          bodyStyle={{ 
            background:'#0a1a2f',
            color: '#64ffda' // 青绿色文字
          }}
        >
          <Space direction="vertical">
            <p>经纬度: {fishStats.location_info.lat.toFixed(6)}, {fishStats.location_info.lng.toFixed(6)}</p>
            <p>网箱尺寸 (L * W * H): {fishStats.location_info.length}m * {fishStats.location_info.width}m * {fishStats.location_info.height}m</p>
          </Space>
        </Card>
      )}

      {/* 鱼类数量占比 */}
      {fishStats && fishStats.species_ratio && fishStats.species_ratio.length > 0 && (
        <Card title="Percentage of fish species" 
          style={{ marginBottom: '24px', borderColor: '#2a3a5a' }}
          headStyle={{ 
            background: '#0a1a2f', // 深蓝标题背景
            color: '#64ffda', // 青绿色标题
            borderBottom: '2px solid #2a3a5a',
            fontSize: '1.2rem'
          }}
          bodyStyle={{ 
            background:'#0a1a2f',
            color: '#64ffda' // 青绿色文字
          }}
        >
          <div style={{ display:'flex', justifyContent:'center' }}>
            <PieChart width={600} height={400}>
              <Pie
                data={fishStats.species_ratio}
                dataKey="value"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {fishStats.species_ratio.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <RechartsLegend verticalAlign="top" height={36} />
            </PieChart>
          </div>
        </Card>
      )}

      {/* 鱼长度分布 */}
      {fishStats && fishStats.length_distribution && fishStats.length_distribution.length > 0 && (
        <Card 
          title="Distribution of fish length (average for each species)"
          headStyle={{
            background: '#0a1a2f',
            color: '#64ffda',
            borderBottom: '2px solid #2a3a5a',
            fontSize: '1.2rem'
          }}
          bodyStyle={{
            background: '#1a2539',
            color: '#64ffda',
            padding: '24px'
          }}
        >
          {stageConfigs.map(stage => (
            <div key={stage.key} style={{ marginBottom: '32px' }}>
              <h3 style={{ color: '#64ffda', marginBottom: '16px' }}>{stage.label}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fishStats.length_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5a" />
                  <XAxis dataKey="species" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={stage.key} fill={stage.color} name={stage.label} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </Card>
      )}

      {loading && <Spin style={{ marginTop: '24px', color: '#64ffda' }} />}
    </div>
  );
};
