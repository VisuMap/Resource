#=========================================================================
# Model generator for classification and regression.
#=========================================================================
import tensorflow as tf
import ModelUtil as mu

co = mu.CmdOptions()
ds = mu.ModelDataset('+', 'ClrShp')
md = mu.ModelBuilder(ds.xDim, ds.yDim, job=co.job)

netCfg = 2*[ds.xDim] + [100]
cBias = 0.1       # the classification bias. 
md.r0 = 0.0001 * (5+co.job)

md.AddLayers(netCfg[0])
md.AddDropout()
md.AddLayers(netCfg[1:])

with tf.name_scope('Output'):
    md.AddLayers(ds.yDim, activation=None)
    md.AddFilter2(tf.nn.sigmoid, 0, ds.mapDim)
with tf.name_scope('Cost'):
    md.cost = md.MixedCost(md.Output(), md.Label(), ds.mapDim, cBias)

co.Train(md, ds)

