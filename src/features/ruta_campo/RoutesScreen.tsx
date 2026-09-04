import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../shared/context/AuthContext";
import { Badge, Button, Card, Empty, Header, Loading, Screen } from "../../shared/ui/ui";
import { C, money } from "../../shared/theme/theme";
import SignaturePad from "../../features/ruta_campo/components/SignaturePad";


import {
  cacheTodayRoute,
  createOfflineVisitId,
  enqueueVisit,
  getCachedTodayRoute,
  syncPendingVisits,
} from "../../shared/sync/offlineSync";
const FIELD_DRAFT_KEY = "radar360_active_field_draft";
const results = [
  {
    key: "GESTIONADO",
    label: "Gestionado",
    icon: "check-circle",
    color: C.success,
  },
  {
    key: "REPROGRAMADO",
    label: "Reprogramar",
    icon: "calendar-clock",
    color: C.warning,
  },
  {
    key: "NO_ENCONTRADO",
    label: "No encontrado",
    icon: "account-off",
    color: C.red,
  },
];
const totalDebt = (item: any) => {
  const client = item?.cliente || item || {};
  return Number(client.deuda_vigente || 0) + Number(client.deuda_castigada || 0) + Number(client.otras_deudas || 0);
};
export default function RoutesScreen({
  refreshRevision = 0,
  onDetailVisibilityChange,
}: {
  refreshRevision?: number;
  onDetailVisibilityChange?: (visible: boolean) => void;
}) {
  const { api, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [result, setResult] = useState("GESTIONADO");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [photo2, setPhoto2] = useState("");
  const [photo2Preview, setPhoto2Preview] = useState("");
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [cameraSlot, setCameraSlot] = useState<1 | 2 | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [signature, setSignature] = useState("");
  const [signatureKey, setSignatureKey] = useState(0);
  const [signing, setSigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [offlineMode, setOfflineMode] = useState(false);
  const draftsRef = useRef(new Map<number, any>());
  const suppressAutoRestoreRef = useRef(false);
  const routeRef = useRef<any>(null);
  const selectedRef = useRef<any>(null);
  const pendingRestoreClientRef = useRef<number | null>(null);
  const formScrollRef = useRef<ScrollView>(null);
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  useEffect(() => {
    const visible = Boolean(selected) || Boolean(cameraSlot);
    onDetailVisibilityChange?.(visible);
  }, [selected, cameraSlot, onDetailVisibilityChange]);
  useEffect(
    () => () => onDetailVisibilityChange?.(false),
    [onDetailVisibilityChange],
  );
  const persistDraft = async (clientId: number, values: any) => {
    if (!clientId) return;
    const draft = { clientId, routeId: route?.id_ruta, savedAt: Date.now(), ...values };
    draftsRef.current.set(clientId, draft);
    const durableDraft = {
      clientId: draft.clientId,
      routeId: draft.routeId,
      savedAt: draft.savedAt,
      result: draft.result,
      notes: draft.notes,
      amount: draft.amount,
      photo: draft.photo,
      photoPreview: draft.photoPreview,
      photo2: draft.photo2,
      photo2Preview: draft.photo2Preview,
      pendingPhotoSlot: draft.pendingPhotoSlot,
      formOpen: draft.formOpen,
    };
    await SecureStore.setItemAsync(FIELD_DRAFT_KEY, JSON.stringify(durableDraft));
  };
  const load = useCallback(async () => {
    try {
      setError("");
      const r: any = await api("/api/campo/ruta-hoy");
      setRoute(r.data);
      setOfflineMode(false);
      await cacheTodayRoute(r.data, user?.id_asesor);
    } catch (e: any) {
      const cached = await getCachedTodayRoute(user?.id_asesor);
      if (cached) {
        setRoute(cached);
        setOfflineMode(true);
        setError("");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [api, user?.id_asesor]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (refreshRevision > 0 && !selectedRef.current) load();
  }, [refreshRevision, load]);
  useEffect(() => {
    routeRef.current = route;
  }, [route]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  const resetForm = () => {
    setSelected(null);
    setResult("GESTIONADO");
    setNotes("");
    setAmount("");
    setPhoto("");
    setPhotoPreview("");
    setPhoto2("");
    setPhoto2Preview("");
    setPhotoProcessing(false);
    setSignature("");
    setSignatureKey((key) => key + 1);
  };
  const closeForm = () => {
    const clientId = Number(selected?.cliente?.id_cliente);
    if (clientId) {
      persistDraft(clientId, { result, notes, amount, photo, photoPreview, photo2, photo2Preview, formOpen: false }).catch(() => {});
    }
    suppressAutoRestoreRef.current = true;
    setSelected(null);
  };
  const openForm = (item: any) => {
    const clientId = Number(item?.cliente?.id_cliente);
    const draft = draftsRef.current.get(clientId);
    setSelected(item);
    setResult(draft?.result || "GESTIONADO");
    setNotes(draft?.notes || "");
    setAmount(draft?.amount || totalDebt(item).toFixed(2));
    setPhoto(draft?.photo || "");
    setPhotoPreview(draft?.photoPreview || "");
    setPhoto2(draft?.photo2 || "");
    setPhoto2Preview(draft?.photo2Preview || "");
    setPhotoProcessing(false);
    setSignature("");
    setSignatureKey((key) => key + 1);
    persistDraft(clientId, {
      result: draft?.result || "GESTIONADO",
      notes: draft?.notes || "",
      amount: draft?.amount || totalDebt(item).toFixed(2),
      photo: draft?.photo || "",
      photoPreview: draft?.photoPreview || "",
      photo2: draft?.photo2 || "",
      photo2Preview: draft?.photo2Preview || "",
      formOpen: true,
    }).catch(() => {});
  };
  useEffect(() => {
    if (!route || selected) return;
    if (suppressAutoRestoreRef.current) {
      suppressAutoRestoreRef.current = false;
      return;
    }
    SecureStore.getItemAsync(FIELD_DRAFT_KEY).then((stored) => {
      if (!stored) return;
      const draft = JSON.parse(stored);
      const requestedClientId = pendingRestoreClientRef.current || Number(draft?.clientId);
      if (!requestedClientId || !draft.formOpen || Number(draft.routeId) !== Number(route.id_ruta)) return;
      const item = route.rutas_clientes?.find((entry: any) => Number(entry.cliente?.id_cliente) === Number(draft.clientId) && entry.estado_visita === "PENDIENTE");
      if (!item) return;
      pendingRestoreClientRef.current = null;
      draftsRef.current.set(Number(draft.clientId), draft);
      openForm(item);
    }).catch(() => {});
  }, [route, selected]);
  const processCapturedPhoto = async (capturedUri: string, clientId: number, slot: 1 | 2) => {
    setPhotoProcessing(true);
    const compressed = await manipulateAsync(capturedUri, [{ resize: { width: 1024 } }], { compress: 0.65, format: SaveFormat.JPEG });
    if (!compressed.uri) throw new Error("No se pudo procesar la fotografía.");
    const directory = `${FileSystem.documentDirectory}evidence-drafts`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    let existing = draftsRef.current.get(clientId) || {};
    if (!Object.keys(existing).length) {
      const stored = await SecureStore.getItemAsync(FIELD_DRAFT_KEY);
      if (stored) existing = JSON.parse(stored);
    }
    const previousUri = slot === 1 ? existing.photo : existing.photo2;
    const persistentUri = `${directory}/cliente-${clientId}-foto-${slot}-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: compressed.uri, to: persistentUri });
    if (slot === 1) {
      setPhoto(persistentUri);
      setPhotoPreview(persistentUri);
    } else {
      setPhoto2(persistentUri);
      setPhoto2Preview(persistentUri);
    }
    await persistDraft(clientId, {
      ...existing,
      ...(slot === 1 ? { photo: persistentUri, photoPreview: persistentUri } : { photo2: persistentUri, photo2Preview: persistentUri }),
      pendingPhotoSlot: null,
      formOpen: true,
    });
    if (
      previousUri &&
      previousUri !== persistentUri &&
      String(previousUri).startsWith(directory)
    ) {
      await FileSystem.deleteAsync(previousUri, { idempotent: true }).catch(() => {});
    }
    pendingRestoreClientRef.current = clientId;
    const currentRoute = routeRef.current;
    if (!selectedRef.current && currentRoute) {
      const item = currentRoute.rutas_clientes?.find(
        (entry: any) =>
          Number(entry.cliente?.id_cliente) === clientId &&
          entry.estado_visita === "PENDIENTE",
      );
      if (item) {
        pendingRestoreClientRef.current = null;
        openForm(item);
      }
    } else {
      pendingRestoreClientRef.current = null;
    }
    setTimeout(() => {
      formScrollRef.current?.scrollTo({ y: slot === 1 ? 500 : 700, animated: false });
    }, 250);
  };
  const status = async (next: string) => {
    try {
      setSaving(true);
      await api(`/api/campo/rutas/${route.id_ruta}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado: next }),
      });
      await load();
    } catch (e: any) {
      Alert.alert("No se pudo actualizar", e.message);
    } finally {
      setSaving(false);
    }
  };
  const takePhoto = async (slot: 1 | 2) => {
    try {
      const permission = cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();
       if (!permission?.granted) {
         if (permission?.canAskAgain === false) {
           Alert.alert(
             "Permiso de cámara bloqueado",
             "Activa el permiso de Cámara para Radar 360° desde los ajustes del dispositivo.",
             [
               { text: "Cancelar", style: "cancel" },
               { text: "Abrir ajustes", onPress: () => Linking.openSettings() },
             ],
           );
         } else {
           Alert.alert(
             "Permiso requerido",
             "Debes permitir el uso de la cámara para registrar las dos evidencias obligatorias.",
           );
         }
         return;
       }
      const clientId = Number(selected?.cliente?.id_cliente);
      pendingRestoreClientRef.current = clientId;
      await persistDraft(clientId, { result, notes, amount, photo, photoPreview, photo2, photo2Preview, pendingPhotoSlot: slot, formOpen: true });
      setCameraSlot(slot);
    } catch (e: any) {
      Alert.alert("Fotografía no disponible", e.message);
    }
  };
  const capturePhoto = async () => {
    if (!cameraSlot || capturing || !cameraRef.current) return;
    const slot = cameraSlot;
    const clientId = Number(selected?.cliente?.id_cliente);
    try {
      setCapturing(true);
      const captured = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (!captured?.uri)
        throw new Error("La cámara no devolvió una fotografía válida.");
      await processCapturedPhoto(captured.uri, clientId, slot);
      setCameraSlot(null);
    } catch (e: any) {
      Alert.alert("Fotografía no disponible", e.message);
    } finally {
      setCapturing(false);
      setPhotoProcessing(false);
    }
  };
  const save = async () => {
    try {
      if (!photo) throw new Error("Toma una fotografía de evidencia.");
      if (!photo2) throw new Error("Toma la segunda fotografía de evidencia.");
      if (!signature) throw new Error("Solicita la firma antes de guardar.");
      if (notes.trim().length < 5)
        throw new Error("Ingresa una descripción de al menos 5 caracteres.");
      setSaving(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted")
        throw new Error("Debes permitir la ubicación para validar la visita.");
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const clientId = Number(selected.cliente.id_cliente);
      const queueId = createOfflineVisitId(Number(route.id_ruta), clientId);
      await enqueueVisit({
        id: queueId,
        advisorId: Number(user?.id_asesor),
        routeId: Number(route.id_ruta),
        clientId,
        result,
        observations: notes.trim(),
        amount: amount || null,
        photo1Uri: photo,
        photo2Uri: photo2,
        signature,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      draftsRef.current.delete(clientId);
      await SecureStore.deleteItemAsync(FIELD_DRAFT_KEY);
      const queuedRoute = {
        ...route,
        rutas_clientes: route.rutas_clientes.map((item: any) =>
          Number(item.cliente?.id_cliente) === clientId
            ? { ...item, estado_visita: "PENDIENTE_SYNC" }
            : item,
        ),
      };
      setRoute(queuedRoute);
      await cacheTodayRoute(queuedRoute, user?.id_asesor);
      resetForm();
      let sync = { syncedIds: [] as string[] };
      try {
        const network = await NetInfo.fetch();
        const connected = Boolean(
          network.isConnected && network.isInternetReachable !== false,
        );
        if (connected) sync = await syncPendingVisits();
      } catch {
        // La gestión ya está confirmada en SQLite y conserva sus evidencias.
      }
      if (sync.syncedIds.includes(queueId)) {
        await load();
        Alert.alert(
          "Gestión registrada",
          "Las dos fotos, la firma y los datos ya están disponibles en el sistema web.",
        );
      } else {
        Alert.alert(
          "Guardado sin conexión",
          "La gestión y sus evidencias están seguras en el dispositivo. Se sincronizarán automáticamente cuando vuelva la señal.",
        );
      }
    } catch (e: any) {
      Alert.alert("No se pudo registrar", e.message);
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <Loading />;
  return (
    <>
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            colors={[C.primary]}
          />
        }
      >
        <Header
          title="Mi ruta de hoy"
          subtitle="Visita y gestiona únicamente tus clientes asignados"
        />
        {offlineMode ? (
          <Card style={s.offlineCard}>
            <MaterialCommunityIcons
              name="cloud-off-outline"
              size={21}
              color={C.warning}
            />
            <Text style={s.offlineCardText}>
              Modo sin conexión: puedes registrar visitas normalmente. Los pendientes se subirán al recuperar señal.
            </Text>
          </Card>
        ) : null}
        {error ? (
          <Empty title="Acceso de campo no disponible" text={error} />
        ) : !route ? (
          <Empty
            title="No tienes una ruta programada"
            text="Cuando tu supervisor programe la ruta aparecerá aquí."
          />
        ) : (
          <>
            <Card>
              <View style={s.routeHead}>
                <View style={s.routeIcon}>
                  <MaterialCommunityIcons
                    name="map-marker-path"
                    size={25}
                    color={C.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.routeTitle}>Ruta #{route.id_ruta}</Text>
                  <Text style={s.routeSub}>
                    {route.rutas_clientes.length} visitas programadas
                  </Text>
                </View>
                <Badge status={route.estado} />
              </View>
              {route.estado === "PROGRAMADA" ? (
                <Button
                  title="Iniciar jornada"
                  icon="play"
                  disabled={saving}
                  onPress={() => status("EN_PROCESO")}
                />
              ) : route.estado === "EN_PROCESO" ? (
                <Button
                  title="Finalizar jornada"
                  icon="flag-checkered"
                  disabled={saving}
                  onPress={() => status("FINALIZADA")}
                />
              ) : null}
            </Card>
            <Text style={s.section}>ORDEN DE VISITAS</Text>
            {route.rutas_clientes.map((item: any) => (
              <Pressable
                key={item.id_ruta_cliente}
                disabled={
                  route.estado !== "EN_PROCESO" ||
                  item.estado_visita !== "PENDIENTE"
                }
                onPress={() => openForm(item)}
              >
                <Card
                  style={
                    item.estado_visita !== "PENDIENTE" ? s.done : undefined
                  }
                >
                  <View style={s.clientRow}>
                    <View style={s.sequence}>
                      <Text style={s.sequenceText}>{item.secuencia}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.clientName}>
                        {item.cliente.nombres} {item.cliente.apellido_paterno}{" "}
                        {item.cliente.apellido_materno}
                      </Text>
                      <Text style={s.clientMeta}>
                        DNI {item.cliente.dni} ·{" "}
                        {item.cliente.distrito || "Sin distrito"}
                      </Text>
                      <Text numberOfLines={2} style={s.address}>
                        {item.cliente.direccion || "Dirección no registrada"}
                      </Text>
                      <Text style={s.debt}>
                        Deuda:{" "}
                        {money(
                          Number(item.cliente.deuda_vigente || 0) +
                            Number(item.cliente.deuda_castigada || 0) +
                            Number(item.cliente.otras_deudas || 0),
                        )}
                      </Text>
                    </View>
                    <View style={s.clientRight}>
                      <Badge status={item.estado_visita} />
                      {item.estado_visita === "PENDIENTE" &&
                      route.estado === "EN_PROCESO" ? (
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={24}
                          color={C.primary}
                        />
                      ) : null}
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </>
        )}
      </Screen>
      <Modal
        visible={Boolean(selected)}
        animationType="slide"
        transparent
        onRequestClose={closeForm}
      >
        <View style={s.overlay}>
          <View
            style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}
          >
            <View style={s.sheetHead}>
              <View>
                <Text style={s.sheetTitle}>Registrar gestión</Text>
                <Text style={s.sheetSub}>
                  {selected?.cliente?.nombres}{" "}
                  {selected?.cliente?.apellido_paterno}
                </Text>
              </View>
              <Pressable onPress={closeForm}>
                <MaterialCommunityIcons name="close" size={26} color={C.text} />
              </Pressable>
            </View>
            <ScrollView
              ref={formScrollRef}
              scrollEnabled={!signing}
              contentContainerStyle={s.form}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={s.label}>RESULTADO DE VISITA</Text>
              <View style={s.results}>
                {results.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setResult(item.key);
                      if (item.key === "GESTIONADO") setAmount(totalDebt(selected).toFixed(2));
                    }}
                    style={[
                      s.result,
                      result === item.key && {
                        borderColor: item.color,
                        backgroundColor: item.color + "12",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={22}
                      color={item.color}
                    />
                    <Text style={s.resultText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              {result === "GESTIONADO" ? (
                <>
                  <Text style={s.label}>TOTAL DE DEUDA RECUPERADA</Text>
                  <TextInput
                    value={amount}
                    editable={false}
                    selectTextOnFocus={false}
                    placeholder="S/ 0.00"
                    style={s.input}
                  />
                </>
              ) : null}
              <Text style={s.label}>DESCRIPCIÓN DE LA GESTIÓN *</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={2000}
                placeholder="Detalle de la conversación, compromiso o motivo…"
                style={[s.input, s.notes]}
              />
              <Text style={s.label}>FOTOGRAFÍA DE EVIDENCIA *</Text>
              <Pressable onPress={() => takePhoto(1)} style={s.evidence}>
                {photoPreview ? (
                  <View style={s.photoPreview}>
                    <Image source={{ uri: photoPreview }} style={s.photo} />
                    <View style={s.photoStatus}><MaterialCommunityIcons name={photoProcessing ? "progress-clock" : "check-circle"} size={16} color="#fff" /><Text style={s.photoStatusText}>{photoProcessing ? "Procesando…" : "Evidencia lista"}</Text></View>
                    <View style={s.retake}><MaterialCommunityIcons name="camera-retake-outline" size={16} color="#fff" /><Text style={s.retakeText}>Tocar para reemplazar</Text></View>
                  </View>
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="camera-plus-outline"
                      size={28}
                      color={C.primary}
                    />
                    <Text style={s.evidenceTitle}>Tomar fotografía</Text>
                    <Text style={s.evidenceText}>
                      Se comprimirá antes de sincronizar.
                    </Text>
                  </>
                )}
              </Pressable>
              <Text style={s.label}>FOTOGRAFÍA DE EVIDENCIA 2 *</Text>
              <Pressable onPress={() => takePhoto(2)} style={s.evidence}>
                {photo2Preview ? (
                  <View style={s.photoPreview}>
                    <Image source={{ uri: photo2Preview }} style={s.photo} />
                    <View style={s.photoStatus}><MaterialCommunityIcons name={photoProcessing ? "progress-clock" : "check-circle"} size={16} color="#fff" /><Text style={s.photoStatusText}>{photoProcessing ? "Procesando…" : "Segunda evidencia lista"}</Text></View>
                    <View style={s.retake}><MaterialCommunityIcons name="camera-retake-outline" size={16} color="#fff" /><Text style={s.retakeText}>Tocar para reemplazar</Text></View>
                  </View>
                ) : (
                  <>
                    <MaterialCommunityIcons name="camera-plus-outline" size={28} color={C.primary} />
                    <Text style={s.evidenceTitle}>Tomar segunda fotografía</Text>
                    <Text style={s.evidenceText}>Debe mostrar una evidencia complementaria.</Text>
                  </>
                )}
              </Pressable>
              <Text style={s.label}>FIRMA DEL CLIENTE *</Text>
              <SignaturePad
                key={signatureKey}
                onChange={setSignature}
                onDrawingChange={setSigning}
              />
              <View style={s.signatureRow}>
                <Text style={s.signatureStatus}>
                  {signature
                    ? "✓ Firma capturada"
                    : "Firma dentro del recuadro"}
                </Text>
                {signature ? (
                  <Pressable
                    onPress={() => {
                      setSignature("");
                      setSignatureKey((k) => k + 1);
                    }}
                  >
                    <Text style={s.clear}>Limpiar firma</Text>
                  </Pressable>
                ) : null}
              </View>
              <View style={s.gps}>
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={21}
                  color={C.success}
                />
                <Text style={s.gpsText}>
                  La ubicación se capturará al guardar la gestión.
                </Text>
              </View>
              <Button
                title={saving ? "Guardando…" : "Guardar y sincronizar"}
                icon="cloud-upload-outline"
                disabled={saving || photoProcessing}
                onPress={save}
              />
            </ScrollView>
            {cameraSlot ? (
              <View style={s.cameraLayer}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
                <View style={[s.cameraTop, { paddingTop: Math.max(insets.top, 14) }]}>
                  <View>
                    <Text style={s.cameraTitle}>
                      Evidencia {cameraSlot} de 2
                    </Text>
                    <Text style={s.cameraHint}>Encuadra claramente la evidencia</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      pendingRestoreClientRef.current = null;
                      setCameraSlot(null);
                    }}
                    disabled={capturing}
                    style={s.cameraClose}
                  >
                    <MaterialCommunityIcons name="close" size={25} color="#fff" />
                  </Pressable>
                </View>
                <View style={[s.cameraBottom, { paddingBottom: Math.max(insets.bottom, 18) }]}>
                  <Pressable
                    onPress={capturePhoto}
                    disabled={capturing}
                    style={[s.shutter, capturing && { opacity: 0.65 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Tomar fotografía de evidencia ${cameraSlot}`}
                  >
                    <View style={s.shutterCore} />
                  </Pressable>
                  <Text style={s.cameraCaptureText}>
                    {capturing ? "Guardando fotografía…" : "Toca para capturar"}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}
const s = StyleSheet.create({
  routeHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 15,
  },
  offlineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF8E7",
    borderColor: "#F3D58A",
  },
  offlineCardText: {
    flex: 1,
    color: "#8A5A00",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  routeIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  routeTitle: { fontSize: 17, fontWeight: "900", color: C.text },
  routeSub: { fontSize: 11, color: C.muted, marginTop: 3 },
  section: {
    fontSize: 10,
    fontWeight: "900",
    color: C.muted,
    letterSpacing: 1.1,
  },
  clientRow: { flexDirection: "row", gap: 11 },
  sequence: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sequenceText: { color: "#fff", fontWeight: "900" },
  clientName: { fontSize: 14, fontWeight: "900", color: C.text },
  clientMeta: { fontSize: 10, color: C.muted, marginTop: 3 },
  address: { fontSize: 11, lineHeight: 16, color: C.text, marginTop: 7 },
  debt: { fontSize: 11, fontWeight: "900", color: C.red, marginTop: 7 },
  clientRight: { alignItems: "flex-end", justifyContent: "space-between" },
  done: { opacity: 0.7 },
  overlay: {
    flex: 1,
    backgroundColor: "#071B43AA",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
  },
  sheetHead: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: 21, fontWeight: "900", color: C.text },
  sheetSub: { fontSize: 12, color: C.muted, marginTop: 3 },
  form: { padding: 20, gap: 12 },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: C.muted,
    letterSpacing: 0.8,
  },
  results: { gap: 8 },
  result: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultText: { fontWeight: "800", color: C.text },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    color: C.text,
    backgroundColor: C.surface2,
  },
  notes: { minHeight: 100, textAlignVertical: "top" },
  gps: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EAFBF5",
    padding: 12,
    borderRadius: 13,
  },
  gpsText: { flex: 1, fontSize: 11, color: C.success, fontWeight: "700" },
  evidence: {
    minHeight: 150,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.primary,
    borderRadius: 14,
    backgroundColor: "#F3F6FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    overflow: "hidden",
  },
  photo: { width: "100%", height: 190, resizeMode: "cover" },
  photoPreview: { width: "100%", height: 190, position: "relative" },
  photoStatus: { position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#071B43CC", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12 },
  photoStatusText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  retake: { position: "absolute", right: 10, bottom: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#071B43CC", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12 },
  retakeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  evidenceTitle: { fontSize: 13, fontWeight: "900", color: C.primary },
  evidenceText: { fontSize: 10, color: C.muted },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  signatureStatus: { fontSize: 10, color: C.success, fontWeight: "800" },
  clear: { fontSize: 10, color: C.red, fontWeight: "900" },
  cameraLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    overflow: "hidden",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#071B43",
  },
  cameraTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#071B43B8",
  },
  cameraTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  cameraHint: { color: "#DCE8FF", fontSize: 11, marginTop: 3 },
  cameraClose: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF24",
  },
  cameraBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 18,
    alignItems: "center",
    backgroundColor: "#071B43B8",
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterCore: {
    width: 58,
    height: 58,
    borderRadius: 30,
    backgroundColor: C.red,
    borderWidth: 3,
    borderColor: "#FFFFFFCC",
  },
  cameraCaptureText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
  },
});
