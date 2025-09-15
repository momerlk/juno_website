import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Dimensions,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Canvas, Path, Skia, Circle, LinearGradient, vec } from '@shopify/react-native-skia';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../redux/userSlice';
import * as api from '../../../../services/api';
import Loading from '../../../../components/Loading';
import ComingSoon from '../../../../components/ComingSoon';

const { width: screenWidth } = Dimensions.get('window');

type ProductAnalyticsResponse = {
  product_id: string;
  impressions: number;
  likes: number;
  dislikes: number;
  added_to_cart: number;
  purchases: number;
  impressions_graph_data: { x_value: string; y_value: number }[];
  likes_graph_data: { x_value: string; y_value: number }[];
  dislikes_graph_data: { x_value: string; y_value: number }[];
  added_to_cart_graph_data: { x_value: string; y_value: number }[];
  purchases_graph_data: { x_value: string; y_value: number }[];
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.analyticsCard}>
    <Text style={styles.analyticsLabel}>{label}</Text>
    <Text style={styles.analyticsValue}>{value}</Text>
  </View>
);

const AnalyticsChart = ({ title, data }: { title: string; data: { x_value: string; y_value: number }[] }) => {
  const dataPoints = useMemo(() => {
    const src = data;
    if (!src || !src.length) return [];

    const graphTop = 50;
    const graphHeight = 200;
    const graphPadding = 40;

    if (src.length === 1) {
      const y = graphTop + graphHeight / 2;
      return [
        { x: graphPadding, y, value: src[0].y_value },
        { x: screenWidth - graphPadding, y, value: src[0].y_value },
      ];
    }

    const minY = Math.min(...src.map((p) => p.y_value));
    const maxY = Math.max(...src.map((p) => p.y_value));
    const range = maxY - minY || 1;

    return src.map((p, i) => {
      const x = graphPadding + (i / Math.max(1, src.length - 1)) * (screenWidth - 2 * graphPadding);
      const yRatio = range === 0 ? 0.5 : (p.y_value - minY) / range;
      const y = graphTop + graphHeight * (1 - yRatio);
      return {
        x,
        y: Math.max(graphTop + 30, Math.min(graphTop + graphHeight - 30, y)),
        value: p.y_value,
      };
    });
  }, [data]);

  const path = useMemo(() => {
    const skiaPath = Skia.Path.Make();
    if (dataPoints.length === 0) return skiaPath;

    if (dataPoints.length < 2) {
      const y = dataPoints[0]?.y || 150;
      skiaPath.moveTo(40, y);
      skiaPath.lineTo(screenWidth - 40, y);
      return skiaPath;
    }

    skiaPath.moveTo(dataPoints[0].x, dataPoints[0].y);
    for (let i = 0; i < dataPoints.length - 1; i++) {
      const p0 = dataPoints[Math.max(0, i - 1)];
      const p1 = dataPoints[i];
      const p2 = dataPoints[i + 1];
      const p3 = dataPoints[Math.min(dataPoints.length - 1, i + 2)];

      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension * 0.166;
      const cp1y = p1.y + (p2.y - p0.y) * tension * 0.166;
      const cp2x = p2.x - (p3.x - p1.x) * tension * 0.166;
      const cp2y = p2.y - (p3.y - p1.y) * tension * 0.166;

      skiaPath.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    return skiaPath;
  }, [dataPoints]);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.graphContainer}>
        <Canvas style={styles.canvas}>
          <Path path={path} style="stroke" strokeWidth={3}>
            <LinearGradient start={vec(0, 0)} end={vec(screenWidth, 0)} colors={['#FF6B35', '#06FFA5']} />
          </Path>
        </Canvas>
      </View>
    </View>
  );
};

export default function ProductAnalytics({ route }: any) {
  const { productId } = route.params;
  const [analytics, setAnalytics] = useState<ProductAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (user.token) {
        const response = await api.SellerAnalytics.GetProductAnalytics(user.token, productId);
        if (response.ok && response.body) {
          setAnalytics(response.body);
        } else {
          setAnalytics(null);
        }
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [user.token, productId]);

  if (loading) return <Loading />;
  if (!analytics) return <ComingSoon />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Product Analytics</Text>
      </View>

      <View style={styles.analyticsContainer}>
        <View style={styles.analyticsRow}>
          <StatCard label="Impressions" value={analytics.impressions} />
          <StatCard label="Purchases" value={analytics.purchases} />
        </View>
        <View style={styles.analyticsRow}>
          <StatCard label="Likes" value={analytics.likes} />
          <StatCard label="Dislikes" value={analytics.dislikes} />
        </View>
        <View style={styles.analyticsRow}>
          <StatCard label="Added to Cart" value={analytics.added_to_cart} />
        </View>
      </View>

      <AnalyticsChart title="Impressions Over Time" data={analytics.impressions_graph_data} />
      <AnalyticsChart title="Purchases Over Time" data={analytics.purchases_graph_data} />
      <AnalyticsChart title="Likes Over Time" data={analytics.likes_graph_data} />
      <AnalyticsChart title="Dislikes Over Time" data={analytics.dislikes_graph_data} />
      <AnalyticsChart title="Added to Cart Over Time" data={analytics.added_to_cart_graph_data} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  analyticsRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  analyticsLabel: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 5,
  },
  analyticsValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  chartContainer: {
    marginTop: 20,
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  graphContainer: { height: 250, marginVertical: 10 },
  canvas: { flex: 1, backgroundColor: 'transparent' },
});
