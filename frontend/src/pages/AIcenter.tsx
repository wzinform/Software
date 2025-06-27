// src/AIcenter.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Layout, Row, Col, Card, Typography, Alert,Avatar, Table, Divider, Select, Spin } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { GlobeAltIcon,ChartBarIcon } from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './AIcenter.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const { Content } = Layout;
const { Text } = Typography;
const { Option } = Select;

// 站点类型
interface Station {
  name: string;
  lat: number;
  lon: number;
}
// 定义 WaterQuality 类型
interface WaterQuality {
  dissolved_oxygen?: number;
  turbidity?: number;
  pH?: number;
  temperature?: number;
  // 其他水文数据字段
}
// 天气数据类型
interface WeatherData {
  temperature: number;
  windspeed: number;
  winddirection: number;
}
interface WaterData {
  monitor_time: string; // 格式化为 ISO 字符串
  water_quality_level: string;
  temperature: number;
  pH: number;
  dissolved_oxygen: number;
  conductivity: number;
  turbidity: number;
  permanganate_index: number;
  ammonia_nitrogen: number;
  total_phosphorus: number;
  total_nitrogen: number;
  chlorophyll_a: string;
  algae_density: string;
  station_status: string;
}
const stationList: Station[] = [
  { name: '三河镇大桥', lat: 31.6262, lon: 117.2284 },
  { name: '三河镇新大桥', lat: 31.6285, lon: 117.2359 },
  { name: '三胜大队渡口', lat: 31.5824, lon: 117.2596 },
  { name: '兆河入湖区', lat: 31.4948, lon: 117.3007 },
  { name: '入湖口渡口', lat: 31.4889, lon: 117.3064 },
  { name: '双桥河入湖口', lat: 31.4901, lon: 117.3167 },
  { name: '同大排灌站', lat: 31.5847, lon: 117.2583 },
  { name: '希望桥', lat: 31.4926, lon: 117.2621 },
  { name: '庐江缺口', lat: 31.2397, lon: 117.2864 },
  { name: '忠庙', lat: 31.2535, lon: 117.2738 },
  { name: '新河入湖区', lat: 31.3795, lon: 117.3246 },
  { name: '施口', lat: 31.3014, lon: 117.2511 },
  { name: '柘皋大桥', lat: 31.4703, lon: 117.4139 },
  { name: '湖滨(老)', lat: 31.6327, lon: 117.2262 },
  { name: '石堆渡口', lat: 31.4954, lon: 117.2438 },
  { name: '裕溪口', lat: 31.5862, lon: 117.2883 },
  { name: '裕溪口(老)', lat: 31.5865, lon: 117.2904 },
  { name: '西半湖湖心', lat: 31.5837, lon: 117.2329 },
  { name: '通讯塔', lat: 31.5992, lon: 117.2756 },
  { name: '青台山大桥', lat: 31.4422, lon: 117.4568 },
  { name: '黄麓', lat: 31.5617, lon: 117.2830 },
  { name: '殷桥', lat: 31.4720, lon: 117.2338 },
  { name: '新管', lat: 31.4296, lon: 117.3087 },
  { name: '横江大桥', lat: 31.3851, lon: 117.3099 },
  { name: '浦口', lat: 31.5103, lon: 117.2648 },
  { name: '率水大桥', lat: 31.4207, lon: 117.3882 },
  { name: '篁墩', lat: 31.6092, lon: 117.1975 },
  { name: '丁埠大桥', lat: 31.3681, lon: 117.3166 },
  { name: '下楼公路桥', lat: 31.4793, lon: 117.3669 },
  { name: '东坪集', lat: 31.4980, lon: 117.1894 },
  { name: '东湖闸', lat: 31.4661, lon: 117.0320 },
  { name: '五河', lat: 33.1443, lon: 117.8794 },
  { name: '五里闸', lat: 31.5613, lon: 117.2581 },
  { name: '公路桥', lat: 31.4781, lon: 117.2440 },
  { name: '关咀', lat: 31.6225, lon: 117.1809 },
  { name: '刘寨村后', lat: 33.1227, lon: 116.2162 },
  { name: '利辛段', lat: 33.1221, lon: 116.2130 },
  { name: '巢湖西岸', lat: 31.6000, lon: 117.1000 } // 这个是你原示例中额外添加的
];

