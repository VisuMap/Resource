                                            #=========================================================================
# Generating MDS map by learning transformation from reference pattern:
# The input pattern is a constant reference pattern.
#=========================================================================
import ModelUtil as mu
import numpy as np
import tensorflow as tf
from AugUtil import AugDataset

co = mu.CmdOptions()
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder(job=co.job)

co.Test = 0*[250], 1, 1*[250], 5, 0.8, 0.0025
N0, a0, N1, a1, md.decay, md.r0  = co.Test

ds.Y = ds.X
md.InitModel(0, ds.Y.shape[1])

if len(N0) > 0:
    R = np.max(ds.X, axis=0)
    md.top = tf.constant(R, shape=[1, R.shape[0]])
    md.AddLayers(N0)
augVar = md.AddAugment(aDim=a0)
md.AddLayers(N1)
augVar = [augVar, md.AddAugment(aDim=a1)]
md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
md.cost = md.SquaredCost(md.Output(), md.Label())

ds2 = AugDataset(ds, md, augVar)

md.SetAdamOptimizer(co.epochs, ds2.N)

def EpCall(ep):
    md.log.ShowMatrix(ds2.aug, view=2, access='r', viewIdx=co.job, title='Job:%d'%co.job)
    '''
    if (ep % 10 == 0) and (ep<co.epochs/4):
        for i in range(ds.N):
            av = np.abs(ds2.aug[i])
            f = 1.0/np.max(av)
            ds2.aug[i,:] = f * av * ds2.aug[i,:]
    '''
    return True

md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, EpCall)

co.Save(md)
ds2.SaveAugment(co.modelName)
md.Save(co.modelName)
