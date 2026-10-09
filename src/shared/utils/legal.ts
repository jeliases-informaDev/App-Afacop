import { Alert, Linking } from "react-native";

// Google Play exige que la política de privacidad sea accesible dentro de la propia app,
// además de estar enlazada en la ficha de la tienda. Si la dirección cambia, se actualiza aquí.
export const POLITICA_PRIVACIDAD_URL =
  "https://afacop-backend.onrender.com/privacidad/radar360";

// Aviso junto a la firma: es el momento en que el cliente entrega sus datos. Texto en
// borrador: debe validarlo el área legal o la entidad contratante.
export const AVISO_PRIVACIDAD_FIRMA =
  "Tus datos personales, tu firma y las fotografías de esta visita serán tratados por la entidad acreedora y por InformaPerú, como encargado, para registrar y acreditar la gestión, conforme a la Ley N.º 29733.";

export async function abrirPoliticaPrivacidad(): Promise<void> {
  try {
    await Linking.openURL(POLITICA_PRIVACIDAD_URL);
  } catch {
    Alert.alert(
      "No se pudo abrir",
      `Abre este enlace en tu navegador:\n${POLITICA_PRIVACIDAD_URL}`,
    );
  }
}
