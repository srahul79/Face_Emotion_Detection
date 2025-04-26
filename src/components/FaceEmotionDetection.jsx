import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './FaceEmotionDetection.css';

const FaceEmotionDetection = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);
  const [emotion, setEmotion] = useState('');
  const [confidence, setConfidence] = useState(0);

  const videoRef = useRef();
  const canvasRef = useRef();
  const videoHeight = 480;
  const videoWidth = 640;

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };
    
    loadModels();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error("Error accessing the camera:", err);
      });
  };

  const handleVideoOnPlay = () => {
    const displaySize = {
      width: videoWidth,
      height: videoHeight
    };

    const detectionInterval = setInterval(async () => {
      if (canvasRef.current && videoRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        faceapi.matchDimensions(canvas, displaySize);
        
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();
          
        //Resize
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        canvas.getContext('2d').clearRect(0, 0, videoWidth, videoHeight);
        
        //Draw
        if (resizedDetections.length > 0) {
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
          
          const expressions = resizedDetections[0].expressions;
          const maxExpression = Object.entries(expressions).reduce((max, expression) => 
            expression[1] > max[1] ? expression : max
          );
          
          setEmotion(maxExpression[0]);
          setConfidence(Math.round(maxExpression[1] * 100));
        } else {
          setEmotion('');
          setConfidence(0);
        }
      }
    }, 100);

    videoRef.current.detectionInterval = detectionInterval;
  };

  const closeWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      if (videoRef.current.detectionInterval) {
        clearInterval(videoRef.current.detectionInterval);
      }
      
      videoRef.current.srcObject.getTracks().forEach(track => {
        track.stop();
      });
      
      setCaptureVideo(false);
      setEmotion('');
      setConfidence(0);
    }
  };

  return (
    <div className="emotion-detection-container">
      <div className="models-status">
        {modelsLoaded ? (
          <p className="models-loaded">Models loaded successfully!</p>
        ) : (
          <p className="models-loading">Loading models... please wait</p>
        )}
      </div>
      
      <div className="button-container">
        {captureVideo && modelsLoaded ? (
          <button
            onClick={closeWebcam}
            className="button button-stop"
          >
            Stop Camera
          </button>
        ) : (
          <button
            onClick={startVideo}
            disabled={!modelsLoaded}
            className="button button-start"
          >
            Start Camera
          </button>
        )}
      </div>
      
      {captureVideo && (
        <div className="video-container">
          <video
            ref={videoRef}
            height={videoHeight}
            width={videoWidth}
            onPlay={handleVideoOnPlay}
          />
          <canvas
            ref={canvasRef}
            height={videoHeight}
            width={videoWidth}
          />
        </div>
      )}
      
      {emotion && (
        <div className="emotion-card">
          <div className="emotion-name">
            Detected Emotion: <span className="emotion-highlight">{emotion}</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
            <span className="progress-text">{confidence}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceEmotionDetection;