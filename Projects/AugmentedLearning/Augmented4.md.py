#=========================================================================
# Augmented Learning: convert the S&P table to a list 498  10x5 datasets.
#========================================================================
from ModelPrefix import *
from DataUtil import *

#========================================
# create dataset list dsList[]
#========================================
ds = ModelDataset('+', 'Nul')
dsList = TableToList(ds.X, columns=5, freq=5)
md = ModelBuilder(dsList[0][0].shape[1], 5)
#===========================================

netCfg = 5*[200]
netCfg2 = 2*[30]
md.r0 = 0.001
md.decay = 0.85
c2Bias = 0.2
md.batchSize = 5
aFct = tf.nn.leaky_relu

'''
jj = ord(jobArgument) - ord('A')
if jj==0: 
    augVar = md.AddAugment(aDim=10, mDim=3)
for k, dim in enumerate(netCfg):
    md.AddLayers(dim, aFct)
    if jj==(k+1): 
        augVar = md.AddAugment(aDim=10,mDim=3)
'''

md.AddLayers(netCfg[:3], aFct)
augVar = md.AddAugment(aDim=25)
#augVar = md.GetVariable('Layer_2/bias:0')
md.AddLayers(netCfg[3:], aFct)

md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
cost1 = md.SquaredCost(md.Output(), md.Label())
pMap = tf.identity(md.Output(), name='PhenoMap')

md.top = md.Label()
md.AddLayers(netCfg2, aFct)
md.AddLayers(int(augVar.shape[0]), tf.nn.tanh)
cost2 = md.SquaredCost(md.Output(), augVar)

md.cost = cost1 +  c2Bias*cost2
#============================================================

md.log.CfgHistogram(3, 'Generative Cost', 0)
def EpochCall(ep):
    if ep % refreshFreq != 0: 
        return False

    c0, c1 = ds2.Validate(cost1, cost2)
    msg = '%d,%d: %.1f, %.3f'%(job, ep, c0, c1)
    print(msg)
    md.log.SetStatus(msg)
    md.log.ExtHistogram(3, c0, job)
    
    md.log.ShowMatrix(ds2.Eval(), view=1, access='r', title="Prediction: %d"%job)
    md.log.ShowMatrix(ds2.aug, view=2, access='r', title='Job: %d, %s'%(job, jobArgument))
    return False 

ds2 = AugDataset3(dsList, md, augVar)
md.SetAdamOptimizer(epochs, ds2.N)
md.Train(ds2, epochs, logLevel, refreshFreq, epCall=EpochCall)
ds2.SaveAugment(modelName)
md.Save(modelName)
