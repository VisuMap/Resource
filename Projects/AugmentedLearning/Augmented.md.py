#=========================================================================
# Model generator for Augmented Learning
#=========================================================================
import ModelUtil as mu
import numpy as np
import tensorflow as tf
from AugUtil import AugDataset


co = mu.CmdOptions()
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder()

#========================================
# create dataset list dsList[]
#========================================
ds.Y = ds.X
ds.X = np.mean(ds.X, axis=0)

netCfg, netCfg2, md.decay, c2Bias = 5*[250], 2*[250], 0.8, 10.0
md.r0 = 0.0005
md.InitModel(0, ds.Y.shape[1])
md.top = tf.constant(ds.X, shape=[1, ds.X.shape[0]])
md.AddLayers(netCfg)
augVar = md.AddAugment(aDim=20)

#============================================================
augDim = int(augVar.shape[0])
md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
cost1 = md.SquaredCost(md.Output(), md.Label())
pMap = tf.identity(md.Output(), name='PhenoMap')

md.top = md.Label()
md.AddLayers(netCfg2)
md.AddLayers(augDim, tf.nn.tanh)
cost2 = md.SquaredCost(md.Output(), augVar)

md.cost = cost1 +  c2Bias*cost2

#============================================================

ds2 = AugDataset(ds, md, augVar)
md.log.CfgHistogram(3, 'Generative Cost', 0)

def EpochCall(ep):
    cost = np.zeros([2], np.float32)
    for k in range(ds2.N):
        feed = {md.outputHod:ds2.Y[k]}
        feed.update(ds2.PushFeed(k))
        cost += md.sess.run([cost1, cost2], feed)
    msg = '%d,%d: %.1f, %.3f'%(co.job, ep, cost[0], cost[1])
    print(msg)
    g = md.log
    g.SetStatus(msg)
    g.ExtHistogram(3, cost[0], co.job)
    #g.ShowMatrix(ds2.aug, view=2, access='r', title='Job: %d, %s'%(co.job, co.jobArgument))
    return False 

md.SetAdamOptimizer(co.epochs, ds2.N)
md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, epCall=EpochCall)
md.log.ShowMatrix(ds2.Eval())
ds2.SaveAugment(co.modelName)
co.Save(md)
md.Save(co.modelName)

