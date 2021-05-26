#=========================================================================
# Model generator for classification and regression.
#=========================================================================
import time, math, itertools
import tensorflow as tf
import ModelUtil as mu
import numpy as np
from AugUtil import AugDataset4
from AugUtil import Fct

co = mu.CmdOptions()
ds = mu.ModelDataset()
md = mu.ModelBuilder(job=co.job)

Y = np.genfromtxt(co.modelName+"_y.aug", delimiter='|', dtype=np.float32)
D = np.genfromtxt(co.modelName+"_0.aug", delimiter='|', dtype=np.int32)
ds.Y = np.reshape(Y, [-1, 1])
ds.X = D.astype(np.float32)
ds.UpdateAux()

#====================================================

md.InitModel(2, 1)
layers = 3*[60]
md.AddLayers(layers)
md.AddLayers(1, activation=tf.nn.tanh)
md.cost = md.SquaredCost(md.Output(), md.Label())
md.SetAdamOptimizer(co.epochs, ds.N)
md.Train(ds, co.epochs, co.logLevel, co.refreshFreq)

#====================================================
K, L = 100, ds.Y.shape[0]
dset = set(d[0]*K + d[1] for d in D)
uX, uY = [], []
for i, j in itertools.product(range(K), range(K)):
    if (i*K+j) not in dset:
        uX.append([i, j])
        uY.append(Fct(i, j))
uX = np.array(uX, dtype=np.float32)
uY = np.array(uY, dtype=np.float32)

pError = np.mean(np.abs(md.Eval(uX).flatten() - uY))
tError = np.mean(np.abs(md.Eval(ds.X) - ds.Y))
md.log.LogMsg('RG %d: tError: %.2f,  pError: %.2f'%(co.job, tError, pError))

M = np.zeros([K,K], dtype=np.float32)


X = np.zeros([1,2], dtype=np.float32)
fd = {md.inputHod:X}
if md.keepProbVar is not None:
    fd[md.keepProbVar] = 1.0
for i, j in itertools.product(range(K), range(K)):
    X[0] = [i,j]
    M[i, j] = md.sess.run(md.Output(), fd)[0]
md.log.ShowMatrix(M, view=6, title='%d: Test Preduction'%co.job, viewIdx=co.job)

if co.job == 10:
    for i, j in itertools.product(range(K), range(K)):
        M[i, j] = Fct(i, j)
    md.log.ShowMatrix(M, view=6, title='Training Target')


