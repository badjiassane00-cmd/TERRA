"""EfficientNet-B4 classifier architecture adapted from the MIT-licensed Plant Disease Detector.
Upstream: https://github.com/khawaja1447/plant-disease-detector
"""

import torch.nn as nn
from torchvision import models


class EfficientNetB4Classifier(nn.Module):
    def __init__(self, num_classes: int = 38, dropout: float = 0.4):
        super().__init__()
        backbone = models.efficientnet_b4(weights=None)
        self.features = backbone.features
        self.avgpool = backbone.avgpool
        self.classifier = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(1792, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout / 2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = x.flatten(1)
        return self.classifier(x)
