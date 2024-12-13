import React, { useState, useRef } from 'react';

const Recorder = () => {
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState('');
    const [transcript, setTranscript] = useState('');
    const [recordingLabel, setRecordingLabel] = useState('');
    const [recordingCount, setRecordingCount] = useState(1);
    const mediaRecorderRef = useRef(null);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000 } }); // Ensure sample rate is 16,000 Hz
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks = [];
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(audioBlob);
            setAudioURL(url);
            setRecordingLabel(`Recording #${recordingCount}`);
            setRecordingCount((prevCount) => prevCount + 1);
            uploadAudio(audioBlob);
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
                if (data.transcript) {
                    setTranscript(data.transcript);
                } else {
                    alert(`Error: ${data.error}`);
                }
            })
            .catch((err) => {
                console.error('Error uploading audio:', err);
                setTranscript('An error occurred while processing the audio.');
            });
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Audio Recorder</h1>
            <button onClick={startRecording} disabled={recording}>
                Start Recording
            </button>
            <button onClick={stopRecording} disabled={!recording}>
                Stop Recording
            </button>
            {audioURL && (
                <div style={{ marginTop: '20px' }}>
                    <h3>{recordingLabel}</h3>
                    <audio controls src={audioURL}></audio>
                </div>
            )}
            {transcript && (
                <div
                    style={{
                        marginTop: '20px',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        backgroundColor: '#f9f9f9',
                        width: '300px',
                    }}
                >
                    <h3>Transcript:</h3>
                    <p>{transcript}</p>
                    <button
                        onClick={() => {
                            const blob = new Blob([transcript], { type: 'text/plain' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `${recordingLabel.replace(' ', '_')}_transcript.txt`;
                            link.click();
                        }}
                        style={{
                            marginTop: '10px',
                            padding: '10px 20px',
                            border: 'none',
                            backgroundColor: '#007BFF',
                            color: 'white',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        Download Transcript
                    </button>
                </div>
            )}
        </div>
    );
};

export default Recorder;