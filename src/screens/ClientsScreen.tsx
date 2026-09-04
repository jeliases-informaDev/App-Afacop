import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../AuthContext";
import { Badge, Card, Empty, Input, Loading, Screen } from "../ui";
import { C, money } from "../theme";

const filters = [
  { key: "TODOS", label: "Todos", color: C.primary, background: "#E8EEFF" },
  { key: "HOY", label: "Programados hoy", color: "#7C3AED", background: "#F1EAFF" },
  { key: "PENDIENTE", label: "Pendientes", color: C.info, background: "#EAF2FF" },
  { key: "GESTIONADO", label: "Gestionados", color: C.success, background: "#E5F8F2" },
  { key: "REPROGRAMADO", label: "Reprogramados", color: C.warning, background: "#FFF5DB" },
  { key: "NO_ENCONTRADO", label: "No encontrados", color: C.danger, background: "#FDEBEC" },
];
const fullName = (item: any) => [item?.nombres, item?.apellidos || item?.apellido_paterno, item?.apellido_materno].filter(Boolean).join(" ");
const debt = (item: any) => Number(item?.deuda_vigente || 0) + Number(item?.deuda_castigada || 0) + Number(item?.otras_deudas || 0);
const formatDate = (value?: string) => {
  if (!value) return "No registrada";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No registrada" : date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
};
const retainedDetailKey = "radar360-active-client-detail";
let retainedClientId: number | null = null;

