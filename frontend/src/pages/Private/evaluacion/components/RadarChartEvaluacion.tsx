import { useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import type { Evaluacion } from "../../../../types/Evaluacion";

interface RadarChartEvaluacionProps {
  evaluacion: Evaluacion;
}

export const RadarChartEvaluacion = ({
  evaluacion,
}: RadarChartEvaluacionProps) => {
  const chartData = useMemo(() => {
    return evaluacion.rubros.map((er) => ({
      rubro: er.rubro?.rubro || "Rubro",
      calificacion: Number(er.rubro?.calificacion || 0),
    }));
  }, [evaluacion.rubros]);

  const chart = useChart({
    data: chartData,
    series: [{ name: "calificacion", color: "teal.solid" }],
  });

  if (chartData.length < 3) {
    return (
      <Box textAlign="center" py="4">
        <Text fontSize="sm" color="gray.400">
          Se necesitan al menos 3 rubros para mostrar el gráfico radar.
        </Text>
      </Box>
    );
  }

  return (
    <Chart.Root maxW="400px" chart={chart} mx="auto">
      <RadarChart data={chart.data}>
        <PolarGrid stroke={chart.color("border")} />
        <PolarAngleAxis dataKey={chart.key("rubro")} />
        <PolarRadiusAxis />
        {chart.series.map((item) => (
          <Radar
            isAnimationActive={false}
            key={item.name}
            name={item.name}
            dataKey={chart.key(item.name)}
            stroke={chart.color(item.color)}
            fill={chart.color(item.color)}
            fillOpacity={0.2}
          />
        ))}
      </RadarChart>
    </Chart.Root>
  );
};