const data = [
  {
    id: 'fish-9527',
    species: 'moonfish',
    length: '10寸',
    weight: '5kg',
    time: '2024-02-01',
    temp: '0-7℃',
    wind: '东北风 96%',
    humid: '78%',
    level: '5级'
  }
];

const AIcenter: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<Station>(stationList[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [latestData, setLatestData] = useState<WaterQuality | null>(null); // 最新的水文数据
  const [loading, setLoading] = useState<boolean>(true); // 加载状态
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null); // 存储 AI 建议
  const [suggestionLoading, setSuggestionLoading] = useState<boolean>(false); // 加载状态
  const [suggestionError, setSuggestionError] = useState<string | null>(null); // 错误信息
  const [waterData, setWaterData] = useState<WaterData | null>(null); // 存储水文数据
  const [waterLoading, setWaterLoading] = useState<boolean>(false); // 加载状态
  const [waterError, setWaterError] = useState<string | null>(null); // 错误信息
  const chartData = {
    labels: ['温度', '光照', '溶氧', '盐度'],
    datasets: [
      {
        label: '当前数值',
        data: [22, 500, 6.5, 32],
        backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0'],
        borderColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true },
    },
  };

   const videoSources: string[] = ["/v1.mp4", "/v2.mp4", "/v3.mp4"];

  // 当前选中的视频索引（默认第0个）
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // 切换视频的函数（显式声明参数类型）
  const handleVideoChange = (index: number) => {
    setCurrentVideoIndex(index);
  };
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const { lat, lon } = selectedStation;
        const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: lat,
            longitude: lon,
            hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
            current_weather: true,
            timezone: 'auto'
          }
        });
        setWeather(res.data.current_weather);
      } catch (error) {
        console.error('获取天气失败:', error);
        setWeather(null);
      }
      setLoading(false);
    };
    fetchWeather();
  }, [selectedStation]);
  // 获取 AI 建议（调用后端 API）
  const fetchAiSuggestion = async () => {
    if (!weather) {
      setAiSuggestion('暂无气象数据，无法生成建议');
      return;
    }

    setSuggestionLoading(true);
    setSuggestionError(null); // 清除之前的错误
    try {
      // 调用后端 API 获取 AI 建议
      const response = await axios.post('http://localhost:5000/api/get-advice', {
        temperature: weather.temperature,
        windspeed: weather.windspeed,
        winddirection: weather.winddirection,
      });

      if (response.data && response.data.advice) {
        setAiSuggestion(response.data.advice);
      } else {
        setAiSuggestion('大模型未返回有效建议');
      }
    } catch (error) {
      console.error('获取 AI 建议失败:', error);
      setSuggestionError('获取 AI 建议失败，请稍后重试');
    } finally {
      setSuggestionLoading(false);
    }
  };
 

   // 根据选择的站点获取水文数据

    // 获取水文数据（调用后端 API）
  const fetchWaterData = async () => {
    setWaterLoading(true);
    setWaterError(null); // 清除之前的错误
    try {
      // 调用后端 API 获取水文数据
      const response = await axios.get(`http://localhost:5000/api/water-data?station=${selectedStation.name}`);
      
      if (response.data && response.data.code === 200) {
        setWaterData(response.data.data);
      } else {
        setWaterError(response.data.message || '获取水文数据失败');
      }
    } catch (error) {
      console.error('获取水文数据失败:', error);
      setWaterError('获取水文数据失败，请稍后重试');
    } finally {
      setWaterLoading(false);
    }
  };
  // 当天气数据更新时，自动获取 AI 建议
  useEffect(() => {
    if (weather) {
      fetchAiSuggestion();
    } else {
      setAiSuggestion(null);
    }
  }, [weather]);
  // 当站点选择变化时，重新获取天气和水文数据
  useEffect(() => {
    setLoading(true);
    setWeather(null);
    setAiSuggestion(null);
    setSuggestionLoading(false);
    setSuggestionError(null);
    setWaterData(null);
    setWaterLoading(false);
    setWaterError(null);

    const fetchInitialData = async () => {
      try {
        // 获取天气数据
        const { lat, lon } = selectedStation;
        const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude: lat,
            longitude: lon,
            hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
            current_weather: true,
            timezone: 'auto'
          }
        });
        setWeather(res.data.current_weather);
      } catch (error) {
        console.error('获取天气失败:', error);
        setWeather(null);
      } finally {
        setLoading(false);
      }

      // 获取 AI 建议
      if (weather) {
        fetchAiSuggestion();
      }

      // 获取水文数据
      fetchWaterData();
    };

    fetchInitialData();
  }, [selectedStation]);
  return (
    <Layout className="dashboard-container">
      <Content className="main-content">
        <Row gutter={[16, 16]}>
          <Col span={6}>
           <Card title="实时监控" bordered={false} className="realtime-card">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <div className="sensor-item">
                    <EnvironmentOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div className="sensor-info">
                      <Text strong>环境得分</Text>
                      <Text>计算中...</Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>


<Col span={12}>
  <Card title="识别结果" bordered={false} className="result-card">

      {/* 视频区域（左侧） */}
   <div>
      {/* 视频区域 */}
      <div style={{ position: "relative", background: "#000" }}>
        <video
          width="100%"
          height="auto"
          controls
          src={videoSources[currentVideoIndex]} // 动态绑定当前视频
        />
        <Text
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            color: "#fff",
          }}
        >
          识别效果
        </Text>
      </div>

      {/* 视频切换按钮（一行） */}
      <div
        style={{
          display: "flex", // 水平排列
          justifyContent: "center", // 居中
          gap: "8px", // 按钮间距
          marginTop: "16px",
        }}
      >
        {videoSources.map((_, index) => (
          <button
            key={index}
            onClick={() => handleVideoChange(index)}
            style={{
              padding: "8px 16px",
              backgroundColor: index === currentVideoIndex ? "#007bff" : "#ccc", // 当前选中的按钮高亮
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            视频{index + 1}
          </button>
        ))}
      </div>
    </div>





    <Divider />

    <Table
      dataSource={data}
      columns={[
        { title: '编号', dataIndex: 'id', key: 'id' },
        { title: '鱼种', dataIndex: 'species', key: 'species' },
        { title: '体长', dataIndex: 'length', key: 'length' },
        { title: '体重', dataIndex: 'weight', key: 'weight' }

      ]}
      pagination={false}
      rowKey="id"
    />
  </Card>
</Col>


          <Col span={6}>
  <Card title="AI决策" className="status-card">

    {/* 选择站点 */}
    <div style={{ marginBottom: '8px' }}>
      <Text strong>选择站点：</Text>
      <Select
        style={{ width: '100%' }}
        value={selectedStation.name}
        onChange={(value) => {
          const station = stationList.find(s => s.name === value);
          if (station) {
            setSelectedStation(station);
          }
        }}
      >
        {stationList.map((s) => (
          <Option key={s.name} value={s.name}>{s.name}</Option>
        ))}
      </Select>
    </div>

    <Divider />

    {/* 气象数据 */}
    <Text strong>气象数据：</Text>
    {loading ? <Spin /> : (
      weather ? (
        <div style={{ marginTop: '8px' }}>
          <Text>温度：{weather.temperature} ℃</Text><br />
          <Text>风速：{weather.windspeed} km/h</Text><br />
          <Text>风向：{weather.winddirection}°</Text><br />
        </div>
      ) : <Text>暂无数据</Text>
    )}

    {/* 新增 水文数据展示
    <div style={{ 
      backgroundColor: '#1a2539',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '24px',
      color: '#64ffda'
    }}>
      <h3 style={{ 
        fontSize: '1.2rem',
        marginBottom: '16px'
      }}>      
        <ChartBarIcon style={{ width: '40px', height: '40px' }} className="text-blue-50" /> 
        实时水文数据
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '溶解氧', value: latestData?.dissolved_oxygen || 0, unit: 'mg/L' },
          { label: '浊度', value: latestData?.turbidity || 0, unit: 'NTU' },
          { label: 'pH值', value: latestData?.pH || 0 },
          { label: '水温', value: latestData?.temperature || 0, unit: '°C' }
        ].map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #2a3a5a'
          }}>
            <span style={{ color: '#7f8ca3' }}>{item.label}</span>
            <span style={{ color: '#64ffda' }}>
              {item.value}{item.unit || ''}
            </span>
          </div>
          
        ))}
      </div>
    </div>  */}
     {/* 水文数据 */}
              <Divider />
              <Text strong>水文数据：</Text>
              {waterLoading ? (
                <Spin style={{ marginLeft: '8px' }} />
              ) : waterError ? (
                <Alert message={waterError} type="error" style={{ marginTop: '8px' }} />
              ) : waterData ? (
                <div style={{ marginTop: '8px' }}>
                  <Text>溶解氧：{waterData.dissolved_oxygen} mg/L</Text><br />
                  <Text>浊度：{waterData.turbidity} NTU</Text><br />
                  <Text>pH：{waterData.pH}</Text><br />
                  <Text>温度：{waterData.temperature} ℃</Text><br />
                </div>
              ) : (
                <Text style={{ marginTop: '8px', color: 'gray' }}>暂无水文数据</Text>
              )}
     {/* AI 建议 */}
              <Divider />
              <Text strong>养殖建议：</Text>
              {suggestionLoading ? (
                <Spin style={{ marginLeft: '8px' }} />
              ) : suggestionError ? (
                <Alert message={suggestionError} type="error" style={{ marginTop: '8px' }} />
              ) : aiSuggestion ? (
                <Text style={{ marginTop: '8px', color: 'blue' }}>
                  {aiSuggestion}
                </Text>
              ) : (
                <Text style={{ marginTop: '8px', color: 'gray' }}>暂无建议</Text>
              )}
 {/* 水文数据展示
              <div style={{ 
                backgroundColor: '#1a2539',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '24px',
                color: '#64ffda'
              }}>
                <h3 style={{ 
                  fontSize: '1.2rem',
                  marginBottom: '16px'
                }}>      
                  <ChartBarIcon style={{ width: '40px', height: '40px' }} className="text-blue-50" /> 
                  实时水文数据
                </h3>

                {loading ? (
                  <Spin />
                ) : latestData ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: '溶解氧', value: latestData.dissolved_oxygen || 0, unit: 'mg/L' },
                      { label: '浊度', value: latestData.turbidity || 0, unit: 'NTU' },
                      { label: 'pH值', value: latestData.pH || 0 },
                      { label: '水温', value: latestData.temperature || 0, unit: '°C' }
                    ].map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid #2a3a5a'
                      }}>
                        <span style={{ color: '#7f8ca3' }}>{item.label}</span>
                        <span style={{ color: '#64ffda' }}>
                          {item.value}{item.unit || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>暂无数据</div>
                )}
              </div> */}
  </Card>
</Col>
</Row>
       
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col span={24}>
            <Card title="监控地图" bordered={false} className="map-card">
              <MapContainer center={[selectedStation.lat, selectedStation.lon]} zoom={8} style={{ height: '400px', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                />
                <Marker position={[selectedStation.lat, selectedStation.lon]}>
                  <Popup>{selectedStation.name}</Popup>
                </Marker>
              </MapContainer>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default AIcenter;