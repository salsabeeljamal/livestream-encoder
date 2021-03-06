import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/demo.module.css';

const CAMERA_CONSTRAINTS = {
  audio: true,
  video: true,
};
// video: { width: 1280, height: 720 },

export default () => {
  const [connected, setConnected] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamKey, setStreamKey] = useState(null);
  const [textOverlay, setTextOverlay] = useState('Welcome Livestrem');

  const inputStreamRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const wsRef = useRef();
  const mediaRecorderRef = useRef();
  const requestAnimationRef = useRef();
  const nameRef = useRef();

  const enableCamera = async () => {
    // navigator.getUserMedia = navigator.getUserMedia =
    //     navigator.getUserMedia ||
    //     navigator.webkitGetUserMedia ||
    //     navigator.mozGetUserMedia;
  
    console.log('navigator.mediaDevices', navigator)
    
    inputStreamRef.current = await navigator.mediaDevices.getUserMedia(
      CAMERA_CONSTRAINTS
    );

    videoRef.current.srcObject = inputStreamRef.current;

    await videoRef.current.play();

    // We need to set the canvas height/width to match the video element.
    canvasRef.current.height = videoRef.current.clientHeight;
    canvasRef.current.width = videoRef.current.clientWidth;

    setInterval(_ => {
      updateCanvas();
    }, 1000/60);
    //requestAnimationRef.current = requestAnimationFrame(updateCanvas);

    setCameraEnabled(true);
  };

  const updateCanvas = () => {
    if (videoRef.current.ended || videoRef.current.paused) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');

    ctx.drawImage(
      videoRef.current,
      0,
      0,
      videoRef.current.clientWidth,
      videoRef.current.clientHeight
    );

    ctx.fillStyle = '#FB3C4E';
    ctx.font = '50px Akkurat';
    ctx.fillText(nameRef.current, 10, 50, canvasRef.current.width - 20);

    //requestAnimationRef.current = requestAnimationFrame(updateCanvas);
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    setStreaming(false);
  };

  const startStreaming = () => {
    setStreaming(true);

    const protocol = window.location.protocol.replace('http', 'ws');
    // const wsUrl = `${protocol}//localhost:3007/rtmp?key=${streamKey}`;
    // const wsUrl = `${protocol}//${window.location.host}?key=${streamKey}`;
    // const wsUrl = 'ws://192.168.0.122:3007/rtmp';
    // wsRef.current = new WebSocket(wsUrl, 'TESTE');

    wsRef.current = new WebSocket(
      `wss://dev.youtube.livestream.goongoonalo.com/rtmp?key=${streamKey}`
    );

    console.log('wsRef.current', wsRef.current);

    wsRef.current.addEventListener('open', function open() {
      setConnected(true);
    });

    wsRef.current.addEventListener('close', () => {
      setConnected(false);
      stopStreaming();
    });

    // const videoOutputStream = canvasRef.current.captureStream(30); // 30 FPS

    // Let's do some extra work to get audio to join the party.
    // https://hacks.mozilla.org/2016/04/record-almost-everything-in-the-browser-with-mediarecorder/
    const audioStream = new MediaStream();
    const audioTracks = inputStreamRef.current.getAudioTracks();
    audioTracks.forEach(function (track) {
      audioStream.addTrack(track);
    });

    const videoStream = new MediaStream();
    const videoTracks = inputStreamRef.current.getVideoTracks();
    videoTracks.forEach(function (track) {
      videoStream.addTrack(track);
    });

    const outputStream = new MediaStream();
    [audioStream, videoStream].forEach(function (s) {
      s.getTracks().forEach(function (t) {
        outputStream.addTrack(t);
      });
    });

    mediaRecorderRef.current = new MediaRecorder(inputStreamRef.current, {
      mimeType: 'video/webm',
      // mimeType: 'video/mp4',
      videoBitsPerSecond: 3000000,
    });

    mediaRecorderRef.current.addEventListener('dataavailable', (e) => {
      console.log('data avai', e.data)
      wsRef.current.send(e.data);
      // wsRef.current.send('sss');
    });

    mediaRecorderRef.current.addEventListener('stop', () => {
      stopStreaming();
      wsRef.current.close();
    });

    mediaRecorderRef.current.start(1000);
  };

  useEffect(() => {
    nameRef.current = textOverlay;
  }, [textOverlay]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(requestAnimationRef.current);
    };
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Wocket</title>
      </Head>

      <div className={styles.info}>
        <h1>Livestream</h1>
        {cameraEnabled &&
          (streaming ? (
            <div>
              <span
                className={`${styles.streamStatus} ${
                  connected ? styles.connected : styles.disconnected
                }`}
              >
                {connected ? 'Connected' : 'Disconnected'}
              </span>
              <input
                placeholder="Text Overlay"
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
              />
              <button onClick={stopStreaming}>Stop Streaming</button>
            </div>
          ) : (
            <>
              <input
                placeholder="Mux Stream Key"
                type="text"
                onChange={(e) => setStreamKey(e.target.value)}
              />
              <button
                className={styles.startButton}
                disabled={!streamKey}
                onClick={startStreaming}
              >
                Start Streaming
              </button>
            </>
          ))}
      </div>
      <div
        className={`${styles.videoContainer} ${
          cameraEnabled && styles.cameraEnabled
        }`}
      >
        {!cameraEnabled && (
          <button className={styles.startButton} onClick={enableCamera}>
            Enable Camera
          </button>
        )}
        <div className={styles.inputVideo}>
          <video ref={videoRef} muted playsInline></video>
        </div>
        <div className={styles.outputCanvas}>
          <canvas ref={canvasRef}></canvas>
        </div>
      </div>
    </div>
  );
};
