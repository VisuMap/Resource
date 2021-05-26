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
md = mu.ModelBuilder(job=co.job)


#=============================================================
K, L = 100, 2000
co.Test1 = 0.001, 0.8, 3*[60], 5, True  # 0.58,0.59,0.60
co.Test2 = 0.001, 0.8, 3*[40], 5, False # 0.58,0.58,0.60
co.Large = 0.00025, 0.8, 5*[100], 25, True
co.Small = 0.00025, 0.8, 3*[60], 5, False

md.r0, md.decay, layers, augDim, addDropout = co.Small

D = np.random.randint(K, size=(L, 2))
Y = np.array([[Fct(a,b)] for a, b in D ])

#=============================================================

md.InitModel(0, 1)
ds2 = AugDataset4(md, Y,  D, md.AddAugment2(augDim, augDim))

md.AddLayers(layers[0])
if addDropout: 
    md.AddDropout(0.90)
md.AddLayers(layers[1:])
md.AddLayers(1, activation=tf.nn.tanh)
md.cost = md.SquaredCost(md.Output(), md.Label())
md.SetAdamOptimizer(co.epochs, ds2.N)

#=============================================================
evInfo = ds2.EvalAllInit()

def EpochCall(ep):
    tit = '%d: Training epoch %d'%(co.job,ep)
    md.log.ShowMatrix(ds2.EvalAll(evInfo), 
        view=6, access='r', viewIdx=co.job, title=tit )
    A = np.concatenate((ds2.a0.aug, ds2.a1.aug), axis = 1 )
    md.log.ShowMatrix(A, view=3, access='r', viewIdx=co.job, title=tit)
    return True
md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, epCall=EpochCall)

#=============================================================

M = ds2.EvalAll(evInfo)
dset = set(d[0]*K + d[1] for d in D)
pErr, tErr = [], []
for i, j in itertools.product(range(K), range(K)):
    pt = tErr if (i*K+j) in dset else pErr
    pt.append(M[i, j] - Fct(i,j))
err = np.mean(np.abs(tErr+pErr))
tErr = np.mean(np.abs(tErr))
pErr = np.mean(np.abs(pErr))
md.log.LogMsg('DP %d: tError: %.2f,  pError: %.2f, err: %.2f'%(co.job, tErr, pErr, err))

if co.job == 10:
    for i, j in itertools.product(range(K), range(K)):
        M[i, j] = Fct(i, j)
    md.log.ShowMatrix(M, view=6, title='Training Target')

co.Save(md)
ds2.SaveAugment(co.modelName)
md.Save(co.modelName)
time.sleep(5.0)