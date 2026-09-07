import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";

export type AdvisorLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export function useAdvisorLocation(
  api: <T>(path: string, options?: RequestInit) => Promise<T>,
  enabled: boolean,
) {
  const { user } = useAuth();
  const [location, setLocation] = useState<AdvisorLocation | null>(null);
  const [error, setError] = useState("");
  const apiRef = useRef(api);
  const userRef = useRef(user);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!enabled) {
      setLocation(null);
      setError("");
      return;
    }
    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    let stateSubscription: { remove: () => void } | null = null;
    let backgroundTimer: ReturnType<typeof setTimeout> | null = null;
    let starting = false;
    let pendingStart = false;
    let lastSent = 0;
    let startGeneration = 0;
    let appState = AppState.currentState;

    const clearBackgroundTimer = () => {
      if (backgroundTimer) clearTimeout(backgroundTimer);
      backgroundTimer = null;
    };

    const stop = () => {
      subscription?.remove();
      subscription = null;
    };

    const start = async () => {
      if (!active || appState !== "active" || subscription) return;
      if (starting) {
        pendingStart = true;
        return;
      }
      starting = true;
      pendingStart = false;
      const generation = ++startGeneration;
      try {
        let services = await Location.hasServicesEnabledAsync();
        if (!services && Platform.OS === "android") {
          try {
            await Location.enableNetworkProviderAsync();
          } catch {}
          services = await Location.hasServicesEnabledAsync();
        }
        if (!services)
          throw new Error(
            "Activa la ubicación (GPS) del dispositivo para iniciar la jornada.",
          );
        let permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== "granted" && permission.canAskAgain) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (permission.status !== "granted")
          throw new Error(
            permission.canAskAgain
              ? "Mi Radar necesita permiso de ubicación mientras utilizas el aplicativo."
              : "Permiso de ubicación bloqueado. Toca aquí para habilitarlo en Ajustes.",
          );
        if (!active || generation !== startGeneration || appState !== "active") return;
        setError("");
        const cached = await Location.getLastKnownPositionAsync({
          maxAge: 60_000,
          requiredAccuracy: 100,
        });
        if (active && generation === startGeneration && cached) {
          setLocation({
            latitude: cached.coords.latitude,
            longitude: cached.coords.longitude,
            accuracy: cached.coords.accuracy,
          });
        }
        const nextSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            mayShowUserSettingsDialog: true,
            timeInterval: 5_000,
            distanceInterval: 0,
          },
          async (position) => {
            if (!active) return;
            const next = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
            setLocation(next);
            const now = Date.now();
            if (now - lastSent < 7000) return;
            lastSent = now;
            try {
              const asesorId = Number(userRef.current?.id_asesor || userRef.current?.id);
              await apiRef.current("/api/campo/ubicacion", {
                method: "PATCH",
                body: JSON.stringify({
                  id: isNaN(asesorId) ? undefined : asesorId,
                  latitud: next.latitude,
                  longitud: next.longitude,
                  precision: next.accuracy,
                }),
              });
            } catch {
              // El GPS sigue activo aunque falle temporalmente el envío.
            }
          },
        );
        if (!active || generation !== startGeneration) {
          nextSubscription.remove();
          return;
        }
        subscription = nextSubscription;
      } catch (locationError: any) {
        if (active)
          setError(locationError.message || "Ubicación no disponible.");
      } finally {
        starting = false;
        if (pendingStart && active && appState === "active" && !subscription) {
          pendingStart = false;
          setTimeout(() => start(), 0);
        }
      }
    };

    start();
    stateSubscription = AppState.addEventListener("change", (state) => {
      const previous = appState;
      appState = state;
      if (state === "active" && previous !== "active") {
        clearBackgroundTimer();
        start();
      } else if (state === "background") {
        clearBackgroundTimer();
        backgroundTimer = setTimeout(() => {
          if (appState !== "active") {
            startGeneration += 1;
            stop();
          }
        }, 1500);
      }
    });

    return () => {
      active = false;
      startGeneration += 1;
      clearBackgroundTimer();
      stop();
      stateSubscription?.remove();
    };
  }, [enabled]);

  return { location, error };
}