
let delayNode;
let delay = 0;
let jitterHint = 0;
let jitter = 0;

function setDelay(val)
{
	if (!delayNode) return;
	//Set it
	delay = val;
	//Display
	document.getElementById("delay").innerText = val.toFixed(3) +"s";
}

function setJitter(val)
{
	//Set it
	jitterHint = val;
	//Display
	document.getElementById("jitter-hint").innerText = val.toFixed(3) +"s";
}

document.getElementById("delayer").addEventListener('input', function(event) {
	return setDelay(parseFloat(event.target.value));	
}, false);

document.getElementById("jitterHinter").addEventListener('input', function(event) {
	return setJitter(parseFloat(event.target.value));	
}, false);


document.querySelector ("button").onclick = async ()=> {
	
	//Create primary and secondary audio context
	const primary = new window.AudioContext({sampleRate: 48000});
	
	// load dtmf sound
	const primarySource = window.primarySource = primary.createBufferSource();
	const primaryDestination = window.primaryDestination = primary.createMediaStreamDestination();
	const primaryDestinationDelayed = primary.createMediaStreamDestination();
	
	await primary.audioWorklet.addModule('stereo-switcher.js');
	const switcher = new AudioWorkletNode(primary, 'stereo-switcher',{
		outputChannelCount : [2]
	});
	
	//load dtm wav
	const request = new XMLHttpRequest();
	request.open('GET', 'untitled.wav', true);
	request.responseType = 'arraybuffer';
	request.onload = ()=>{
		primary.decodeAudioData(request.response, 
			(buffer)=>{
				primarySource.buffer = buffer;
				primarySource.loop = true;
				primarySource.start(0);
			},
			e=>{"Error with decoding audio data" + e.error}
		);
	};
	request.send();
	
	//Create bypasser for primary context
	await primary.audioWorklet.addModule('bypass-processor.js');
	const bypasser = new AudioWorkletNode(primary, 'bypass-processor');
	
	//Create delay node
	delayNode = primary.createDelay();
	//Set initial delay
	setDelay(0.200);
	setJitter(0.200);
	
	//Creat primary graph
	primarySource
		.connect(delayNode)
		.connect(primaryDestinationDelayed);
	primarySource
		.connect(switcher)
		.connect(primaryDestination);
	//Play primary dtmf
	{
		//show stream
		const audio = document.createElement("audio");
		audio.srcObject  = primaryDestinationDelayed.stream;
		audio.muted = false;
		audio.play();
	}
	
	
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
		audio.muted = false;
		audio.play();
		
		//Show stats
		let prevDelay = 0;
		let prevCount = 0;
		setInterval(async () => {
			
			const stats = await receiver.getStats(track);
			//const recv = await receiver.getReceivers()[0].getStats();
			for (const [key,val] of stats)
			{
				if (val.type== "track")
				{
					//Get difference with previous report
					if (val.jitterBufferEmittedCount!=prevCount)
					{
						//Set itter
						jitter = (val.jitterBufferDelay-prevDelay)/(val.jitterBufferEmittedCount-prevCount);
						document.getElementById("jitter").innerText = jitter.toFixed(3) +"s";
						//Set it
						delayNode.delayTime.value = delay;
						receiver.getReceivers()[0].playoutDelayHint = receiver.getReceivers()[0].jitterBufferDelayHint = jitterHint;
					}
					//Update values
					prevDelay = val.jitterBufferDelay;
					prevCount = val.jitterBufferEmittedCount;
				}
			}
			
		}, 1);
	};
	
	//Interchange candidates
	sender.onicecandidate	= ({candidate}) => candidate && receiver.addIceCandidate(candidate);
	receiver.onicecandidate = ({candidate}) => candidate && sender.addIceCandidate(candidate);
	
	//add audio context dest stream
	sender.addTrack(primaryDestination.stream.getAudioTracks()[0]);
	
	const offer = await sender.createOffer();
	offer.sdp = offer.sdp.replace("useinbandfec=1", "useinbandfec=0; dtx=0; stereo=1; ptime=10; maxptime=10;")
	await sender.setLocalDescription(offer);
	await receiver.setRemoteDescription(offer);
	
	const answer = await receiver.createAnswer();
	answer.sdp = answer.sdp.replace("useinbandfec=1", "useinbandfec=0; dtx=0; stereo=1; ptime=10; maxptime=10;")
	await receiver.setLocalDescription(answer);
	await sender.setRemoteDescription(answer);

	//Started
	document.body.children[0].innerText = "started";
};

