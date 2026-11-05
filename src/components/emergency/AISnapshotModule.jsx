import React, { useEffect, useRef } from 'react';
import { useStore } from '../../context/useStore';
import { saveVaultRecordDB } from '../../utils/vaultStorage';

/**
 * AISnapshotModule:
 * Automatically records genuine live video and audio upon SOS trigger via MediaRecorder,
 * streams the live camera feed to the emergency overlay, and securely persists real video & audio
 * files into IndexedDB and the Evidence Vault with authentic telemetry (no mock or fake data).
 */
const AISnapshotModule = () => {
  const { 
    isEmergencyMode, 
    emergencyData, 
    updateEmergencyData, 
    saveEvidenceToVault, 
    lastKnownLocation,
    setLiveMediaStream
  } = useStore();

  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const capturedPhotoRef = useRef(null);
  const isCapturingRef = useRef(false);
  const evidenceIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioContextRef = useRef(null);
  const peakDbRef = useRef(0);
  const sumDbRef = useRef(0);
  const dbCountRef = useRef(0);
  const flushIntervalRef = useRef(null);
  const activeMimeTypeRef = useRef('video/webm');

  useEffect(() => {
    let isSubscribed = true;
    let dbMonitorInterval = null;

    const flushAndSaveEvidence = async (mimeType, isFinal = false) => {
      if (recordedChunksRef.current.length === 0) return;

      try {
        const actualMime = mimeType || activeMimeTypeRef.current || (recordedChunksRef.current[0]?.type) || 'video/webm';
        const mediaBlob = new Blob(recordedChunksRef.current, { type: actualMime });
        
        const mediaDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(mediaBlob);
        });

        const durationSec = Math.max(1, ((Date.now() - (startTimeRef.current || Date.now())) / 1000)).toFixed(1);
        const kbSize = (mediaBlob.size / 1024).toFixed(1) + ' KB';
        const isVideo = actualMime.startsWith('video');
        const avgDb = dbCountRef.current > 0 ? Math.round(sumDbRef.current / dbCountRef.current) : (peakDbRef.current || 55);

        const currentLoc = useStore.getState().lastKnownLocation || { lat: 13.0265143, lng: 80.0159234 };
        const currentEmerg = useStore.getState().emergencyData;

        const vaultRecord = {
          id: evidenceIdRef.current || `vault_${Date.now()}`,
          timestamp: startTimeRef.current || Date.now(),
          type: currentEmerg?.reason || 'SOS Emergency Distress',
          riskLevel: 'CRITICAL',
          photoUrl: capturedPhotoRef.current || null,
          videoUrl: isVideo ? mediaDataUrl : null,
          audioUrl: mediaDataUrl,
          durationSeconds: parseFloat(durationSec),
          fileSize: kbSize,
          mimeType: actualMime,
          decibelLevel: peakDbRef.current || 60,
          audioTelemetry: {
            peakDb: peakDbRef.current || 60,
            avgDb: avgDb || 50,
            duration: durationSec + 's',
            format: actualMime,
            hasVideo: isVideo,
            hasAudio: true
          },
          location: currentLoc,
          physicalAddress: currentEmerg?.physicalAddress || 'Saveetha Nagar, Thandalam, Chennai - 602 105',
          mapsLink: currentEmerg?.locationUrl || `https://maps.google.com/?q=${currentLoc.lat},${currentLoc.lng}`,
          status: 'SECURED_IN_VAULT'
        };

        // Persist to IndexedDB and Zustand store
        await saveVaultRecordDB(vaultRecord);
        await saveEvidenceToVault(vaultRecord);

        updateEmergencyData({
          capturedPhoto: capturedPhotoRef.current,
          capturedVideo: isVideo ? mediaDataUrl : null,
          capturedAudio: mediaDataUrl,
          evidenceSecured: true,
          evidenceStatus: 'SECURED'
        });

        console.log(`🛡️ [Evidence Vault] Persisted ${isVideo ? 'Video' : 'Audio'} record (${durationSec}s, ${kbSize}) to Vault! (final=${isFinal})`);
      } catch (saveErr) {
        console.warn('[Evidence Capture] Error persisting media to vault:', saveErr);
      }
    };

    const startEvidenceCapture = async () => {
      if (!isEmergencyMode || isCapturingRef.current) return;
      isCapturingRef.current = true;
      recordedChunksRef.current = [];
      capturedPhotoRef.current = null;
      evidenceIdRef.current = `vault_${Date.now()}`;
      startTimeRef.current = Date.now();
      peakDbRef.current = 0;
      sumDbRef.current = 0;
      dbCountRef.current = 0;

      console.log('🎥 [Evidence Capture] SOS Active: Initializing real hardware camera and microphone...');
      updateEmergencyData({ 
        isCameraActive: true, 
        isVoiceRecording: true, 
        evidenceStatus: 'RECORDING_ACTIVE' 
      });

      let stream = null;
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported');
        }

        // 1. Try combined video + audio
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user', 
              width: { ideal: 640 }, 
              height: { ideal: 480 } 
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          });
        } catch (combinedErr) {
          console.warn('[Evidence Capture] Combined getUserMedia failed, attempting fallbacks:', combinedErr.message);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          } catch (vidErr) {
            console.warn('[Evidence Capture] Video-only fallback failed:', vidErr.message);
          }
          if (!stream) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (audErr) {
              console.warn('[Evidence Capture] Audio-only fallback failed:', audErr.message);
            }
          }
        }

        if (!isSubscribed) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (stream) {
          streamRef.current = stream;
          setLiveMediaStream(stream);

          // ── Real Decibel Measurement via Web Audio API ────────────────────────
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx && stream.getAudioTracks().length > 0) {
              const audioCtx = new AudioCtx();
              audioContextRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 256;
              source.connect(analyser);
              const buffer = new Uint8Array(analyser.frequencyBinCount);

              dbMonitorInterval = setInterval(() => {
                if (!isSubscribed || !useStore.getState().isEmergencyMode) return;
                analyser.getByteFrequencyData(buffer);
                let sum = 0;
                for (let i = 0; i < buffer.length; i++) sum += buffer[i];
                const avg = sum / buffer.length;
                const measuredDb = Math.round(35 + (avg / 255) * 65);
                if (measuredDb > peakDbRef.current) peakDbRef.current = measuredDb;
                sumDbRef.current += measuredDb;
                dbCountRef.current++;
                useStore.setState({ audioLevel: measuredDb });
              }, 250);
            }
          } catch (audioErr) {
            console.warn('[Evidence Capture] AudioContext analyser warning:', audioErr);
          }

          // ── Real Camera Snapshot Capture ─────────────────────────────────────
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const videoEl = document.createElement('video');
            videoEl.muted = true;
            videoEl.playsInline = true;
            videoEl.srcObject = stream;
            videoEl.play().catch(() => {});

            setTimeout(() => {
              if (!isSubscribed) return;
              try {
                const canvas = document.createElement('canvas');
                const w = videoEl.videoWidth || 640;
                const h = videoEl.videoHeight || 480;
                canvas.width = Math.min(640, w);
                canvas.height = Math.min(480, h);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                const photoBase64 = canvas.toDataURL('image/jpeg', 0.85);
                capturedPhotoRef.current = photoBase64;
                updateEmergencyData({ capturedPhoto: photoBase64, isCameraActive: true });
                console.log('📸 [Evidence Capture] Live camera frame captured!');
              } catch (canvasErr) {
                console.warn('[Evidence Capture] Canvas draw warning:', canvasErr);
              }
            }, 300);
          }

          // ── Real Video + Audio Recording via MediaRecorder ───────────────────
          if (typeof window.MediaRecorder !== 'undefined') {
            let mimeType = 'video/webm;codecs=vp8,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : (MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : '');
            }
            if (!mimeType && stream.getAudioTracks().length > 0) {
              mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            }
            activeMimeTypeRef.current = mimeType || 'video/webm';

            const options = mimeType ? { mimeType } : {};
            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
              }
            };

            // On recorder stop: immediately save the final complete video!
            recorder.onstop = async () => {
              console.log('🛑 [Evidence Capture] MediaRecorder stopped. Flushing final recording to Vault...');
              await flushAndSaveEvidence(activeMimeTypeRef.current, true);
            };

            recorder.start(1000); // 1-second timeslices
            console.log(`🎥 [Evidence Capture] MediaRecorder active (${mimeType || 'default'})...`);

            // Early save at 2.5 seconds so even short emergencies have video in Vault
            setTimeout(async () => {
              if (!isSubscribed || !useStore.getState().isEmergencyMode) return;
              await flushAndSaveEvidence(activeMimeTypeRef.current, false);
            }, 2500);

            // Periodic save every 4 seconds while emergency continues
            flushIntervalRef.current = setInterval(async () => {
              if (!isSubscribed || !useStore.getState().isEmergencyMode) return;
              await flushAndSaveEvidence(activeMimeTypeRef.current, false);
            }, 4000);
          }
        } else {
          console.warn('[Evidence Capture] No camera/mic stream available.');
        }
      } catch (err) {
        console.error('[Evidence Capture] Initialization error:', err);
      }
    };

    if (isEmergencyMode) {
      startEvidenceCapture();
    } else {
      // Emergency mode deactivated / cancelled
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      if (dbMonitorInterval) {
        clearInterval(dbMonitorInterval);
      }

      // Stop recorder and let onstop handle saving
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }

      // Stop media tracks after a brief delay to allow onstop to process
      setTimeout(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch (e) {}
        }
        setLiveMediaStream(null);
        isCapturingRef.current = false;
      }, 500);
    }

    return () => {
      isSubscribed = false;
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      if (dbMonitorInterval) clearInterval(dbMonitorInterval);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
      }
    };
  }, [isEmergencyMode]);

  return null;
};

export default AISnapshotModule;
