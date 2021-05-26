#=========================================================================
# Create MDS maps with augmented learning model 
# in two separated training stages.
#=========================================================================
import ModelUtil as mu
import numpy as np
import tensorflow as tf
from AugUtil import AugDataset

co = mu.CmdOptions()
ds = mu.ModelDataset('+', 'Nul')
md = mu.ModelBuilder(job = co.job)

co.Bed = 5, 1*[250], 2*[250], 1.0,  0.8, 0.01
co.GEOD = 25, 1*[200], 2*[250], 1.0,  0.825, 0.01    # 500 Epochs: cost: 0.6
co.MouseHeart = 10, [150], 0*[250], 1.0, 0.825, 0.002 # 500 Epochs: cost: 1.3 - 1.6
co.MouseTr = 10, [150], 0*[250], 1.0, 0.825, 0.002 #

augDim, netCfg, netCfg2, c2Bias, md.decay, md.r0 = co.MouseTr

ds.Y = ds.X
md.InitModel(0, ds.Y.shape[1])

with tf.name_scope('Decode'):
    augVar = md.AddAugment(aDim=augDim)
    md.AddLayers(netCfg)
    md.AddLayers(md.LabelDim(), tf.nn.sigmoid)
    pMap = tf.identity(md.Output(), name='PhenoMap')
    ds2 = AugDataset(ds, md, augVar)
    md.cost = md.SquaredCost(md.Output(), md.Label())

'''
with tf.name_scope('Encode'):
    md.top = md.Label()
    md.AddLayers(netCfg2)
    md.AddLayers(ds2.augDim, tf.nn.tanh)
    md.augHod = md.NewHolder([None, ds2.augDim], 'AugHolder')
    cost2 = md.SquaredCost(md.Output(), md.augHod)
'''

#============================================================
def EpochCall(ep):
    md.log.ShowMatrix(ds2.aug, view=2, access='r', 
        viewIdx=co.job, title='%d: %d %f'%(co.job, ep, md.lastError))
    return True

print('Training the decode graph...')
md.SetAdamOptimizer(co.epochs, ds2.N)
md.Train(ds2, co.epochs, co.logLevel, co.refreshFreq, EpochCall)

'''
ds2.SaveAugment(co.modelName)

print('Training the encode graph...')
ds.Y = ds2.aug
md.outputHod = md.augHod
md.SetVar(md.globalStep, 0)
md.cost = cost2
adam = tf.train.AdamOptimizer(md.learningRate)
md.trainTarget = adam.minimize(md.cost, global_step=md.globalStep)
md.sess.run(tf.variables_initializer(adam.variables()))
md.Train(ds, co.epochs, co.logLevel, co.refreshFreq)

#============================================================
co.Save(md)
md.Save(co.modelName)
'''