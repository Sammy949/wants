import { useWantsRepo } from "@/data/provider";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// Temporary screen: proves the database opens and migrates on a real device.
export default function Index() {
  const repo = useWantsRepo();
  const [status, setStatus] = useState("Opening database…");

  useEffect(() => {
    repo
      .stats()
      .then((s) => setStatus(`Database ready. ${s.wanting} wanting, ${s.got} got.`))
      .catch((e: unknown) => setStatus(`Database error: ${String(e)}`));
  }, [repo]);

  return (
    <View style={styles.container}>
      <Text>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
