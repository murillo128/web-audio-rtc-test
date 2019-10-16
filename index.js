

document.body.onclick = async ()=> {
	
	const producer = new window.AudioContext();
	const oscillator = new OscillatorNode(producer);
	const gain = new GainNode(producer);
	gain.gain.value = 0.05;
	const dest = new MediaStreamAudioDestinationNode(producer);
	
	const consumer = new window.AudioContext();
	await consumer.audioWorklet.addModule('bypass-processor.js');
	const bypasser = new AudioWorkletNode(consumer, 'bypass-processor');
	
	//Create pcs
	const sender	= window.sender   = new RTCPeerConnection();
	const receiver	= window.receiver = new RTCPeerConnection();
	
	receiver.ontrack = ({track}) => {
		if (track.kind!=="audio")
			return;
		//Create stream from track
		const stream = window.stream = new MediaStream([track]);
		
		//show stream
		const audio = document.createElement("audio");
		audio.srcObject  = stream;
		audio.muted = true;
		audio.play();
		
		//Create web audio source from webrtc track
		const source = consumer.createMediaStreamSource(stream);
		//Creat producer graph
		oscillator
			.connect(gain)
			.connect(dest);

		//Create consumer graph
		source
			.connect(bypasser)
			.connect(consumer.destination);
		//Start playing
		oscillator.start();
	};
	
	//Interchange candidates
	sender.onicecandidate	= ({candidate}) => candidate && receiver.addIceCandidate(candidate);
	receiver.onicecandidate = ({candidate}) => candidate && sender.addIceCandidate(candidate);
	
	//add audio context dest stream
	sender.addTrack(dest.stream.getAudioTracks()[0]);
	//sender.addTrack(cam.getVideoTracks()[0],cam);
	//sender.addTrack(cam.getAudioTracks()[0],cam);
	
	const offer = await sender.createOffer();
	await sender.setLocalDescription(offer);
	await receiver.setRemoteDescription(offer);
	
	const answer = await receiver.createAnswer();
	await receiver.setLocalDescription(answer);
	await sender.setRemoteDescription(answer);

	
	//Started
	document.body.innerText = "started";
	document.body.onclick = () =>{}
};

