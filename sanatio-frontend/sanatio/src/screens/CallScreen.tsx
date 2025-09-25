import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { registerGlobals } from "@livekit/react-native";
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  isTrackReference,
} from "@livekit/react-native";
import { Track } from "livekit-client";

// Initialisation de LiveKit
registerGlobals();

// Configuration de l'API HeyGen (à remplacer par vos clés)
const API_CONFIG = {
  apiKey: "VOTRE_CLE_API_HEYGEN_ICI",
  serverUrl: "https://api.heygen.com",
};

export default function App() {
  // États pour la session LiveKit
  const [wsUrl, setWsUrl] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // États pour la session HeyGen
  const [sessionToken, setSessionToken] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  
  // États de l'interface utilisateur
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Fonction pour démarrer une nouvelle session
  const createSession = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 1. Obtenir un jeton de session temporaire de HeyGen
      const responseToken = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.create_token`, {
        method: "POST",
        headers: { "X-Api-Key": API_CONFIG.apiKey },
      });
      const tokenData = await responseToken.json();
      const newSessionToken = tokenData.data.token;
      setSessionToken(newSessionToken);

      // 2. Créer une nouvelle session de streaming avec ce jeton
      const responseNew = await fetch(`${API_CONFIG.serverUrl}/v1/streaming.new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${newSessionToken}`,
        },
        body: JSON.stringify({ quality: "high", version: "v2", video_encoding: "H264" }),
      });
      const newData = await responseNew.json();
      
      if (newData.data) {
        const newSessionId = newData.data.session_id;
        setSessionId(newSessionId);
        setWsUrl(newData.data.url); // URL du serveur LiveKit
        setToken(newData.data.access_token); // Jeton d'accès LiveKit
        setConnected(true);
      }
    } catch (error) {
      console.error("Erreur lors de la création de la session:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour envoyer du texte à l'avatar
  const sendTextToAvatar = async () => {
    if (!text.trim() || speaking) return;
    setSpeaking(true);
    try {
      await fetch(`${API_CONFIG.serverUrl}/v1/streaming.task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ session_id: sessionId, text: text, task_type: "talk" }),
      });
      setText(""); // Vider le champ de saisie
    } catch (error) {
      console.error("Erreur lors de l'envoi du texte:", error);
    } finally {
      setSpeaking(false);
    }
  };

  // Fonction pour fermer la session
  const closeSession = async () => {
    setLoading(true);
    try {
      await fetch(`${API_CONFIG.serverUrl}/v1/streaming.stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      // Réinitialiser tous les états
      setConnected(false);
      setWsUrl("");
      setToken("");
      setSessionId("");
      setSessionToken("");
    } catch (error) {
      console.error("Erreur lors de la fermeture de la session:", error);
    } finally {
      setLoading(false);
    }
  };

  // Affichage de l'écran de démarrage si non connecté
  if (!connected) {
    return (
      <View style={styles.startContainer}>
        <Text style={styles.heroTitle}>HeyGen Avatar Streaming</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={createSession}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.startButtonText}>Démarrer la Session</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  // Affichage de la session LiveKit si connecté
  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={true}
      audio={false}
      video={false}
    >
      <RoomView
        onSendText={sendTextToAvatar}
        text={text}
        onTextChange={setText}
        speaking={speaking}
        onClose={closeSession}
        loading={loading}
      />
    </LiveKitRoom>
  );
}

// Le composant qui affiche la vidéo de l'avatar et les contrôles
const RoomView = (props: any) => {
  // On utilise useTracks pour obtenir la piste vidéo de l'avatar
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.videoContainer}>
          {/* On affiche la première piste vidéo reçue, qui est celle de l'avatar */}
          {tracks.length > 0 && isTrackReference(tracks[0]) ? (
            <VideoTrack style={styles.videoView} trackRef={tracks[0]} />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>En attente de l'avatar...</Text>
            </View>
          )}
        </View>

        {/* Contrôles */}
        <View style={styles.controls}>
          <TextInput
            style={styles.input}
            placeholder="Écrivez quelque chose..."
            placeholderTextColor="#999"
            value={props.text}
            onChangeText={props.onTextChange}
            editable={!props.speaking}
          />
          <TouchableOpacity
            style={[styles.sendButton, (props.speaking || !props.text.trim()) && styles.disabledButton]}
            onPress={props.onSendText}
            disabled={props.speaking || !props.text.trim()}
          >
            <Text style={styles.sendButtonText}>{props.speaking ? "..." : "Envoyer"}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={props.onClose}>
          <Text style={styles.closeButtonText}>Terminer</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  startContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" },
  heroTitle: { fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 20 },
  startButton: { backgroundColor: "#5865F2", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  startButtonText: { color: "white", fontSize: 18, fontWeight: "600" },
  videoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoView: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 10 },
  closeButton: { position: 'absolute', top: 60, right: 20, backgroundColor: 'rgba(255, 59, 48, 0.8)', padding: 10, borderRadius: 20 },
  closeButtonText: { color: 'white', fontWeight: 'bold' },
  controls: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#333', backgroundColor: '#1a1a1a' },
  input: { flex: 1, height: 50, backgroundColor: '#333', borderRadius: 25, paddingHorizontal: 20, color: 'white', fontSize: 16 },
  sendButton: { marginLeft: 10, backgroundColor: "#5865F2", justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 25 },
  sendButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  disabledButton: { opacity: 0.5 },
});