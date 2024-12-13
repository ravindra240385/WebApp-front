import React, { useState, useRef } from 'react';

const Recorder = () => {
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState('');
    const mediaRecorderRef = useRef(null);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks = [];
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const url = URL.createObjectURL(audioBlob);
            setAudioURL(url);
            uploadAudio(audioBlob); // Send the audio file to the backend
        };

        mediaRecorder.start();
        setRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        setRecording(false);
    };

    const uploadAudio = (audioBlob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob);

        fetch('http://127.0.0.1:5000/transcribe', {
            method: 'POST',
            body: formData,
        })
            .then((res) => res.json())
            .then((data) => {
                alert(`Transcript: ${data.transcript}`);
            })
            .catch((err) => {
                console.error('Error uploading audio:', err);
                alert('Failed to upload audio.');
            });
    };

    return (
        <div>
            <h1>Audio Recorder</h1>
            <button onClick={startRecording} disabled={recording}>
                Start Recording
            </button>
            <button onClick={stopRecording} disabled={!recording}>
                Stop Recording
            </button>
            {audioURL && (
                <div>
                    <h3>Recorded Audio:</h3>
                    <audio controls src={audioURL}></audio>
                </div>
            )}
        </div>
    );
};

export default Recorder;