#=========================================================================
# Model generator for Augmented Learning
#=========================================================================
from ModelUtil import *
from DataUtil import *

co = CmdOptions()
ds = ModelDataset('+', 'Nul')
md = ModelBuilder(job = co.job)
#========================================
# Load data
#========================================
ds.Y = ds.X
ds.X = np.mean(ds.X, axis=0)
#========================================

aFct = tf.nn.leaky_relu
L = 100
netCfg = 1*[L]
netCfg2 = 1*[L]
c2Bias = 1.0
md.r0 = 0.002
md.decay = 0.85

md.InitModel(0, ds.Y.shape[1])

augVar = md.AddAugment(aDim=2)
md.AddLayers(netCfg, aFct)
md.AddDropout(0.5)

md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
cost1 = md.SquaredCost(md.Output(), md.Label())
pMap = tf.identity(md.Output(), name='PhenoMap')

ds2 = AugDataset(ds, md, augVar)

with tf.name_scope('Recovery'):
    md.top = md.Label()
    md.AddLayers(netCfg2, aFct)
    md.AddLayers(ds2.augDim, tf.nn.tanh)
    cost2 = md.SquaredCost(md.Output(), ds2.augTensor)
    md.cost = cost1 +  c2Bias*cost2

#============================================================

md.log.CfgHistogram(3, 'Generative Cost', 0)
def EpochCall(ep):
    if ep % co.refreshFreq != 0: return False
    if md.keepProbVar is not None:
        if ep <= co.epochs//2:
            keepRate = 0.8 + 0.2 * 2 * ep/co.epochs
            #md.sess.run(tf.assign(md.keepProbVar, keepRate))
            md.keepProbVar.load(keepRate, md.sess)
    cost = np.zeros([2], np.float32)
    for k in range(ds2.N):
        feed = {md.outputHod:ds2.Y[k]}
        feed.update(ds2.PushFeed(k))
        cost += md.sess.run([cost1, cost2], feed)
    msg = 'Job:%d, Ep:%d, Costs:%.1f, %.3f'%(co.job, ep, cost[0], cost[1])
    print(msg)
    g = md.log
    g.ExtHistogram(3, cost[0], co.job)
    g.CfgHistogram(3, title=msg)
    g.ShowMatrix(ds2.aug, view=4, access='r', title='Augments: %d, %s'%(co.job, co.jobArgument), viewIdx=co.job)
    #g.ShowMatrix(ds2.Eval(), view=2, viewIdx=1, access='r', title='Output: %d, %s'%(co.job, co.jobArgument))
    return False 

md.modelInfo.update({'cBias':c2Bias, 'netCfg2':netCfg2})
ds2.SaveAugment(co.modelName)
co.Train(md, ds2, EpochCall)
