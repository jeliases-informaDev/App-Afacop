import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../shared/context/AuthContext';
import { Badge, Button, Card, Empty, Header, Input, Loading, Screen } from '../../shared/ui/ui';
import { C } from '../../shared/theme/theme';

export default function MapScreenWeb() {
  const { api } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await api('/api/campo/ruta-hoy');
      const clientesRuta = response.data?.rutas_clientes?.map((item: any) => ({
        ...item.cliente,
        estado_gestion: item.estado_visita
      })) || [];
      setData(clientesRuta);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        } catch (e) {
          console.log("No se pudo obtener la ubicación", e);
        }
      }
    })();
  }, []);

  const filtered = data.filter(item => 
    !search || JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  const centerLat = userLocation?.latitude || data[0]?.latitud || -12.0464;
  const centerLng = userLocation?.longitude || data[0]?.longitud || -77.0428;

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #F4F7FD; }
        #map { height: 100%; width: 100%; }
        .user-marker { font-size: 20px; text-align: center; line-height: 20px; text-shadow: 0 0 5px rgba(255,255,255,0.8); }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${centerLat}, ${centerLng}], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        ${userLocation ? `
          var userIcon = L.divIcon({className: 'user-marker', html: '🔵', iconSize: [20, 20]});
          L.marker([${userLocation.latitude}, ${userLocation.longitude}], {icon: userIcon, zIndexOffset: 1000}).addTo(map)
            .bindPopup('<b>Tu ubicación actual</b>');
        ` : ''}

        var clients = ${JSON.stringify(data || [])};
        clients.forEach(function(item) {
          if (item.latitud && item.longitud) {
            var isPending = item.estado_gestion === 'PENDIENTE';
            var circle = L.circleMarker([item.latitud, item.longitud], {
              color: isPending ? '#F59E0B' : '#10B981',
              fillColor: isPending ? '#FBBF24' : '#34D399',
              fillOpacity: 0.9,
              radius: 9,
              weight: 2
            }).addTo(map);
            var name = item.nombre || item.nombres || 'Cliente #' + (item.id_cliente || item.id);
            circle.bindPopup('<b>' + name + '</b><br>Estado: ' + (item.estado_gestion || item.estado));
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[C.primary]} />}>
      <Header title="Mapa operativo" subtitle={data.length + ' clientes ubicados'} />
      
      <View style={s.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Mapa de clientes"
          />
        ) : (
          <WebView source={{ html: mapHtml }} style={{ flex: 1 }} scrollEnabled={false} />
        )}
      </View>

      <Input value={search} onChangeText={setSearch} placeholder="Buscar cliente, número de documento o distrito…" />
      
      {loading ? (
        <Loading />
      ) : filtered.length ? (
        filtered.map((item: any, index) => (
          <Card key={item.id_cliente || item.id || index}>
            <View style={s.item}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.name}>
                  {item.nombre || item.nombres || 'Cliente #' + (item.id_cliente || item.id)}
                </Text>
                <Text style={s.meta}>
                  Doc: {item.numero_documento || 'No registrado'} · {item.distrito || 'Sin distrito'}
                </Text>
                <Badge status={item.estado_gestion || item.estado} />
              </View>
              {item.latitud && item.longitud ? (
                <Button
                  title="Abrir mapa"
                  kind="ghost"
                  icon="map-marker"
                  onPress={() => Linking.openURL('https://www.google.com/maps?q=' + item.latitud + ',' + item.longitud)}
                />
              ) : null}
            </View>
          </Card>
        ))
      ) : (
        <Empty title="No hay clientes ubicados" />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  mapContainer: {
    height: 350,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface2,
  },
  item: { gap: 12 },
  name: { fontSize: 15, fontWeight: '900', color: C.text },
  meta: { fontSize: 11, color: C.muted },
});