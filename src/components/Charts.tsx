import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { getUIText } from '../i18n/uiTexts';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ChartProps {
  lang?: string;
  seed?: string; // ✅ Added seed for consistent randomization
}

export const RadarChart = ({ lang = 'KO', seed }: ChartProps) => {
  const t = (key: string) => getUIText(lang, key);

  // Simple hash function to generate a number from a string
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const generateData = (seedStr: string, offset: number) => {
    if (!seedStr) return [50, 50, 50, 50, 50];
    const hash = getHash(seedStr + offset);
    return [
      (hash % 70) + 30,
      ((hash >> 2) % 70) + 30,
      ((hash >> 4) % 70) + 30,
      ((hash >> 6) % 70) + 30,
      ((hash >> 8) % 70) + 30,
    ];
  };

  const labels = [
    t('chartLabelPride'), 
    t('chartLabelIgnorance'), 
    t('chartLabelInsight'), 
    t('chartLabelFrivolous'), 
    t('chartLabelExperience')
  ];

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: t('chartLabelWisdom'),
        data: seed ? generateData(seed, 100) : [20, 95, 90, 10, 85],
        backgroundColor: 'rgba(93, 109, 95, 0.2)',
        borderColor: '#5D6D5F',
        borderWidth: 2,
      },
      {
        label: t('chartLabelKnowledge'),
        data: seed ? generateData(seed, 200) : [90, 10, 40, 95, 20],
        backgroundColor: 'rgba(212, 163, 115, 0.2)',
        borderColor: '#D4A373',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: {
      r: { beginAtZero: true, max: 100, ticks: { display: false } },
    },
  };

  return (
    <div className="relative w-full max-w-[600px] mx-auto h-[300px] max-h-[350px]">
      <Radar data={chartData} options={options} />
    </div>
  );
};

export const BarChart = ({ lang = 'KO' }: ChartProps) => {
  const t = (key: string) => getUIText(lang, key);

  const data = {
    labels: [t('chartLabelLeaderPath'), t('chartLabelMemberPath')],
    datasets: [
      {
        label: t('chartLabelRisk'),
        data: [20, 95],
        backgroundColor: '#B07D62',
      },
      {
        label: t('chartLabelSurvival'),
        data: [98, 5],
        backgroundColor: '#5D6D5F',
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
  };

  return (
    <div className="relative w-full max-w-[600px] mx-auto h-[300px] max-h-[350px]">
      <Bar data={data} options={options} />
    </div>
  );
};
