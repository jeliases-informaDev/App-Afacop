import React, { useCallback, useEffect, useState } from 'react';
import { Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../shared/context/AuthContext';
import { Badge, Button, Card, Empty, Header, Input, Loading, Screen } from '../../shared/ui/ui';
import { C } from '../../shared/theme/theme';

export default function MapScreenWeb() {
  const { api } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filtered = data.filter(item => 
    !search || JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Screen refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[C.primary]} />}>
      <Header title="Mapa operativo" subtitle={data.length + ' clientes ubicados'} />
      <Card style={s.notice}>
        <MaterialCommunityIcons name="cellphone-marker" size={28} color={C.primary} />
        <Text style={s.noticeText}>
          El mapa interactivo completo está disponible en Android. Aquí puedes consultar ubicaciones y abrirlas en Google Maps.
        </Text>
      </Card>
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
  notice: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  noticeText: { flex: 1, fontSize: 12, color: C.muted, lineHeight: 18 },
  item: { gap: 12 },
  name: { fontSize: 15, fontWeight: '900', color: C.text },
  meta: { fontSize: 11, color: C.muted },
});