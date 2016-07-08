"""
========================================================================
Color Deconvolution Using Ruifrok Algorithm
========================================================================

This examples the deconvolution of a H&E stained image using a supervised
color deconvolution algorithm developed by Ruifrok *et. al.* [1]_. This
algorithm needs the color vector (RGB) of each stain used in the image.

.. [1] A. C. Ruifrok and D. A. Johnston, "Quantification of histochemical
       staining by color deconvolution.," Analytical and quantitative
       cytology and histology / the International Academy of Cytology [and]
       American Society of Cytology, vol. 23, no. 4, pp. 291-9, Aug. 2001.
"""

import histomicstk as htk
import matplotlib.pyplot as plt
import numpy as np
import skimage.io

# load input image
inputImageFile = ('https://data.kitware.com/api/v1/file/'
                  '576ad39b8d777f1ecd6702f2/download')

imInput = skimage.io.imread(inputImageFile)[:, :, :3]

# create stain to color map
stainColorMap = {
    'hematoxylin': [0.65, 0.70, 0.29],
    'eosin':       [0.07, 0.99, 0.11],
    'dab':         [0.27, 0.57, 0.78],
    'null':        [0.0, 0.0, 0.0]
}

# specify stains of input image
stain_1 = 'hematoxylin'   # nuclei stain
stain_2 = 'eosin'         # cytoplasm stain
stain_3 = 'null'          # set to null if input contains only two stains

# create stain matrix
W = np.array([stainColorMap[stain_1],
              stainColorMap[stain_2],
              stainColorMap[stain_3]]).T

# perform standard color deconvolution
imDeconvolved = htk.ColorDeconvolution(imInput, W).Stains

# Display results
fig, ax = plt.subplots(1, 3,
                       figsize=(8, 2.5),
                       sharex=True, sharey=True,
                       subplot_kw={'adjustable': 'box-forced'})
ax = ax.ravel()

ax[0].imshow(imInput)
ax[0].set_title('original image')

ax[1].imshow(imDeconvolved[:, :, 0], cmap=plt.cm.gray)
ax[1].set_title(stain_1)

ax[2].imshow(imDeconvolved[:, :, 1], cmap=plt.cm.gray)
ax[2].set_title(stain_2)

for a in ax.ravel():
    a.axis('off')

fig.tight_layout()