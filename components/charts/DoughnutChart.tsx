import React, { useEffect, useRef } from 'react';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
    labels: string[];
    data: number[];
    colors: string[];
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ labels, data, colors }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: '割合',
                                data: data,
                                backgroundColor: colors,
                                borderColor: '#ffffff',
                                borderWidth: 2,
                                hoverOffset: 8,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false, // We'll create a custom legend outside
                            },
                            tooltip: {
                                enabled: true,
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed !== null) {
                                            label += context.parsed.toFixed(1) + '%';
                                        }
                                        return label;
                                    }
                                }
                            },
                        },
                        cutout: '60%',
                    },
                });
            }
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [labels, data, colors]);

    return <canvas ref={chartRef} />;
};

export default DoughnutChart;
