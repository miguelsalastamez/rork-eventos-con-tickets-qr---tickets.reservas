import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Página no encontrada" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta página no existe.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Ir al inicio</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: '#111827',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#6366f1",
  },
});
