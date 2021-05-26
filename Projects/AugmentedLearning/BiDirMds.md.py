#=========================================================================
# Model generator for Augmented Learning
#=========================================================================
import ModelUtil as mu
import numpy as np
import tensorflow as tf
from AugUtil import AugDataset

co = mu.CmdOptions()
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder(job = co.job)

co.Bed = 5, 1*[250], 2*[250], 1.0,  0.8, 0.01
co.GEOD = 25, 1*[200], 2*[250], 1.0,  0.825, 0.01    # 500 Epocsh: last cost: 0.6
co.Test = 25, 1*[200], 2*[250], 1.0,  0.825, 0.01

augDim, netCfg, netCfg2, c2Bias, md.decay, md.r0 = co.Test

ds.Y = ds.X
md.InitModel(0, ds.Y.shape[1])
augVar = md.AddAugment(aDim=augDim)
md.AddLayers(netCfg)

ds2 = AugDataset(ds, md, augVar)

md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
cost1 = md.SquaredCost(md.Output(), md.Label())
pMap = tf.identity(md.Output(), name='PhenoMap')

md.top = md.Label()
md.AddLayers(netCfg2)
md.AddLayers(ds2.augDim, tf.nn.tanh)
cost2 = md.SquaredCost(md.Output(), augVar)

md.cost = cost1
if c2Bias != 0.0:
     md.cost +=  c2Bias*cost2

#============================================================

md.log.CfgHistogram(3, 'Decode Error', 0)
md.log.CfgHistogram(4, 'Encode Error', 0)
def EpochCall(ep):
    cost = np.zeros([2], np.float32)
    for k in range(ds2.N):
        feed = {md.outputHod:ds2.Y[k]}
        feed.update(ds2.PushFeed(k))
        cost += md.sess.run([cost1, cost2], feed)
    msg = '%d,%d: %.3f, %.3f'%(co.job, ep, cost[0], cost[1])
    print(msg)
    md.log.SetStatus(msg)
    md.log.ExtHistogram(3, cost[0], co.job)
    md.log.ExtHistogram(4, cost[1], co.job)    
    return False 

md.SetAdamOptimizer(co.epochs, ds2.N)
md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, epCall=EpochCall)
md.log.ShowMatrix(ds2.aug, view=2, title='Augment Map')
ds2.SaveAugment(co.modelName)
co.Save(md)
md.Save(co.modelName)