class StereoSwitcher extends AudioWorkletProcessor
{
	process (inputs, outputs, params)
	{
		// By default, the node has single input and output.
		const input = inputs[0];
		const output = outputs[0];
		//Switch stereo channels
		for (let channel = 0; channel < output.length; ++channel)
			output[channel ? 0 : 1].set(input[channel]);

		return true;
	}
}

registerProcessor ('stereo-switcher', StereoSwitcher);
