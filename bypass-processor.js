class BypassProcessor extends AudioWorkletProcessor
{
	process (inputs, outputs, params)
	{
		// By default, the node has single input and output.
		const input = inputs[0];
		const output = outputs[0];

		for (let channel = 0; channel < output.length && channel < input.length; ++channel)
			output[channel].set(input[channel]);

		return true;
	}
}

registerProcessor ('bypass-processor', BypassProcessor);
