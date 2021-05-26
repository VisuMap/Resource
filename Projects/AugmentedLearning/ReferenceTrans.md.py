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

co.GEOD = 1*[250], 250, 1*[250], 0.8, 0.003 # 500 epochs: last cost: 0.76 ~ 0.80
co.MouseHeart = 1*[250], 200, 1*[250], 0.8, 0.003
co.MouseTr = 0*[250], 100, 1*[250], 0.9, 0.01   # Log Transformed:2D Model1: 500 epochs: cost: 68.76 - 69
co.Test = 0*[250], 3, 1*[500], 0.9, 0.005
N0, augDim, N1, md.decay, md.r0  = co.Test

ds.Y = ds.X
md.InitModel(0, ds.Y.shape[1])

if len(N0) > 0:
    R = np.max(ds.X, axis=0)
    md.top = tf.constant(R, shape=[1, R.shape[0]])
    md.AddLayers(N0)

augVar = md.AddAugment(aDim=augDim)
md.AddLayers(N1)
augVar = [augVar, md.AddAugment(aDim=augDim)]
md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
md.cost = md.SquaredCost(md.Output(), md.Label())

ds2 = AugDataset(ds, md, augVar)
md.SetAdamOptimizer(co.epochs, ds2.N)

def EpCall(ep):
    #md.log.ShowMatrix(ds2.aug, view=2, access='r', viewIdx=co.job, title='Job:%d'%co.job)
    return True

md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, EpCall)

co.Save(md)
ds2.SaveAugment(co.modelName)
md.Save(co.modelName)
