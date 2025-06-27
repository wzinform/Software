import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as echarts from 'echarts';
import type { EChartsType,EChartsOption } from 'echarts';

// 定义数据类型接口
interface DatabaseStats {
  databaseType: string;
  totalRequests: number;
  successRequests: number;
  responseTime: string;
}

interface DataTypeStats {
  type: string;
  count: number;
  percentage: number;
}

interface HardwareStats {
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
}

interface DataVolumeStats {
  current: number;
  capacity: number;
  unit: string;
}

// 删除这一行及其注释
// // 添加ECharts类型导入
// import type { EChartsType } from 'echarts';

export default function DataCenter() {
  // 状态定义
  const [processingCount, setProcessingCount] = useState<number>(999);
  const [dataVolume, setDataVolume] = useState<DataVolumeStats>({
    current: 1000,
    capacity: 1500,
    unit: 'T'
  });
  const [hardwareStats, setHardwareStats] = useState<HardwareStats>({
    cpuUsage: 45,
    memoryUsage: 38,
    gpuUsage: 62
  });
  // 在状态定义中添加结构化数据
  const [dataTypeStats, setDataTypeStats] = useState<DataTypeStats[]>([
    { type: 'TXT', count: 24, percentage: 15 },
    { type: 'H.264', count: 48, percentage: 30 },
    { type: '4CIF', count: 32, percentage: 20 },
    { type: '1080p', count: 56, percentage: 35 },
    { type: 'JSON', count: 18, percentage: 12 }, // 新增：结构化数据 JSON
    { type: 'XML', count: 10, percentage: 8 },   // 新增：结构化数据 XML
    { type: 'CSV', count: 15, percentage: 10 }   // 新增：结构化数据 CSV
  ]);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats>({
    databaseType: 'MySQL, HBase',
    totalRequests: 567890,
    successRequests: 567890,
    responseTime: '0.1s'
  });
  // 在设备状态接口中添加新字段
  interface DeviceStats {
    id: string;
    type: string;
    size: string;
    avgTransmissionTime: string; // 新增：平均传输时长
    avgProcessingTime: string;   // 新增：平均处理时长
  }
  
  // 修改 useState 初始化，添加新字段
  const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([
    { id: 'video-1', type: 'H.264', size: '4Mb', avgTransmissionTime: '02:45', avgProcessingTime: '00:02' },
    { id: 'video-2', type: '4CIF', size: '128Kb', avgTransmissionTime: '01:30', avgProcessingTime: '00:01' },
    { id: 'video-3', type: 'H.264', size: '10Kb', avgTransmissionTime: '00:45', avgProcessingTime: '00:01' },
    { id: 'holder-1', type: 'H.264', size: '1kb', avgTransmissionTime: '00:15', avgProcessingTime: '00:01' },
    { id: 'sonar-1', type: 'TXT', size: '10kb', avgTransmissionTime: '00:30', avgProcessingTime: '00:01' },
    { id: 'sensor-1', type: 'TXT', size: '2kb', avgTransmissionTime: '00:10', avgProcessingTime: '00:01' },
    { id: 'meteor-1', type: 'TXT', size: '500b', avgTransmissionTime: '00:05', avgProcessingTime: '00:01' }
  ]);
  
  // 模拟获取数据
  useEffect(() => {
    // 在实际应用中，这里应该从后端API获取数据
    // 这里仅做模拟
    const timer = setInterval(() => {
      // 随机更新一些数据以模拟实时变化
      setProcessingCount(Math.floor(Math.random() * 100) + 900);
      setHardwareStats(prev => ({
        cpuUsage: Math.min(100, Math.max(0, prev.cpuUsage + (Math.random() * 10 - 5))),
        memoryUsage: Math.min(100, Math.max(0, prev.memoryUsage + (Math.random() * 8 - 4))),
        gpuUsage: Math.min(100, Math.max(0, prev.gpuUsage + (Math.random() * 12 - 6)))
      }));
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);
  
  // 添加地图DOM引用
  // 修改useRef的类型定义
  const mapRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<EChartsType | null>(null);
  
  // 初始化地图
  useEffect(() => {
    // 动态加载中国地图数据
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then(response => response.json())
      .then(chinaJson => {
        // 注册地图数据
        echarts.registerMap('china', chinaJson);
        
        if (mapRef.current) {
          // 如果已经有实例，先销毁
          if (chartInstance.current) {
            chartInstance.current.dispose();
          }
          
          // 初始化ECharts实例
          const chart = echarts.init(mapRef.current);
          chartInstance.current = chart;
          
          const option: EChartsOption= {
            backgroundColor: '#061325',
            title: {
              text: '数据中心分布',
              left: 'center',
              top: 10,
              textStyle: {
                color: '#64ffda'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: '{b}: {c}'
            },
            visualMap: [  // ✅ 改成数组
              {
                min: 0,
                max: 100,
                left: 'left',
                bottom: 'bottom',
                calculable: true,
                seriesIndex: [0],
                inRange: {
                  color: ['#0a4c95', '#1e3a5f']
                },
                textStyle: {
                  color: '#ccd6f6'
                }
              }
            ],
            geo: {
              map: 'china',
              roam: false,
              zoom: 1.2,
              label: {
                show: true,
                color: '#ccd6f6'
              },
              itemStyle: {
                areaColor: '#0a4c95',
                borderColor: '#64ffda',
                borderWidth: 1
              },
              emphasis: {
                label: {
                  color: '#ffffff'
                },
                itemStyle: {
                  areaColor: '#1989fa'
                }
              }
            },
            series: [
              {
                name: '数据中心',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: [
                  { name: '北京', value: [116.405285, 39.904989, 100] },
                  { name: '上海', value: [121.472644, 31.231706, 80] },
                  { name: '广州', value: [113.280637, 23.125178, 70] },
                  { name: '成都', value: [104.065735, 30.659462, 60] },
                  { name: '杭州', value: [120.153576, 30.287459, 50] }
                ],
                symbolSize: 15,
                label: {
                  show: true,
                  formatter: '{b}',
                  position: 'right',
                  color: '#ccd6f6'
                },
                itemStyle: {
                  color: function (params: any) {
                    const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#FFEB3B'];
                    return colors[params.dataIndex % colors.length];
                  },
                  shadowBlur: 10,
                  shadowColor: 'rgba(120, 120, 120, 0.5)'
                },
                emphasis: {
                  itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 1
                  }
                }
              }
            ]
          };
          
          
          // 使用刚指定的配置项和数据显示图表
          chart.setOption(option);
          
          // 响应窗口大小变化
          window.addEventListener('resize', () => {
            chart.resize();
          });
        }
      });
    
    // 只保留一个清理函数
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        window.removeEventListener('resize', () => {});
      }
    };
  }, []);
  
  // 渲染中国地图上的数据中心分布
  const renderMap = () => (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '500px', // 增加地图高度，使其更大更清晰
      backgroundColor: '#061325',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      overflow: 'hidden'
    }}>
      {/* ECharts地图容器 */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );

  // 渲染数据类型统计
  const renderDataTypeStats = () => (
    <div style={{
      backgroundColor: '#0a1a2f',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      height: '100%'
    }}>      
      <h3 style={{ color: '#64ffda', margin: '0 0 15px 0', textAlign: 'center' }}>数据类型统计</h3>
      
      {/* 分类标题 */}
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ color: '#ccd6f6', margin: '0 0 5px 0' }}>媒体数据</h4>
      </div>
      
      {/* 媒体数据类型 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {dataTypeStats.slice(0, 4).map((stat, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#ccd6f6', width: '60px' }}>{stat.type}</span>
            <div style={{ flex: 1, height: '12px', backgroundColor: '#0d2b45', borderRadius: '6px', overflow: 'hidden', margin: '0 10px' }}>
              <div style={{
                height: '100%',
                width: `${stat.percentage}%`,
                backgroundColor: getColorForIndex(index),
                borderRadius: '6px'
              }} />
            </div>
            <span style={{ color: '#ccd6f6', width: '40px', textAlign: 'right' }}>{stat.count}</span>
          </div>
        ))}
      </div>
      
      {/* 结构化数据标题 */}
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ color: '#ccd6f6', margin: '0 0 5px 0' }}>结构化数据</h4>
      </div>
      
      {/* 结构化数据类型 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {dataTypeStats.slice(4).map((stat, index) => (
          <div key={index + 4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#ccd6f6', width: '60px' }}>{stat.type}</span>
            <div style={{ flex: 1, height: '12px', backgroundColor: '#0d2b45', borderRadius: '6px', overflow: 'hidden', margin: '0 10px' }}>
              <div style={{
                height: '100%',
                width: `${stat.percentage}%`,
                backgroundColor: getColorForIndex(index + 4),
                borderRadius: '6px'
              }} />
            </div>
            <span style={{ color: '#ccd6f6', width: '40px', textAlign: 'right' }}>{stat.count}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 渲染硬件信息统计
  const renderHardwareStats = () => (
    <div style={{
      backgroundColor: '#0a1a2f',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      height: '100%'
    }}>      
      <h3 style={{ color: '#64ffda', margin: '0 0 15px 0', textAlign: 'center' }}>硬件信息统计</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: '#ccd6f6' }}>CPU使用状态</span>
            <span style={{ color: '#64ffda' }}>{Math.round(hardwareStats.cpuUsage)}%</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#0d2b45', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${hardwareStats.cpuUsage}%`,
              backgroundColor: '#ff4757',
              borderRadius: '4px'
            }} />
          </div>
        </div>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: '#ccd6f6' }}>内存使用状态</span>
            <span style={{ color: '#64ffda' }}>{Math.round(hardwareStats.memoryUsage)}%</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#0d2b45', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${hardwareStats.memoryUsage}%`,
              backgroundColor: '#4CAF50',
              borderRadius: '4px'
            }} />
          </div>
        </div>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: '#ccd6f6' }}>GPU使用状态</span>
            <span style={{ color: '#64ffda' }}>{Math.round(hardwareStats.gpuUsage)}%</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#0d2b45', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${hardwareStats.gpuUsage}%`,
              backgroundColor: '#2196F3',
              borderRadius: '4px'
            }} />
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染数据总量
  // 渲染数据总量
  const renderDataVolume = () => (
    <div style={{
      backgroundColor: '#0a1a2f',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%'
    }}>      
      <h3 style={{ color: '#64ffda', margin: '0 0 15px 0' }}>数据总量</h3>
      
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        {/* 外圈 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '8px solid #0d2b45'
        }} />
        
        {/* 进度条 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '8px solid transparent',
          borderTopColor: '#64ffda',
          borderRightColor: '#64ffda',
          transform: `rotate(${(dataVolume.current / dataVolume.capacity) * 360}deg)`,
          transition: 'transform 0.5s ease'
        }} />
        
        {/* 中心文字 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ color: '#64ffda', fontSize: '24px', fontWeight: 'bold' }}>{dataVolume.current}</div>
          <div style={{ color: '#ccd6f6', fontSize: '12px' }}>总容量: {dataVolume.capacity}{dataVolume.unit}</div>
        </div>
      </div>
      
      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <div style={{ color: '#ccd6f6', fontSize: '14px' }}>当前: {dataVolume.current}{dataVolume.unit}</div>
        <div style={{ color: '#ccd6f6', fontSize: '14px' }}>剩余: {dataVolume.capacity - dataVolume.current}{dataVolume.unit}</div>
      </div>
    </div>
  );

  // 渲染进程总量
  const renderProcessCount = () => (
    <div style={{
      backgroundColor: '#0a1a2f',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%'
    }}>      
      <h3 style={{ color: '#64ffda', margin: '0 0 15px 0' }}>进程总量</h3>
      
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        backgroundColor: '#0d2b45',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 20px rgba(100,255,218,0.2)'
      }}>
        <span style={{ color: '#64ffda', fontSize: '32px', fontWeight: 'bold' }}>{processingCount}</span>
      </div>
    </div>
  );

  // 渲染数据库交互统计
  const renderDatabaseStats = () => (
    <div style={{
      backgroundColor: '#0a1a2f',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      height: '100%'
    }}>      
      <h3 style={{ color: '#64ffda', margin: '0 0 15px 0', textAlign: 'center' }}>数据库交互统计</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64ffda' }} />
          <span style={{ color: '#ccd6f6' }}>数据库: {databaseStats.databaseType}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64ffda' }} />
          <span style={{ color: '#ccd6f6' }}>查询次数: {databaseStats.totalRequests.toLocaleString()}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64ffda' }} />
          <span style={{ color: '#ccd6f6' }}>成功次数: {databaseStats.successRequests.toLocaleString()}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64ffda' }} />
          <span style={{ color: '#ccd6f6' }}>查询时间: {databaseStats.responseTime}</span>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button style={{
          backgroundColor: 'rgba(100,255,218,0.1)',
          border: '1px solid rgba(100,255,218,0.3)',
          color: '#64ffda',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          访问数据服务系统
        </button>
      </div>
    </div>
  );

  // 渲染传感器信息表格
  const renderDeviceTable = () => (
    <div style={{
      backgroundColor: '#0a1a2f',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      height: '100%',
      overflow: 'auto'
    }}>      
      <h3 style={{ color: '#64ffda', margin: '0 0 15px 0', textAlign: 'center' }}>传感器信息</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ color: '#64ffda', padding: '8px', textAlign: 'left', borderBottom: '1px solid #1e3a5f' }}>设备</th>
            <th style={{ color: '#64ffda', padding: '8px', textAlign: 'left', borderBottom: '1px solid #1e3a5f' }}>编号</th>
            <th style={{ color: '#64ffda', padding: '8px', textAlign: 'left', borderBottom: '1px solid #1e3a5f' }}>类型</th>
            <th style={{ color: '#64ffda', padding: '8px', textAlign: 'left', borderBottom: '1px solid #1e3a5f' }}>大小</th>
            <th style={{ color: '#64ffda', padding: '8px', textAlign: 'left', borderBottom: '1px solid #1e3a5f' }}>平均传输时长</th>
            <th style={{ color: '#64ffda', padding: '8px', textAlign: 'left', borderBottom: '1px solid #1e3a5f' }}>平均处理时长</th>
          </tr>
        </thead>
        <tbody>
          {deviceStats.map((device, index) => (
            <tr key={index}>
              <td style={{ color: '#ccd6f6', padding: '8px', borderBottom: '1px solid #1e3a5f' }}>{device.id.split('-')[0]}</td>
              <td style={{ color: '#ccd6f6', padding: '8px', borderBottom: '1px solid #1e3a5f' }}>{device.id}</td>
              <td style={{ color: '#ccd6f6', padding: '8px', borderBottom: '1px solid #1e3a5f' }}>{device.type}</td>
              <td style={{ color: '#ccd6f6', padding: '8px', borderBottom: '1px solid #1e3a5f' }}>{device.size}</td>
              <td style={{ color: '#ccd6f6', padding: '8px', borderBottom: '1px solid #1e3a5f' }}>{device.avgTransmissionTime}</td>
              <td style={{ color: '#ccd6f6', padding: '8px', borderBottom: '1px solid #1e3a5f' }}>{device.avgProcessingTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // 获取不同索引的颜色
  const getColorForIndex = (index: number): string => {
    const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#FFEB3B'];
    return colors[index % colors.length];
  };

  // 渲染雷达图
  const renderRadarChart = () => (
    <div style={{
      backgroundColor: '#0a1a2f',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>      
      <h3 style={{ color: '#64ffda', margin: '0 0 15px 0', textAlign: 'center' }}>数据类型分析</h3>
      
      {/* 简单的雷达图模拟 */}
      <div style={{ position: 'relative', width: '200px', height: '200px' }}>
        {/* 五边形背景 */}
        <svg width="200" height="200" viewBox="0 0 200 200">
          <polygon 
            points="100,10 190,75 160,180 40,180 10,75" 
            fill="none" 
            stroke="#1e3a5f" 
            strokeWidth="1"
          />
          <polygon 
            points="100,40 160,85 140,150 60,150 40,85" 
            fill="none" 
            stroke="#1e3a5f" 
            strokeWidth="1"
          />
          <polygon 
            points="100,70 130,95 120,120 80,120 70,95" 
            fill="none" 
            stroke="#1e3a5f" 
            strokeWidth="1"
          />
          
          {/* 数据多边形 */}
          <polygon 
            points="100,20 170,80 145,160 55,160 30,80" 
            fill="rgba(100,255,218,0.2)" 
            stroke="#64ffda" 
            strokeWidth="2"
          />
          
          {/* 轴线 */}
          <line x1="100" y1="10" x2="100" y2="180" stroke="#1e3a5f" strokeWidth="1" />
          <line x1="10" y1="75" x2="190" y2="75" stroke="#1e3a5f" strokeWidth="1" />
          <line x1="40" y1="180" x2="160" y2="10" stroke="#1e3a5f" strokeWidth="1" />
          <line x1="160" y1="180" x2="40" y2="10" stroke="#1e3a5f" strokeWidth="1" />
          
          {/* 数据点 */}
          <circle cx="100" cy="20" r="4" fill="#64ffda" />
          <circle cx="170" cy="80" r="4" fill="#64ffda" />
          <circle cx="145" cy="160" r="4" fill="#64ffda" />
          <circle cx="55" cy="160" r="4" fill="#64ffda" />
          <circle cx="30" cy="80" r="4" fill="#64ffda" />
        </svg>
        
        {/* 轴标签 */}
        <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', color: '#ccd6f6', fontSize: '12px' }}>处理量</div>
        <div style={{ position: 'absolute', top: '50%', right: '0', transform: 'translateY(-50%)', color: '#ccd6f6', fontSize: '12px' }}>速度</div>
        <div style={{ position: 'absolute', bottom: '10%', right: '25%', transform: 'translateY(-50%)', color: '#ccd6f6', fontSize: '12px' }}>质量</div>
        <div style={{ position: 'absolute', bottom: '10%', left: '25%', transform: 'translateY(-50%)', color: '#ccd6f6', fontSize: '12px' }}>成本</div>
        <div style={{ position: 'absolute', top: '50%', left: '0', transform: 'translateY(-50%)', color: '#ccd6f6', fontSize: '12px' }}>效率</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#64ffda', textAlign: 'center', margin: '0' }}>数据中心监控面板</h2>
        <p style={{ color: '#ccd6f6', textAlign: 'center', margin: '10px 0 0 0' }}>海洋牧场大数据可视化平台</p>
      </div>
      
      {/* 第一行：数据总量和进程总量 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {renderProcessCount()}
          {renderDataVolume()}
        </div>
        {renderHardwareStats()}
      </div>
      
      {/* 第二行：中国地图 */}
      <div style={{ marginBottom: '20px' }}>
        {renderMap()}
      </div>
      
      {/* 第三行：数据类型统计、雷达图和数据库交互统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {renderDataTypeStats()}
        {renderRadarChart()}
        {renderDatabaseStats()}
      </div>
      
      {/* 第四行：传感器信息表格 */}
      <div>
        {renderDeviceTable()}
      </div>
    </div>
  );
}