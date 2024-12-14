import React, { useState, useRef } from 'react';

const Recorder = () => {
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState('');
    const [transcript, setTranscript] = useState('');
    const [minutes, setMinutes] = useState('');
    const [recordingLabel, setRecordingLabel] = useState('');
    const [recordingCount, setRecordingCount] = useState(1);
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

    const generateMinutes = () => {
        fetch('http://127.0.0.1:5000/generate-mom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.minutes_of_meeting) {
                    setMinutes(data.minutes_of_meeting);
                } else {
                    alert(`Error: ${data.error}`);
                }
            })
            .catch((err) => {
                console.error('Error generating minutes:', err);
                setMinutes('An error occurred while generating minutes.');
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
                    <h3>{recordingLabel}</h3>
                    <audio controls src={audioURL}></audio>
                </div>
            )}
            {transcript && (
                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
                    <h3>Transcript:</h3>
                    <p>{transcript}</p>
                    <button onClick={generateMinutes} style={{ marginTop: '10px' }}>
                        Generate Minutes of Meeting
                    </button>
                </div>
            )}
            {minutes && (
                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #007bff', borderRadius: '8px', backgroundColor: '#f1f8ff' }}>
                    <h3>Minutes of Meeting:</h3>
                    <p>{minutes}</p>
                </div>
            )}
        </div>
    );
};

export default Recorder;