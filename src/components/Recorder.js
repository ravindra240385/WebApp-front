import React, { useState, useRef } from "react";

const Recorder = () => {
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const [transcript, setTranscript] = useState("");
    const [minutesOfMeeting, setMinutesOfMeeting] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Start Recording Function (Unchanged)
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                audioChunksRef.current = [];
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);
                uploadAudio(audioBlob);
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
        }
    };

    // Stop Recording Function (Unchanged)
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    // Upload Audio Function (Minor Improvements)
    const uploadAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");
        setIsProcessing(true);

        try {
            const response = await fetch("http://127.0.0.1:5000/transcribe", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setTranscript(data.transcript);
                setErrorMessage(""); // Clear any previous error
            } else {
                setErrorMessage(data.error || "Transcription failed. Try again.");
            }
        } catch (error) {
            setErrorMessage("Error uploading audio.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Generate Minutes of Meeting Function (Enhanced Logging)
    const generateMinutesOfMeeting = async () => {
        if (!transcript) {
            setMinutesOfMeeting("Transcript is empty. Please record and transcribe first.");
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch("http://127.0.0.1:5000/generate_mom", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ transcript }),
            });

            const data = await response.json();
            if (response.ok) {
                setMinutesOfMeeting(data.mom);
                setErrorMessage(""); // Clear any previous error
            } else {
                setErrorMessage(data.error || "Failed to generate MoM.");
            }
        } catch (error) {
            setErrorMessage("Error generating MoM.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div>
            <h1>Meeting Recorder</h1>
            <button onClick={startRecording} disabled={recording}>Start Recording</button>
            <button onClick={stopRecording} disabled={!recording}>Stop Recording</button>

            {audioURL && (
                <div>
                    <h3>Recorded Audio:</h3>
                    <audio src={audioURL} controls />
                    <button onClick={generateMinutesOfMeeting} disabled={isProcessing}>
                        Generate Transcript
                    </button>
                </div>
            )}

            {isProcessing && <p>Processing...</p>}
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

            {transcript && (
                <div>
                    <h3>Transcript:</h3>
                    <p>{transcript}</p>
                </div>
            )}

            {minutesOfMeeting && (
                <div>
                    <h3>Minutes of Meeting:</h3>
                    <p>{minutesOfMeeting}</p>
                </div>
            )}
        </div>
    );
};

export default Recorder;