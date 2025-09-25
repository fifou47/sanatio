import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  useRoom,
  useParticipant,
  VideoView,
  Room,
} from '@livekit/react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Camera, Microphone } from 'lucide-react-native';

// Écran principal qui enveloppe la logique de la salle
export const CallScreen = () => {
  const route = useRoute();
  const { url, token } = route.params as { url: string; token: string };

  if (!url || !token) {
    return (
      <View style={styles.container}>
        <Text>URL ou jeton manquant.</Text>
      </View>
    );
  }

  return (
    <Room
      serverUrl={url}
      token={token}
      audio={true}
      video={true}
      connect={true}
    >
      <VideoCall />
    </Room>
  );
};

// Le composant qui affiche l'appel lui-même
const VideoCall = () => {
  const navigation = useNavigation();
  const { participants, localParticipant } = useRoom();
  const [isCameraEnabled, setCameraEnabled] = useState(true);
  const [isMicEnabled, setMicEnabled] = useState(true);

  const onHangup = () => {
    navigation.goBack();
  };

  const onToggleCamera = () => {
    localParticipant.setCameraEnabled(!isCameraEnabled);
    setCameraEnabled(!isCameraEnabled);
  };

  const onToggleMic = () => {
    localParticipant.setMicrophoneEnabled(!isMicEnabled);
    setMicEnabled(!isMicEnabled);
  };

  return (
    <View style={styles.container}>
      {/* Vidéo locale */}
      <VideoView
        style={styles.localVideo}
        videoTrack={localParticipant.videoTrack}
        objectFit="cover"
      />

      {/* Vidéos des participants distants */}
      <View style={styles.remoteParticipantsContainer}>
        {participants.map((participant) => (
          <ParticipantView key={participant.identity} participant={participant} />
        ))}
      </View>

      {/* Barre de contrôles */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={onToggleMic} style={styles.controlButton}>
          <Microphone color={isMicEnabled ? 'white' : 'red'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleCamera} style={styles.controlButton}>
          <Camera color={isCameraEnabled ? 'white' : 'red'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onHangup} style={[styles.controlButton, styles.hangupButton]}>
          <Text style={styles.hangupText}>Raccrocher</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Composant pour afficher un seul participant
const ParticipantView = ({ participant }) => {
  const { videoTrack } = useParticipant(participant);
  return (
    <VideoView
      style={styles.remoteVideo}
      videoTrack={videoTrack}
      objectFit="cover"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  localVideo: {
    width: 120,
    height: 180,
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    borderRadius: 8,
  },
  remoteParticipantsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  remoteVideo: {
    width: '50%',
    height: '50%',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 50,
  },
  hangupButton: {
    backgroundColor: 'red',
  },
  hangupText: {
    color: 'white',
    fontWeight: 'bold',
  },
});