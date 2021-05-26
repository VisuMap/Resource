#=========================================================================
# Testing augmented learning with various transformation of 3D balls.
#=========================================================================
import ModelUtil as mu
from AugUtil import *
from AugTest import *

#========================================
# create dataset list dsList[]
#========================================
co = mu.CmdOptions()
ds = mu.ModelDataset('Nul', 'Nul')
md = mu.ModelBuilder()
#========================================
netCfg, netCfg2, md.r0, md.decay, c2Bias = 5*[30], 2*[30], 0.0001, 0.8, 0.2
#varList = [3,4,5,13,10]
varList = [17]

X, Y, dsList = LoadTransMap(12, varList, md.log)
md.InitModel(X.shape[1], Y.shape[1])


'''
netCfg, netCfg2, md.r0, md.decay, c2Bias = 4*[250], 2*[50], 0.0001, 0.8, 0.01
X, Y, dsList = LoadTransMap(36, [16], md.log)
md.InitModel(X.shape[1], Y.shape[1])
augVar = md.AddAugment2(1+job, 0)
#augVar = md.AddAugment(aNodes=1+job*2)
'''


'''
# for the curve to 2-sphers test.
netCfg = 5*[250]
netCfg2, md.r0, md.decay, c2Bias = 2*[50], 0.0001, 0.8, 0.01
X, Y, dsList = LoadTransMap(12, [10,13], md.log)
md.InitModel(X.shape[1], Y.shape[1])
'''

'''
if md.log.OpenDataset(dsName='TwoSpheres', dataGroup=0) == False:
    print('Failed to open dataset.')
    quit()
X, Y, dsList = LoadMapList(['map%d'%k for k in range(1, 25)], md.log)
netCfg, netCfg2, md.r0, md.decay, c2Bias = 6*[200], 2*[50], 0.00075, 0.8, 0.01
md.InitModel(X.shape[1], Y.shape[1])
augVar = md.AddAugment(7)
'''

#============================================================
#ShowDatasetList(dsList, md.log); quit()
'''
ShowDatasetList2(dsList, md.log); quit()
ShowDatasetList(dsList, md.log); quit()
for i in range(X.shape[0]):
    a = i/X.shape[0]*math.pi*2
    X[i,:] = 500.0 * np.array([math.sin(20*a), math.cos(15*a), a/6.0])
'''
#============================================================

md.AddLayers(netCfg[:3])
augVar = md.AddAugment(mDim=4)
md.AddLayers(netCfg[3:])

#if job < 2: augVar = [augVar, md.GetVariable('Layer_2/bias:0')]

ds2 = AugDataset3(dsList, md, augVar)

md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
cost1 = md.SquaredCost(md.Output(), md.Label())
pMap = tf.identity(md.Output(), name='PhenoMap')

md.top = md.Label()
md.AddLayers(netCfg2)
md.AddLayers(ds2.augDim, tf.nn.tanh)
cost2 = md.SquaredCost(md.Output(), ds2.augTensor)

md.cost = cost1 +  c2Bias*cost2

#============================================================

md.log.CfgHistogram(3, 'Generative Cost', 0)
md.log.CfgHistogram(4, 'Recovery Cost', 0)

def EpochCall(ep):
    cost = ds2.Validate(cost1, cost2)
    msg = '%d,%d: %.1f, %.3f'%(co.job, ep, cost[0], cost[1])
    print(msg)
    md.log.SetStatus(msg)
    md.log.ExtHistogram(3, cost[0], co.job)
    md.log.ExtHistogram(4, cost[1], co.job)
    md.log.ShowMatrix(ds2.aug, rowInfo=len(varList)*[12], 
            view=2, access='r', title='Job: %d, %s'%(co.job, co.jobArgument))
    return False 

md.SetAdamOptimizer(co.epochs, ds2.N)
md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, epCall=EpochCall)

md.modelInfo.update({'c2Bias':c2Bias, 'netCfg2':netCfg2, 'netCfg':netCfg })
ds2.SaveAugment(co.modelName)
md.Save(co.modelName)
