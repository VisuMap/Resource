#=========================================================================
# Model generator for Augmented Learning
#=========================================================================
from ModelPrefix import *
from DataUtil import *

#========================================
ds = ModelDataset('+', 'Nul')
md = ModelBuilder()
#========================================


netCfg = 5*[100]
netCfg2 = 2*[30]
c2Bias = 0.2
md.r0 = 0.001
md.decay = 0.8
md.batchSize = 10
md.InitModel(3, 1)
aFct = tf.nn.leaky_relu


md.AddLayers(netCfg[:3], aFct)
augVar = md.AddAugment(aDim=20)
md.AddLayers(netCfg[3:], aFct)

#if job < 2: augVar = [augVar, md.GetVariable('Layer_2/bias:0')]

ds2 = AugDataset2(ds, md, augVar, freq=6.0)

md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
cost1 = md.SquaredCost(md.Output(), md.Label())
pMap = tf.identity(md.Output(), name='PhenoMap')

md.top = md.Label()
md.AddLayers(netCfg2, aFct)
md.AddLayers(ds2.augDim, tf.nn.tanh)
cost2 = md.SquaredCost(md.Output(), ds2.augTensor)

md.cost = cost1 + c2Bias*cost2


#============================================================

md.log.CfgHistogram(3, 'Generative Cost', 0)
def EpochCall(ep):
    if ep % refreshFreq != 0: 
        return False
    cost = np.zeros([2], np.float32)
    for k in range(ds2.N):
        cost += md.Validate(ds2.X, ds2.Y[k], ds2.PushFeed(k), [cost1, cost2])
    msg = '%d,%d: %.1f, %.3f'%(job, ep, cost[0], cost[1])
    print(msg)
    md.log.SetStatus(msg)
    md.log.ExtHistogram(3, cost[0], job)

    md.log.ShowMatrix(ds2.Eval(), view=1, access='r', title="Prediction: %d"%job)
    return False 

md.SetAdamOptimizer(epochs, ds2.N*ds2.Columns)
md.Train(ds2, epochs, logLevel, refreshFreq, epCall=EpochCall)
ds2.SaveAugment(modelName)
md.Save(modelName)
