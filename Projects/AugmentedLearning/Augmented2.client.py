# File: Augmented2.client.py
# ==========================================================

import sys, socket, struct, time
import numpy as np
from ServerUtil import *
from DataUtil import *
from ModelClient import *

md = ModelClient(int(sys.argv[1]))
mdName = md.GetModelName()
print("Model:", mdName)

Aug = np.genfromtxt(mdName + '.aug', delimiter='|').astype(np.float32)
K, aDim = Aug.shape[0], Aug.shape[1]
X, Y  = md.log.OpenDataset('', target='Shp', dataGroup=3, tmout=60)
dsList = []
for k in range(3): 
    dsList += Trans0(Y, 12, k)

md.log.ShowMatrix(Aug, view=1, access='n', title='Augmentation')

md.UploadInput(X)
for k in range(K):
    md.WriteVariable('Augment:0', np.reshape(Aug[k,:], (aDim, 1)))
    ret = md.GetTensor(None, 'PhenoMap') * 0.75/0.0009859155 
    acs = 'n' if k%12 == 0 else 'a'
    md.log.ShowMatrix(ret, view=13, access=acs)

    ret = md.GetTensor2(dsList[k],  'OutputTensor')
    ret = np.mean(ret, axis=0)
    md.log.ShowMatrix(ret, view=1, access=acs, title='Rotation:%d'%k)
    time.sleep(0.5)