export default function ClientsScreen({ refreshRevision = 0, onDetailVisibilityChange }: { refreshRevision?: number; onDetailVisibilityChange?: (visible: boolean) => void }) {
  const { api } = useAuth();
  const insets = useSafeAreaInsets();
  const [all, setAll] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const portfolioScrollRef = useRef<ScrollView | null>(null);
  const searchPositionRef = useRef(0);
  const searchScrollTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const showClientDetail = useCallback((client: any) => {
    const clientId = Number(client?.id_cliente);
    retainedClientId = Number.isFinite(clientId) ? clientId : null;
    setSelected(client);
    if (retainedClientId != null) {
      SecureStore.setItemAsync(retainedDetailKey, JSON.stringify({ id: retainedClientId, savedAt: Date.now() })).catch(() => {});
    }
  }, []);

  const dismissClientDetail = useCallback(() => {
    retainedClientId = null;
    setSelected(null);
    SecureStore.deleteItemAsync(retainedDetailKey).catch(() => {});
  }, []);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      setError("");
      const response: any = await api("/api/campo/clientes");
      setAll(Array.isArray(response.data) ? response.data : []);
    } catch (requestError: any) {
      setError(requestError.message || "No se pudo cargar tu cartera.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => {
      clearInterval(timer);
      searchScrollTimersRef.current.forEach(clearTimeout);
    };
  }, [load]);
  useEffect(() => {
    if (refreshRevision > 0) load(true);
  }, [refreshRevision, load]);

  useEffect(() => {
    if (selected || !all.length) return;
    let cancelled = false;
    const restoreDetail = async () => {
      let clientId = retainedClientId;
      if (clientId == null) {
        try {
          const stored = await SecureStore.getItemAsync(retainedDetailKey);
          const value = stored ? JSON.parse(stored) : null;
          if (value && Date.now() - Number(value.savedAt) <= 10 * 60 * 1000) clientId = Number(value.id);
          else if (stored) await SecureStore.deleteItemAsync(retainedDetailKey);
        } catch {}
      }
      const client = all.find((item) => Number(item.id_cliente) === clientId);
      if (!cancelled && client) {
        retainedClientId = Number(client.id_cliente);
        setSelected(client);
      }
    };
    restoreDetail();
    return () => { cancelled = true; };
  }, [all, selected]);

  useEffect(() => {
    onDetailVisibilityChange?.(Boolean(selected));
  }, [onDetailVisibilityChange, selected]);

  useEffect(() => () => onDetailVisibilityChange?.(false), [onDetailVisibilityChange]);

  const keepSearchVisible = useCallback((animated = true) => {
    portfolioScrollRef.current?.scrollTo({ y: Math.max(0, searchPositionRef.current - 12), animated });
  }, []);

  const stabilizeSearchPosition = useCallback(() => {
    searchScrollTimersRef.current.forEach(clearTimeout);
    keepSearchVisible(true);
    searchScrollTimersRef.current = [
      setTimeout(() => keepSearchVisible(false), 90),
      setTimeout(() => keepSearchVisible(false), 240),
    ];
  }, [keepSearchVisible]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    requestAnimationFrame(stabilizeSearchPosition);
  }, [stabilizeSearchPosition]);

  const handleSearchFocus = useCallback(() => {
    setSearchFocused(true);
    requestAnimationFrame(stabilizeSearchPosition);
  }, [stabilizeSearchPosition]);

  const data = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return all.filter((item) => {
      const isScheduledToday = item.programado_hoy === true || Boolean(item.id_ruta_hoy);
      if (filter === "HOY" && !isScheduledToday) return false;
      if (filter === "PENDIENTE" && item.estado_gestion !== "ASIGNADO") return false;
      if (!["TODOS", "HOY", "PENDIENTE"].includes(filter) && item.estado_gestion !== filter) return false;
      return !query || [fullName(item), item.dni, item.distrito, item.direccion].filter(Boolean).join(" ").toLocaleLowerCase("es").includes(query);
    });
  }, [all, filter, search]);
  const totalDebt = useMemo(() => all.reduce((sum, item) => sum + debt(item), 0), [all]);
  const managed = useMemo(() => all.filter((item) => item.estado_gestion === "GESTIONADO").length, [all]);
  const scheduledToday = useMemo(
    () => all.filter((item) => item.programado_hoy === true || Boolean(item.id_ruta_hoy)).length,
    [all],
  );
  const filterCounts = useMemo(() => ({
    TODOS: all.length,
    HOY: scheduledToday,
    PENDIENTE: all.filter((item) => item.estado_gestion === "ASIGNADO").length,
    GESTIONADO: managed,
    REPROGRAMADO: all.filter((item) => item.estado_gestion === "REPROGRAMADO").length,
    NO_ENCONTRADO: all.filter((item) => item.estado_gestion === "NO_ENCONTRADO").length,
  }), [all, managed, scheduledToday]);

  const openNavigation = useCallback(async (client: any) => {
    const latitude = Number(client?.latitud);
    const longitude = Number(client?.longitud);
    const hasCoordinates = client?.latitud != null && client?.latitud !== "" && client?.longitud != null && client?.longitud !== ""
      && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
    const address = [client?.direccion, client?.distrito, "Perú"].filter(Boolean).join(", ");
    if (!hasCoordinates && !client?.direccion) {
      Alert.alert("Ubicación no disponible", "Este cliente todavía no tiene una dirección o coordenadas registradas.");
      return;
    }
    const label = fullName(client) || address || "Cliente";
    const query = hasCoordinates ? `${latitude},${longitude}(${label})` : address;
    const nativeUrl = Platform.OS === "android"
      ? `geo:${hasCoordinates ? `${latitude},${longitude}` : "0,0"}?q=${encodeURIComponent(query)}`
      : `maps://?q=${encodeURIComponent(label)}&${hasCoordinates ? `ll=${latitude},${longitude}` : `address=${encodeURIComponent(address)}`}`;
    const webUrl = hasCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    try {
      await Linking.openURL(nativeUrl);
    } catch {
      try {
        await Linking.openURL(webUrl);
      } catch {
        Alert.alert("No se pudo abrir el mapa", "Instala una aplicación de mapas o verifica la configuración del dispositivo.");
      }
    }
  }, []);

  const callClient = useCallback(async (client: any) => {
    const phone = String(client?.telefono || "").replace(/[^\d+]/g, "");
    if (!phone) {
      Alert.alert("Teléfono no disponible", "Este cliente no tiene un número telefónico registrado.");
      return;
    }
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert("No se pudo iniciar la llamada", "Verifica que el dispositivo permita realizar llamadas.");
    }
  }, []);

  if (selected) return (
    <View style={[s.modal, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={s.modalHead}><View style={s.modalHeadText}><Text style={s.modalEyebrow}>FICHA DE CARTERA</Text><Text style={s.modalTitle}>{fullName(selected)}</Text></View><Pressable onPress={dismissClientDetail} style={s.close}><MaterialCommunityIcons name="close" size={22} color={C.text} /></Pressable></View>
      <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
        <View style={s.statusRow}><Badge status={selected.estado_gestion || "ASIGNADO"} /><View style={s.statusDates}>{selected.programado_hoy?<Text style={s.todayTag}>PROGRAMADO HOY</Text>:null}<Text style={s.assignedDate}>Asignado: {formatDate(selected.fecha_asignacion)}</Text></View></View>
        <View style={s.info}><View style={s.infoIcon}><MaterialCommunityIcons name="card-account-details-outline" size={20} color={C.primary} /></View><View style={s.infoCopy}><Text style={s.small}>DNI</Text><Text style={s.infoValue}>{selected.dni || "No registrado"}</Text></View></View>
        <Pressable onPress={() => callClient(selected)} style={({ pressed }) => [s.info, pressed && s.infoPressed]} accessibilityRole="button" accessibilityLabel="Llamar al cliente">
          <View style={s.infoIcon}><MaterialCommunityIcons name="phone-outline" size={20} color={C.primary} /></View><View style={s.infoCopy}><Text style={s.small}>TELÉFONO</Text><Text style={s.infoValue}>{selected.telefono || "No registrado"}</Text></View><MaterialCommunityIcons name="chevron-right" size={20} color="#A4ADBA" />
        </Pressable>
        <Pressable onPress={() => openNavigation(selected)} style={({ pressed }) => [s.info, pressed && s.infoPressed]} accessibilityRole="button" accessibilityLabel="Abrir ubicación del cliente en una aplicación de mapas">
          <View style={s.infoIcon}><MaterialCommunityIcons name="map-marker-outline" size={20} color={C.primary} /></View>
          <View style={s.infoCopy}><Text style={s.small}>DIRECCIÓN</Text><Text style={s.infoValue}>{selected.direccion || "Usar coordenadas registradas"}</Text></View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#A4ADBA" />
        </Pressable>
        {[["map-outline", "Distrito", selected.distrito], ["calendar-check-outline", "Última gestión", formatDate(selected.ultima_gestion)]].map(([icon, label, value]) => <View key={String(label)} style={s.info}><View style={s.infoIcon}><MaterialCommunityIcons name={icon as any} size={20} color={C.primary} /></View><View style={s.infoCopy}><Text style={s.small}>{label}</Text><Text style={s.infoValue}>{value || "No registrado"}</Text></View></View>)}
        <Card><Text style={s.small}>DETALLE DE DEUDA</Text><View style={s.debtBreakdown}><View><Text style={s.breakdownLabel}>Vigente</Text><Text style={s.breakdownValue}>{money(selected.deuda_vigente || 0)}</Text></View><View><Text style={s.breakdownLabel}>Castigada</Text><Text style={s.breakdownValue}>{money(selected.deuda_castigada || 0)}</Text></View><View><Text style={s.breakdownLabel}>Otras</Text><Text style={s.breakdownValue}>{money(selected.otras_deudas || 0)}</Text></View></View><View style={s.totalDivider} /><Text style={s.small}>DEUDA TOTAL</Text><Text style={s.modalAmount}>{money(debt(selected))}</Text></Card>
      </ScrollView>
    </View>
  );

  return (
    <Screen scrollRef={portfolioScrollRef} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[C.primary]} />}>
      <View style={s.header}>
        <View style={s.headerIcon}><MaterialCommunityIcons name="briefcase-account-outline" size={25} color="#fff" /></View>
        <View style={s.headerCopy}>
          <Text style={s.eyebrow}>CARTERA ASIGNADA</Text><Text style={s.title}>Mis clientes</Text>
          <Text style={s.subtitle}>Consulta tu cartera completa o enfócate en la programación de hoy.</Text>
        </View>
      </View>
      <View style={s.summaryRow}>
        <Card style={s.summaryCard}><Text style={s.summaryValue}>{all.length}</Text><Text style={s.summaryLabel}>Asignados activos</Text></Card>
        <Card style={s.summaryCard}><Text style={[s.summaryValue, { color: "#7C3AED" }]}>{scheduledToday}</Text><Text style={s.summaryLabel}>Programados hoy</Text></Card>
      </View>
      <Card style={s.debtCard}>
        <View><Text style={s.debtLabel}>DEUDA TOTAL DE MI CARTERA</Text><Text style={s.debtValue}>{money(totalDebt)}</Text></View>
        <View style={s.debtIcon}><MaterialCommunityIcons name="finance" size={25} color={C.primary} /></View>
      </Card>
      <View onLayout={(event) => { searchPositionRef.current = event.nativeEvent.layout.y; }}>
        <Input placeholder="Buscar por nombre, DNI, distrito o dirección…" value={search} onChangeText={handleSearchChange} onFocus={handleSearchFocus} onBlur={() => setSearchFocused(false)} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll} contentContainerStyle={s.filters}>
        {filters.map((item) => {
          const active = filter === item.key;
          return <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[s.filter, { backgroundColor: active ? item.color : item.background }]}>
            <View style={[s.filterDot, { backgroundColor: active ? "#fff" : item.color }]} />
            <Text style={[s.filterText, { color: active ? "#fff" : item.color }]}>{item.label}</Text>
            <View style={[s.filterCount, { backgroundColor: active ? "#FFFFFF2E" : "#FFFFFF" }]}><Text style={[s.filterCountText, { color: active ? "#fff" : item.color }]}>{filterCounts[item.key as keyof typeof filterCounts]}</Text></View>
          </Pressable>;
        })}
      </ScrollView>
      <View style={s.result}><Text style={s.resultText}>{data.length} de {all.length} clientes</Text><MaterialCommunityIcons name="shield-account-outline" size={18} color={C.primary} /></View>
      {error ? <Card style={s.errorCard}><MaterialCommunityIcons name="cloud-alert-outline" size={22} color={C.red} /><Text style={s.errorText}>{error}</Text></Card> : null}
      {loading ? <Loading /> : data.length ? data.map((item) =>
        <Pressable key={item.id_cliente} onPress={() => showClientDetail(item)} style={({ pressed }) => pressed && { opacity: 0.72 }}>
          <Card><View style={s.top}><View style={s.avatar}><Text style={s.avatarText}>{(item.nombres || "C")[0]}</Text></View><View style={s.identity}><Text style={s.name}>{fullName(item)}</Text><Text style={s.meta}>DNI {item.dni || "—"} · {item.distrito || "Sin distrito"}</Text></View><MaterialCommunityIcons name="chevron-right" size={23} color="#A4ADBA" /></View><View style={s.divider} /><View style={s.cardBottom}><View><Text style={s.small}>DEUDA TOTAL</Text><Text style={s.amount}>{money(debt(item))}</Text></View><Badge status={item.estado_gestion || "ASIGNADO"} /></View></Card>
        </Pressable>
      ) : <Empty title={all.length ? "No hay coincidencias" : "No tienes clientes asignados"} text={all.length ? "Cambia el filtro o el criterio de búsqueda." : "Las asignaciones activas realizadas en la web aparecerán aquí."} />}
      {searchFocused ? <View style={s.keyboardScrollSpace} pointerEvents="none" /> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 2 }, headerIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1 }, eyebrow: { color: C.red, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 }, title: { color: C.text, fontSize: 25, fontWeight: "900", marginTop: 2 }, subtitle: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  summaryRow: { flexDirection: "row", gap: 10 }, summaryCard: { flex: 1, minHeight: 90 }, summaryValue: { color: C.primary, fontSize: 29, fontWeight: "900" }, summaryLabel: { color: C.muted, fontSize: 10, fontWeight: "700", marginTop: 3 },
  debtCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, debtLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8, color: C.muted }, debtValue: { fontSize: 24, fontWeight: "900", color: C.text, marginTop: 4 }, debtIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#EAF0FF", alignItems: "center", justifyContent: "center" },
  filtersScroll: { flexGrow: 0, height: 40 }, filters: { gap: 7, paddingRight: 12, alignItems: "center" }, filter: { height: 36, paddingHorizontal: 11, borderRadius: 18, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" }, filterDot: { width: 7, height: 7, borderRadius: 4 }, filterText: { fontSize: 10, lineHeight: 14, fontWeight: "800" }, filterCount: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: "center", justifyContent: "center" }, filterCountText: { fontSize: 9, fontWeight: "900" }, result: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, resultText: { fontSize: 11, color: C.muted, fontWeight: "700" },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 9, borderColor: "#FECACA" }, errorText: { flex: 1, color: C.red, fontSize: 11, lineHeight: 16 }, top: { flexDirection: "row", alignItems: "center", gap: 11 }, avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" }, avatarText: { fontSize: 17, fontWeight: "900", color: C.primary }, identity: { flex: 1 }, name: { fontSize: 14, fontWeight: "900", color: C.text, lineHeight: 19 }, meta: { color: C.muted, fontSize: 10, marginTop: 3 }, divider: { height: 1, backgroundColor: "#EEF2F6", marginVertical: 13 }, cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 8 }, small: { fontSize: 9, fontWeight: "900", letterSpacing: 0.7, color: C.muted, textTransform: "uppercase" }, amount: { fontSize: 18, fontWeight: "900", color: C.text, marginTop: 3 },
  keyboardScrollSpace: { height: 360 },
  modal: { flex: 1, backgroundColor: C.bg }, modalHead: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, modalHeadText: { flex: 1, paddingRight: 12 }, modalEyebrow: { fontSize: 10, color: C.red, fontWeight: "900", letterSpacing: 1 }, modalTitle: { fontSize: 21, fontWeight: "900", color: C.text, marginTop: 3 }, close: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#F1F4F8", alignItems: "center", justifyContent: "center" }, modalBody: { padding: 20, paddingBottom: 40, gap: 14 }, statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, statusDates: { alignItems: "flex-end", gap: 3 }, todayTag: { fontSize: 9, fontWeight: "900", color: "#7C3AED", letterSpacing: 0.5 }, assignedDate: { fontSize: 10, color: C.muted, fontWeight: "700" }, info: { flexDirection: "row", alignItems: "center", gap: 12 }, infoPressed: { opacity: 0.65 }, infoIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#EAF0FF", alignItems: "center", justifyContent: "center" }, infoCopy: { flex: 1 }, infoValue: { fontSize: 13, color: C.text, fontWeight: "700", marginTop: 3, lineHeight: 18 }, debtBreakdown: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 14 }, breakdownLabel: { fontSize: 9, color: C.muted }, breakdownValue: { fontSize: 12, fontWeight: "800", color: C.text, marginTop: 3 }, totalDivider: { height: 1, backgroundColor: C.border, marginVertical: 14 }, modalAmount: { fontSize: 27, fontWeight: "900", color: C.primary, marginTop: 5 },
});
