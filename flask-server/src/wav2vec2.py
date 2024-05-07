"""
Adapted from:

Speech Recognition with Wav2Vec2
================================

**Author**: `Moto Hira <moto@meta.com>`__

This tutorial shows how to perform speech recognition using using
pre-trained models from wav2vec 2.0
[`paper <https://arxiv.org/abs/2006.11477>`__].


Creates a Wav2Vec2 transcription endpoint
"""

import torch
import torchaudio

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def run(*, file=None, flag=True):
    bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
    model = bundle.get_model().to(device)
    
    waveform, sample_rate = torchaudio.load(file)
    waveform = waveform.to(device)
    
    if sample_rate != bundle.sample_rate:
        waveform = torchaudio.functional.resample(waveform, sample_rate, bundle.sample_rate)
    
    with torch.inference_mode():
        features, _ = model.extract_features(waveform)

    with torch.inference_mode():
        emission, _ = model(waveform)
    
    class GreedyCTCDecoder(torch.nn.Module):
        def __init__(self, labels, blank=0):
            super().__init__()
            self.labels = labels
            self.blank = blank
    
        def forward(self, emission: torch.Tensor) -> str:
            """Given a sequence emission over labels, get the best path string
            Args:
              emission (Tensor): Logit tensors. Shape `[num_seq, num_label]`.
    
            Returns:
              str: The resulting transcript
            """
            indices = torch.argmax(emission, dim=-1)  # [num_seq,]
            indices = torch.unique_consecutive(indices, dim=-1)
            indices = [i for i in indices if i != self.blank]
            return "".join([self.labels[i] for i in indices])
    
    decoder = GreedyCTCDecoder(labels=bundle.get_labels())
    transcript = decoder(emission[0])
    
    if flag:
        print(transcript)
    else:
        return transcript
    
if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        run(file = sys.argv[1])
    else:
        run()
