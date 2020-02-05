class StereoSwitcher extends AudioWorkletProcessor
{
	process (inputs, outputs, params)
	{
		// By default, the node has single input and output.
		const input = inputs[0];
		const output = outputs[0];
		//Switch stereo channels
		for (let channel = 0; channel < output.length; ++channel)
			if (input.length>1)
				output[channel].set(input[channel ? 0 : 1]);
			else
				output[channel].set(input[0]);

		return true;
	}
}

registerProcessor ('stereo-switcher', StereoSwitcher);
