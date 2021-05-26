#=========================================================================
# Augmented Autoencoder. 
# Test dataset/scripts: SP500/Augmented.client.js
#=========================================================================
from ModelPrefix import *
from DataUtil import *

ds = ModelDataset('+', 'Nul')
md = ModelBuilder()
#========================================
# create dataset list dsList[]
#========================================
ds.Y = ds.X
ds.X = None
aFct = tf.nn.leaky_relu
netCfg = 3*[250 * (1+job)]
netCfg2 = 2*[250]
c2Bias = 1.0
md.r0 = 0.0005
md.decay = 0.9
md.InitModel(0, ds.Y.shape[1])

augVar = tf.Variable(tf.zeros([250], dtype=tf.float32), name='Augment')
md.top = tf.reshape(augVar, [1, -1])
md.AddLayers(netCfg, aFct)

augDim = int(augVar.shape[0])
md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
cost1 = md.SquaredCost(md.Output(), md.Label())
pMap = tf.identity(md.Output(), name='PhenoMap')

md.top = md.Label()
md.AddLayers(netCfg2, aFct)
md.AddLayers(augDim, tf.nn.tanh)
cost2 = md.SquaredCost(md.Output(), augVar)

md.cost = cost1 +  c2Bias*cost2
#============================================================

ds2 = AugDataset(ds, md, augVar)

md.log.CfgHistogram(3, 'Generative Cost', 0)

def EpochCall(ep):
    if ep % refreshFreq != 0: return False
    cost = np.zeros([2], np.float32)
    for k in range(ds2.N):
        feed = {md.outputHod:ds2.Y[k]}
        feed.update(ds2.PushFeed(k))
        cost += md.sess.run([cost1, cost2], feed)
    msg = '%d,%d: %.1f, %.3f'%(job, ep, cost[0], cost[1])
    print(msg)
    g = md.log
    g.SetStatus(msg)
    g.ExtHistogram(3, cost[0], job)
    g.ShowMatrix(ds2.aug, view=2, access='r', title='Job: %d, %s'%(job, jobArgument))
    #g.ShowMatrix(ds2.Eval(), view=1, access='r')

    return False 

md.SetAdamOptimizer(epochs, ds2.N)
md.Train(ds2, epochs, logLevel, refreshFreq, epCall=EpochCall)
ds2.SaveAugment(modelName)
md.modelInfo.update( {'c2Bias':c2Bias, 'netCfg2':netCfg2} )
md.Save(modelName)

