from ModelPrefix import *
from DataUtil import *

ds = ModelDataset('+', 'Nul')
md = ModelBuilder()

W = 28
R = np.reshape(ds.X[0], [W,W])
for i in range(W):
    R[i, i] = 0.5
    R[i, W-i-1] = 0.5
dsList = [(R, np.reshape(ds.X[i], [W,W])) for i in range(ds.N)]
ds.X = R
ds.Y = R

#=================================================================

md.InitModel(W, W)
#md.InitModel(0, W)
#md.top = tf.Variable(tf.zeros([4,28], dtype=tf.float32))

netCfg, netCfg2 = 5*[50], 2*[50]
md.r0 = 0.003
md.decay = 0.8
c2Bias = 0.2
md.batchSize = 4
augLayer = 3
augDimA = 25
augDimM = 3
aFct = tf.nn.leaky_relu
md.AddLayers(netCfg[:augLayer], aFct)
augVar = md.AddAugment(aDim=augDimA, mDim=augDimM)
md.AddLayers(netCfg[augLayer:], aFct)

md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
cost1 = md.SquaredCost(md.Output(), md.Label())
pMap = tf.identity(md.Output(), name='PhenoMap')

md.top = md.Label()
md.AddLayers(netCfg2, aFct)
md.AddLayers(int(augVar.shape[0]), tf.nn.tanh)
cost2 = md.SquaredCost(md.Output(), augVar)

md.cost = cost1 +  c2Bias*cost2

ds2 = AugDataset3(dsList, md, augVar)
md.log.CfgHistogram(3, 'Generative Cost', 0)
#md.log.CfgHistogram(4, 'Recovery Cost', 0)

#=================================================================

def EpochCall(ep):
    if ep % refreshFreq != 0: 
        return False

    cost = ds2.Validate(cost1, cost2)
    msg = '%d,%d: %.1f, %.3f'%(job, ep, cost[0], cost[1])
    print(msg)
    md.log.SetStatus(msg)
    md.log.ExtHistogram(3, cost[0], job)
    #md.log.ExtHistogram(4, cost[1], job)
    return False 

md.SetAdamOptimizer(epochs, ds2.N)
md.Train(ds2, epochs, logLevel, refreshFreq, epCall=EpochCall)

md.modelInfo.update({'c2Bias':c2Bias, 'netCfg2':netCfg2, 'netCfg':netCfg })
ds2.SaveAugment(modelName)
md.Save(modelName)
